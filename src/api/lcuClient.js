const { EventEmitter } = require('events');
const https = require('https');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const WebSocket = require('ws');

// LCU HTTPS 자체 서명 인증서 허용
const httpsAgent = new https.Agent({ rejectUnauthorized: false });

class LCUClient extends EventEmitter {
  constructor(options = {}) {
    super();
    this.port = null;
    this.password = null;
    this.protocol = 'https';
    this.authHeader = null;
    this.ws = null;
    this._connected = false;
    this._searching = false;
    this._searchInterval = null;
    this._wsReconnectCount = 0;
    this._maxWsReconnect = 5;
    this._subscriptions = new Map();
    this._state = 'disconnected'; // disconnected | searching | connected

    // lockfile 탐색 경로 (사용자 지정 가능)
    this.lcuPath = options.lcuPath || null;
    this.autoDetect = options.autoDetect !== false;

    // 기본 lockfile 경로 목록
    this._defaultPaths = [
      'C:\\Riot Games\\League of Legends',
      'C:\\Riot Games\\Riot Client',
      'D:\\Riot Games\\League of Legends',
      'D:\\Riot Games\\Riot Client',
      path.join(process.env.PROGRAMFILES || 'C:\\Program Files', 'Riot Games', 'League of Legends'),
      path.join(process.env['PROGRAMFILES(X86)'] || 'C:\\Program Files (x86)', 'Riot Games', 'League of Legends')
    ];
  }

  // ─── 연결 관리 ─────────────────────────────

  async connect() {
    if (this._connected) return;

    this._setState('searching');

    // lockfile 찾기
    const lockData = await this._findLockfile();
    if (!lockData) {
      this._setState('disconnected');
      this.emit('error', new Error('lockfile을 찾을 수 없습니다'));
      // 주기적 재탐색 시작
      this._startSearchLoop();
      return;
    }

    // 연결 시도
    try {
      this.port = lockData.port;
      this.password = lockData.password;
      this.protocol = lockData.protocol;
      this.authHeader = 'Basic ' + Buffer.from(`riot:${this.password}`).toString('base64');

      // 연결 확인 (현재 소환사 정보 조회)
      await this.request('GET', '/lol-summoner/v1/current-summoner');

      this._connected = true;
      this._setState('connected');
      this._wsReconnectCount = 0;

      // WebSocket 연결
      await this._connectWebSocket();

      // lockfile 감시 (클라이언트 종료 감지)
      this._watchLockfile(lockData.filePath);

      this.emit('connected', { port: this.port });
    } catch (err) {
      this._connected = false;
      this._setState('disconnected');
      this.emit('error', err);
      // 재탐색
      this._startSearchLoop();
    }
  }

  async disconnect() {
    this._stopSearchLoop();
    this._closeWebSocket();
    this._connected = false;
    this.port = null;
    this.password = null;
    this.authHeader = null;
    this._setState('disconnected');
    this.emit('disconnected');
  }

  isConnected() {
    return this._connected;
  }

  getState() {
    return this._state;
  }

  // ─── HTTP 요청 ─────────────────────────────

  async request(method, endpoint, data = null) {
    if (!this.port || !this.authHeader) {
      throw new Error('LCU에 연결되지 않았습니다');
    }

    const axios = require('axios');
    const url = `${this.protocol}://127.0.0.1:${this.port}${endpoint}`;

    try {
      const config = {
        method,
        url,
        headers: {
          'Authorization': this.authHeader,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        httpsAgent,
        timeout: 5000
      };

      if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
        config.data = data;
      }

      const res = await axios(config);
      return res.data;
    } catch (err) {
      // 연결 실패 시 자동 재연결
      if (err.code === 'ECONNREFUSED' || err.code === 'ECONNRESET') {
        this._handleConnectionLost();
      }
      throw err;
    }
  }

  // ─── WebSocket ─────────────────────────────

