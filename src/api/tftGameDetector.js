const { EventEmitter } = require('events');

// TFT 관련 queueId
const TFT_QUEUE_IDS = new Set([
  1090, // TFT 일반
  1100, // TFT 랭크
  1130, // TFT 하이퍼롤
  1160  // TFT 더블업
]);

class TFTGameDetector extends EventEmitter {
  constructor(lcuClient) {
    super();
    this.lcu = lcuClient;
    this._gamePhase = 'None';
    this._isRunning = false;
    this._isTFTGame = false;
    this._sessionData = null;
    this._pollingInterval = null;
    this._usePolling = false; // WebSocket 실패 시 HTTP 폴링 fallback

    this._onGameflowChange = this._onGameflowChange.bind(this);
    this._onWsFallback = this._onWsFallback.bind(this);
  }

  async start() {
    if (this._isRunning) return;
    this._isRunning = true;

    // WebSocket 이벤트 구독
    this.lcu.on('gameflow-change', this._onGameflowChange);
    this.lcu.on('ws-fallback', this._onWsFallback);

    // 현재 상태 즉시 확인
    await this._checkCurrentPhase();
  }

  async stop() {
    this._isRunning = false;
    this.lcu.off('gameflow-change', this._onGameflowChange);
    this.lcu.off('ws-fallback', this._onWsFallback);

    if (this._pollingInterval) {
      clearInterval(this._pollingInterval);
      this._pollingInterval = null;
    }
  }

  getGamePhase() {
    return this._gamePhase;
  }

  isInGame() {
    return this._isTFTGame && this._gamePhase === 'InProgress';
  }

  getSessionData() {
    return this._sessionData;
  }

  // ─── 게임 상태 변화 처리 ────────────────────

  async _onGameflowChange(phase) {
    const prevPhase = this._gamePhase;
    this._gamePhase = phase;

    this.emit('phase-change', { phase, prevPhase });

    if (phase === 'ChampSelect' || phase === 'InProgress') {
      // 게임 세션 확인 → TFT인지 체크
      await this._checkGameSession();

      if (phase === 'InProgress' && this._isTFTGame && prevPhase !== 'InProgress') {
        this.emit('game-start', {
          session: this._sessionData,
          phase
        });
      }
    } else if (phase === 'WaitingForStats' || phase === 'EndOfGame' || phase === 'None') {
      if (this._isTFTGame && (prevPhase === 'InProgress' || prevPhase === 'WaitingForStats')) {
        this._isTFTGame = false;
        this.emit('game-end', {
          session: this._sessionData,
          phase
        });
        this._sessionData = null;
      }
    }
  }

  async _checkCurrentPhase() {
    try {
      const phase = await this.lcu.request('GET', '/lol-gameflow/v1/gameflow-phase');
      if (phase && typeof phase === 'string') {
        await this._onGameflowChange(phase);
      }
    } catch (e) {
      // 에러 무시 — 아직 게임이 시작되지 않은 상태
      this._gamePhase = 'None';
    }
  }

  async _checkGameSession() {
    try {
      const session = await this.lcu.request('GET', '/lol-gameflow/v1/session');

      if (session && session.gameData) {
        const queueId = session.gameData.queue?.id || session.map?.gameQueueConfigId || 0;
        this._isTFTGame = TFT_QUEUE_IDS.has(queueId);
        this._sessionData = session;

        // queueId로 판별 실패 시 gameMode로 재확인
        if (!this._isTFTGame && session.gameData.gameMode) {
          this._isTFTGame = session.gameData.gameMode === 'TFT';
        }
      }
    } catch (e) {
      // 세션 조회 실패 — 게임 로비가 아직 없을 수 있음
    }
  }

  // ─── HTTP 폴링 fallback ─────────────────────

  _onWsFallback() {
    if (this._usePolling) return;
    this._usePolling = true;

    this._pollingInterval = setInterval(async () => {
      if (!this._isRunning || !this.lcu.isConnected()) return;
      await this._checkCurrentPhase();
    }, 5000);
  }
}

module.exports = TFTGameDetector;
