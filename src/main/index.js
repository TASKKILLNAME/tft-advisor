const { app, BrowserWindow, ipcMain, screen, Tray, Menu, nativeImage, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

// ─────────────────────────────────────────────
//  설정 파일 경로: 설치 후에도 유저 폴더에 저장됨
//  Windows: C:\Users\유저\AppData\Roaming\tft-advisor\config.json
// ─────────────────────────────────────────────
let userDataPath = null;
let configPath = null;

function getConfig() {
  try {
    if (fs.existsSync(configPath)) {
      const raw = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      // 새 스키마로 마이그레이션
      return {
        lcuPath: raw.lcuPath || '',
        autoDetect: raw.autoDetect !== false,
        riotApiKey: raw.riotApiKey || raw.apiKey || '',
        overlayPosition: raw.overlayPosition || { x: null, y: null },
        overlayOpacity: raw.overlayOpacity || 0.9
      };
    }
  } catch (e) { /* 무시 */ }
  return {
    lcuPath: '',
    autoDetect: true,
    riotApiKey: '',
    overlayPosition: { x: null, y: null },
    overlayOpacity: 0.9
  };
}

function saveConfig(cfg) {
  try {
    fs.mkdirSync(userDataPath, { recursive: true });
    fs.writeFileSync(configPath, JSON.stringify(cfg, null, 2), 'utf8');
  } catch (e) {
    console.error('설정 저장 실패:', e.message);
  }
}

// ─────────────────────────────────────────────

const LCUClient = require('../api/lcuClient');
const TFTGameDetector = require('../api/tftGameDetector');
const TFTLiveData = require('../api/tftLiveData');
const GameAnalyzer = require('../engine/analyzer/gameAnalyzer');
const ScreenCapture = require('../engine/screenCapture');

let overlayWindow = null;
let dashboardWindow = null;
let tray = null;
let analyzer = null;
let lcuClient = null;
let gameDetector = null;
let liveData = null;
let summonerInfo = null;
let inGame = false;

const isDev = process.argv.includes('--dev');

function createOverlayWindow() {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width } = primaryDisplay.workAreaSize;

  overlayWindow = new BrowserWindow({
    width: 380,
    height: 720,
    x: width - 400,
    y: 40,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: true,
    movable: true,
    focusable: true,
    show: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  overlayWindow.loadFile(path.join(__dirname, '../renderer/overlay.html'));
  overlayWindow.setIgnoreMouseEvents(false);

  // ready-to-show 이벤트에서 표시
  overlayWindow.once('ready-to-show', () => {
    overlayWindow.show();
    console.log('[TFT Advisor] 오버레이 윈도우 표시 완료');
  });

  // 크래시 핸들러: 자동 재로드
  overlayWindow.webContents.on('crashed', (event, killed) => {
    console.error('[TFT Advisor] 오버레이 렌더러 크래시 감지, 재로드 시도...', { killed });
    setTimeout(() => {
      if (overlayWindow && !overlayWindow.isDestroyed()) {
        overlayWindow.reload();
      }
    }, 1000);
  });

  // 로드 실패 핸들러
  overlayWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('[TFT Advisor] 오버레이 로드 실패:', errorCode, errorDescription);
    setTimeout(() => {
      if (overlayWindow && !overlayWindow.isDestroyed()) {
        overlayWindow.loadFile(path.join(__dirname, '../renderer/overlay.html'));
      }
    }, 2000);
  });

  // 로드 완료 로그
  overlayWindow.webContents.on('did-finish-load', () => {
    console.log('[TFT Advisor] 오버레이 HTML 로드 완료');
  });

  if (isDev) {
    overlayWindow.webContents.openDevTools({ mode: 'detach' });
  }
}

function createDashboardWindow() {
  dashboardWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    frame: true,
    transparent: false,
    alwaysOnTop: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  dashboardWindow.loadFile(path.join(__dirname, '../renderer/dashboard.html'));

  dashboardWindow.on('closed', () => {
    dashboardWindow = null;
  });
}

function createTray() {
  const iconPath = path.join(__dirname, '../../assets/icon.ico');
  const icon = fs.existsSync(iconPath)
    ? nativeImage.createFromPath(iconPath)
    : nativeImage.createEmpty();

  tray = new Tray(icon);

  const contextMenu = Menu.buildFromTemplate([
    { label: 'TFT Advisor', enabled: false },
    { type: 'separator' },
    { label: '대시보드 열기', click: () => {
      if (!dashboardWindow) createDashboardWindow();
      else dashboardWindow.focus();
    }},
    { label: '오버레이 토글', click: () => {
      if (overlayWindow) {
        if (overlayWindow.isVisible()) overlayWindow.hide();
        else overlayWindow.show();
      }
    }},
    { type: 'separator' },
    { label: '종료', click: () => app.quit() }
  ]);

  tray.setToolTip('TFT Advisor');
  tray.setContextMenu(contextMenu);
}