  async _connectWebSocket() {
    if (this.ws) {
      this._closeWebSocket();
    }

    return new Promise((resolve, reject) => {
      const url = `wss://127.0.0.1:${this.port}/`;

      this.ws = new WebSocket(url, {
        headers: { 'Authorization': this.authHeader },
        rejectUnauthorized: false
      });

      this.ws.on('open', () => {
        // LCU WebSocket 이벤트 구독 (WAMP 프로토콜)
        // [5, "OnJsonApiEvent"] - 전체 이벤트 구독
        this.ws.send(JSON.stringify([5, 'OnJsonApiEvent']));
        resolve();
      });

      this.ws.on('message', (raw) => {
        try {
          const data = JSON.parse(raw.toString());
          // WAMP EVENT 메시지: [8, "topic", payload]
          if (Array.isArray(data) && data[0] === 8) {
            const payload = data[2];
            if (payload && payload.uri) {
              this._handleWsEvent(payload);
            }
          }
        } catch (e) {
          // 파싱 실패 무시
        }
      });

      this.ws.on('close', () => {
        if (this._connected) {
          this._handleWsDisconnect();
        }
      });

      this.ws.on('error', (err) => {
        if (this._connected) {
          this._handleWsDisconnect();
        }
        // open 전 에러면 reject
        if (this.ws?.readyState === WebSocket.CONNECTING) {
          reject(err);
        }
      });
    });
  }

  _closeWebSocket() {
    if (this.ws) {
      try { this.ws.close(); } catch (e) { /* 무시 */ }
      this.ws = null;
    }
  }

  async subscribeEvent(uri, callback) {
    if (!this._subscriptions.has(uri)) {
      this._subscriptions.set(uri, new Set());
    }
    this._subscriptions.get(uri).add(callback);
  }

  async unsubscribeEvent(uri, callback) {
    if (this._subscriptions.has(uri)) {
      if (callback) {
        this._subscriptions.get(uri).delete(callback);
      } else {
        this._subscriptions.delete(uri);
      }
    }
  }

  _handleWsEvent(payload) {
    const { uri, data, eventType } = payload;

    // 구독된 콜백 호출
    for (const [pattern, callbacks] of this._subscriptions) {
      if (uri === pattern || uri.startsWith(pattern)) {
        for (const cb of callbacks) {
          try { cb(data, eventType, uri); } catch (e) { /* 무시 */ }
        }
      }
    }

    // gameflow 변화 이벤트는 항상 발행
    if (uri === '/lol-gameflow/v1/gameflow-phase') {
      this.emit('gameflow-change', data);
    }

    // 모든 이벤트도 발행 (디버깅/확장용)
    this.emit('lcu-event', payload);
  }

  _handleWsDisconnect() {
    if (this._wsReconnectCount < this._maxWsReconnect) {
      this._wsReconnectCount++;
      setTimeout(() => {
        if (this._connected) {
          this._connectWebSocket().catch(() => {
            this._handleWsDisconnect();
          });
        }
      }, 2000 * this._wsReconnectCount);
    } else {
      // WebSocket 재연결 실패 → HTTP 폴링으로 fallback
      this.emit('ws-fallback');
    }
  }

  // ─── lockfile 탐색 ─────────────────────────

  async _findLockfile() {
    // 1. 사용자 지정 경로
    if (this.lcuPath) {
      const result = await this._readLockfile(path.join(this.lcuPath, 'lockfile'));
      if (result) return result;
    }

    // 2. 기본 경로 확인
    for (const dir of this._defaultPaths) {
      const result = await this._readLockfile(path.join(dir, 'lockfile'));
      if (result) return result;
    }

    // 3. 실행 중인 프로세스에서 경로 추출
    if (this.autoDetect) {
      const processPath = await this._findFromProcess();
      if (processPath) {
        const result = await this._readLockfile(path.join(processPath, 'lockfile'));
        if (result) return result;
      }
    }

    return null;
  }