// ─── LCU 기반 게임 흐름 ──────────────────────

async function initLCU() {
  const cfg = getConfig();

  // LCU 클라이언트 생성
  lcuClient = new LCUClient({
    lcuPath: cfg.lcuPath || null,
    autoDetect: cfg.autoDetect
  });

  // GameAnalyzer는 riotApi 없이도 메타 데이터 기반 분석 가능
  analyzer = new GameAnalyzer(null);

  // LCU 이벤트 핸들러
  lcuClient.on('state-change', (state) => {
    switch (state) {
      case 'searching':
        sendToOverlay('lcu-status', { state: 'searching', message: '클라이언트 연결 중...' });
        break;
      case 'disconnected':
        sendToOverlay('lcu-status', { state: 'disconnected', message: 'TFT 클라이언트를 실행해주세요' });
        summonerInfo = null;
        break;
      case 'connected':
        onLCUConnected();
        break;
    }
  });

  lcuClient.on('disconnected', () => {
    if (inGame) {
      inGame = false;
      sendToOverlay('game_end', {});
    }
    if (gameDetector) gameDetector.stop();
    summonerInfo = null;
  });

  lcuClient.on('error', (err) => {
    if (isDev) console.error('LCU error:', err.message);
  });

  // 연결 시작
  sendToOverlay('lcu-status', { state: 'searching', message: '클라이언트 검색 중...' });
  await lcuClient.connect();
}

async function onLCUConnected() {
  // 소환사 정보 자동 조회
  liveData = new TFTLiveData(lcuClient);
  summonerInfo = await liveData.getCurrentSummoner();

  if (summonerInfo) {
    const displayName = summonerInfo.gameName
      ? `${summonerInfo.gameName}#${summonerInfo.tagLine}`
      : summonerInfo.displayName || '소환사';

    sendToOverlay('lcu-status', {
      state: 'connected',
      message: `연결됨: ${displayName}`,
      summoner: {
        name: summonerInfo.gameName || summonerInfo.displayName,
        tagLine: summonerInfo.tagLine || '',
        puuid: summonerInfo.puuid,
        profileIconId: summonerInfo.profileIconId,
        summonerLevel: summonerInfo.summonerLevel
      }
    });

    // 랭크 정보 조회
    const rankData = await liveData.getSummonerRank(summonerInfo.puuid);
    if (rankData) {
      sendToOverlay('rank-info', rankData);
    }
  } else {
    sendToOverlay('lcu-status', {
      state: 'connected',
      message: '연결됨 (소환사 정보 조회 중...)'
    });
  }

  // 게임 감지 시작
  gameDetector = new TFTGameDetector(lcuClient);

  gameDetector.on('game-start', async (data) => {
    inGame = true;
    sendToOverlay('game_start', { gameId: data.session?.gameData?.gameId || 0 });

    // 로비 참가자 정보 조회 + 랭크 조회
    fetchAndSendLobbyInfo();

    // 메타 기반 분석 제공
    provideMetaAnalysis();
  });

  gameDetector.on('game-end', () => {
    inGame = false;
    liveData.stopPolling();
    sendToOverlay('game_end', {});

    if (summonerInfo) {
      const displayName = summonerInfo.gameName
        ? `${summonerInfo.gameName}#${summonerInfo.tagLine}`
        : summonerInfo.displayName;
      sendToOverlay('lcu-status', {
        state: 'connected',
        message: `${displayName} — 게임 대기 중`
      });
    }
  });

  gameDetector.on('phase-change', ({ phase }) => {
    sendToOverlay('phase-change', { phase });
  });

  await gameDetector.start();

  // 이미 게임 중이면 바로 분석
  if (gameDetector.isInGame()) {
    inGame = true;
    sendToOverlay('game_start', { gameId: 0 });
    provideMetaAnalysis();
  } else {
    const displayName = summonerInfo
      ? (summonerInfo.gameName ? `${summonerInfo.gameName}#${summonerInfo.tagLine}` : summonerInfo.displayName)
      : '소환사';
    sendToOverlay('lcu-status', {
      state: 'connected',
      message: `${displayName} — 게임 대기 중`
    });
  }
}

async function fetchAndSendLobbyInfo() {
  if (!liveData) return;

  try {
    const participants = await liveData.getGameParticipants();
    if (!participants?.length) return;

    const myPuuid = summonerInfo?.puuid;
    const playersData = [];

    for (const p of participants) {
      const rank = await liveData.getSummonerRank(p.puuid);
      playersData.push({
        name: p.name,
        puuid: p.puuid,
        rank: rank || null,
        isMe: p.puuid === myPuuid,
      });
    }

    sendToOverlay('lobby-info', playersData);
  } catch (e) {
    if (isDev) console.error('로비 정보 조회 실패:', e.message);
  }
}

function provideMetaAnalysis() {
  // LCU에서는 인게임 실시간 필드 데이터 접근이 제한적
  // → 메타 기반 추천 데이터를 제공
  const analysis = analyzer.getMetaBasedAnalysis();
  sendToOverlay('update', analysis);

  sendToOverlay('lcu-status', {
    state: 'ingame',
    message: '게임 감지됨 — 메타 기반 분석 중'
  });
}

function sendToOverlay(event, data) {
  if (overlayWindow && !overlayWindow.isDestroyed()) {
    overlayWindow.webContents.send(event, data);
  }
  if (dashboardWindow && !dashboardWindow.isDestroyed()) {
    dashboardWindow.webContents.send(event, data);
  }
}

// ─── IPC 핸들러 ──────────────────────────────

ipcMain.on('set-ignore-mouse', (event, ignore) => {
  if (overlayWindow) {
    overlayWindow.setIgnoreMouseEvents(ignore, { forward: true });
  }
});

ipcMain.handle('get-config', () => {
  return getConfig();
});

// 설정 저장 (LCU 경로 등)
ipcMain.on('save-config', (event, newCfg) => {
  const cfg = getConfig();
  Object.assign(cfg, newCfg);
  saveConfig(cfg);

  // LCU 경로가 변경되었으면 재연결
  if (newCfg.lcuPath !== undefined && lcuClient) {
    lcuClient.lcuPath = newCfg.lcuPath || null;
    lcuClient.disconnect().then(() => lcuClient.connect());
  }

  sendToOverlay('status', { message: '설정이 저장되었습니다', type: 'success' });
});

// LCU 클라이언트 경로 직접 선택
ipcMain.handle('select-lcu-path', async () => {
  const result = await dialog.showOpenDialog({
    title: 'League of Legends 설치 폴더 선택',
    properties: ['openDirectory'],
    defaultPath: 'C:\\Riot Games\\League of Legends'
  });

  if (!result.canceled && result.filePaths.length > 0) {
    const selectedPath = result.filePaths[0];
    // lockfile 존재 확인
    const lockfilePath = path.join(selectedPath, 'lockfile');
    const hasLockfile = fs.existsSync(lockfilePath);

    // 설정에 저장
    const cfg = getConfig();
    cfg.lcuPath = selectedPath;
    saveConfig(cfg);

    // LCU 클라이언트 경로 업데이트
    if (lcuClient) {
      lcuClient.lcuPath = selectedPath;
      if (!lcuClient.isConnected()) {
        lcuClient.disconnect().then(() => lcuClient.connect());
      }
    }

    return { path: selectedPath, hasLockfile };
  }
  return null;
});

// LCU 연결 상태 조회
ipcMain.handle('get-lcu-state', () => {
  return {
    state: lcuClient?.getState() || 'disconnected',
    summoner: summonerInfo ? {
      name: summonerInfo.gameName || summonerInfo.displayName,
      tagLine: summonerInfo.tagLine || '',
      puuid: summonerInfo.puuid
    } : null,
    inGame
  };
});

ipcMain.handle('get-screenshot-analysis', async () => {
  const capture = new ScreenCapture();
  return await capture.analyzeCurrentScreen();
});

// ─── 앱 초기화 ───────────────────────────────

app.whenReady().then(() => {
  userDataPath = app.getPath('userData');
  configPath = path.join(userDataPath, 'config.json');

  createOverlayWindow();
  createTray();

  // LCU 연결 시작 (오버레이 로드 후 약간의 딜레이)
  setTimeout(() => initLCU(), 1000);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createOverlayWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    if (lcuClient) lcuClient.destroy();
    if (gameDetector) gameDetector.stop();
    if (liveData) liveData.destroy();
    app.quit();
  }
});