  async _readLockfile(filePath) {
    return new Promise((resolve) => {
      fs.readFile(filePath, 'utf8', (err, content) => {
        if (err || !content) {
          resolve(null);
          return;
        }

        // 형식: LeagueClient:PID:PORT:PASSWORD:PROTOCOL
        const parts = content.trim().split(':');
        if (parts.length < 5) {
          // 불완전한 lockfile → 1초 후 재시도
          setTimeout(() => {
            fs.readFile(filePath, 'utf8', (err2, content2) => {
              if (err2 || !content2) { resolve(null); return; }
              const parts2 = content2.trim().split(':');
              if (parts2.length >= 5) {
                resolve({
                  filePath,
                  processName: parts2[0],
                  pid: parseInt(parts2[1]),
                  port: parseInt(parts2[2]),
                  password: parts2[3],
                  protocol: parts2[4]
                });
              } else {
                resolve(null);
              }
            });
          }, 1000);
          return;
        }

        resolve({
          filePath,
          processName: parts[0],
          pid: parseInt(parts[1]),
          port: parseInt(parts[2]),
          password: parts[3],
          protocol: parts[4]
        });
      });
    });
  }

  async _findFromProcess() {
    return new Promise((resolve) => {
      exec('wmic process where "name=\'LeagueClient.exe\'" get ExecutablePath /format:list', (err, stdout) => {
        if (err || !stdout) {
          resolve(null);
          return;
        }

        const match = stdout.match(/ExecutablePath=(.+)/);
        if (match) {
          const exePath = match[1].trim();
          resolve(path.dirname(exePath));
        } else {
          resolve(null);
        }
      });
    });
  }

  // ─── lockfile 감시 ─────────────────────────

  _watchLockfile(filePath) {
    // 주기적으로 lockfile 존재 확인 (파일 삭제 = 클라이언트 종료)
    this._lockfileWatchInterval = setInterval(() => {
      fs.access(filePath, fs.constants.F_OK, (err) => {
        if (err) {
          this._handleConnectionLost();
        }
      });
    }, 3000);
  }

  _handleConnectionLost() {
    if (!this._connected) return;

    this._connected = false;
    this._closeWebSocket();

    if (this._lockfileWatchInterval) {
      clearInterval(this._lockfileWatchInterval);
      this._lockfileWatchInterval = null;
    }

    this._setState('disconnected');
    this.emit('disconnected');

    // 자동 재탐색 시작
    this._startSearchLoop();
  }

  // ─── 주기적 탐색 루프 ──────────────────────

  _startSearchLoop() {
    this._stopSearchLoop();
    this._setState('searching');

    this._searchInterval = setInterval(async () => {
      if (this._connected) {
        this._stopSearchLoop();
        return;
      }

      const lockData = await this._findLockfile();
      if (lockData) {
        this._stopSearchLoop();
        // 연결 시도
        try {
          this.port = lockData.port;
          this.password = lockData.password;
          this.protocol = lockData.protocol;
          this.authHeader = 'Basic ' + Buffer.from(`riot:${this.password}`).toString('base64');

          await this.request('GET', '/lol-summoner/v1/current-summoner');

          this._connected = true;
          this._setState('connected');
          this._wsReconnectCount = 0;

          await this._connectWebSocket();
          this._watchLockfile(lockData.filePath);
          this.emit('connected', { port: this.port });
        } catch (err) {
          this._connected = false;
          this._setState('searching');
          // 다음 주기에 재시도
        }
      }
    }, 3000);
  }

  _stopSearchLoop() {
    if (this._searchInterval) {
      clearInterval(this._searchInterval);
      this._searchInterval = null;
    }
  }

  // ─── 상태 관리 ─────────────────────────────

  _setState(state) {
    if (this._state !== state) {
      this._state = state;
      this.emit('state-change', state);
    }
  }

  // ─── 정리 ──────────────────────────────────

  destroy() {
    this._stopSearchLoop();
    this._closeWebSocket();
    if (this._lockfileWatchInterval) {
      clearInterval(this._lockfileWatchInterval);
    }
    this._connected = false;
    this.removeAllListeners();
  }
}

module.exports = LCUClient;
