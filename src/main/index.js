const { app, BrowserWindow, ipcMain, screen, Tray, Menu, nativeImage } = require('electron');
const path = require('path');
const fs = require('fs');

// ─────────────────────────────────────────────
//  설정 파일 경로: 설치 후에도 유저 폴더에 저장됨
//  Windows: C:\Users\유저\AppData\Roaming\tft-advisor\config.json
// ─────────────────────────────────────────────
let userDataPath = null;   // app.getPath('userData') → app ready 이후에만 사용 가능
let configPath = null;

function getConfig() {
  try {
    if (fs.existsSync(configPath)) {
      return JSON.parse(fs.readFileSync(configPath, 'utf8'));
    }
  } catch (e) { /* 무시 */ }
  return { apiKey: '', summonerName: '', tagline: 'KR1' };
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

const RiotAPI = require('../api/riotApi');
const GameAnalyzer = require('../engine/analyzer/gameAnalyzer');
const ScreenCapture = require('../engine/screenCapture');

let overlayWindow = null;
let dashboardWindow = null;
let tray = null;
let analyzer = null;
let riotApi = null;
let pollInterval = null;
let summonerPuuid = null;
let inGame = false;

const isDev = process.argv.includes('--dev');

function createOverlayWindow() {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.workAreaSize;

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
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  overlayWindow.loadFile(path.join(__dirname, '../renderer/overlay.html'));
  overlayWindow.setIgnoreMouseEvents(false);

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
  // 아이콘 파일 경로 (asar 내부)
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

function initApiWithConfig() {
  const cfg = getConfig();
  riotApi = new RiotAPI(
    cfg.apiKey || '',
    'kr',
    'asia'
  );
  analyzer = new GameAnalyzer(riotApi);

  // 소환사 PUUID 캐시 초기화 (설정 변경 시 재조회)
  summonerPuuid = null;
  inGame = false;

  return cfg;
}

async function startGamePolling() {
  pollInterval = setInterval(async () => {
    // 매 폴링마다 최신 설정을 디스크에서 읽음 (저장 후 즉시 반영)
    const cfg = getConfig();

    // 설정 없으면 안내만
    if (!cfg.apiKey) {
      sendToOverlay('status', { message: '메타 탭 → 설정에서 API 키를 입력하세요', type: 'error' });
      return;
    }
    if (!cfg.summonerName) {
      sendToOverlay('status', { message: '메타 탭 → 설정에서 소환사명을 입력하세요', type: 'error' });
      return;
    }

    // API 키가 바뀌었으면 riotApi 키 갱신
    if (riotApi && riotApi.apiKey !== cfg.apiKey) {
      riotApi.updateApiKey(cfg.apiKey);
      summonerPuuid = null; // 키 바뀌면 PUUID 재조회
    }

    try {
      // PUUID 아직 없으면 조회
      if (!summonerPuuid) {
        try {
          const accountData = await riotApi.getAccountByRiotId(
            cfg.summonerName,
            cfg.tagline || 'KR1'
          );
          summonerPuuid = accountData.puuid;
          sendToOverlay('status', { message: `연결됨: ${cfg.summonerName}#${cfg.tagline}`, type: 'success' });
        } catch (e) {
          const status = e.response?.status;
          if (status === 401 || status === 403) {
            sendToOverlay('status', { message: 'API 키 오류 — developer.riotgames.com에서 Regenerate 후 다시 입력하세요', type: 'error' });
          } else if (status === 404) {
            sendToOverlay('status', { message: `소환사를 찾을 수 없습니다 — 닉네임/태그 확인 (입력값: ${cfg.summonerName}#${cfg.tagline})`, type: 'error' });
          } else {
            sendToOverlay('status', { message: `연결 실패 (${status || '네트워크 오류'}) — 잠시 후 재시도합니다`, type: 'error' });
          }
          return;
        }
      }

      // 현재 게임 조회
      const activeGame = await riotApi.getActiveGame(summonerPuuid);

      if (activeGame && activeGame.gameType === 'MATCHED') {
        if (!inGame) {
          inGame = true;
          sendToOverlay('game_start', { gameId: activeGame.gameId });
        }
        const analysis = await analyzer.analyzeActiveGame(activeGame, summonerPuuid);
        sendToOverlay('update', analysis);
      } else if (inGame) {
        inGame = false;
        sendToOverlay('game_end', {});
      } else {
        sendToOverlay('status', { message: `${cfg.summonerName} — 게임 대기 중`, type: 'idle' });
      }

    } catch (err) {
      const status = err.response?.status;
      if (status === 403) {
        // Spectator API는 Development Key로 접근 불가 (403) → 게임 대기 중으로 처리
        if (inGame) { inGame = false; sendToOverlay('game_end', {}); }
        sendToOverlay('status', { message: `${cfg.summonerName} — 게임 대기 중 (Spectator 권한 없음)`, type: 'idle' });
      } else if (status === 401) {
        sendToOverlay('status', { message: 'API 키 오류 — developer.riotgames.com에서 Regenerate 후 다시 입력하세요', type: 'error' });
        summonerPuuid = null;
      }
      // 404는 게임 중 아님(정상), 무시
    }
  }, 10000);
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

// 렌더러가 시작 시 현재 설정값을 요청
ipcMain.handle('get-config', () => {
  return getConfig();
});

// 설정 저장 (API 키 + 소환사명 한번에)
ipcMain.on('save-config', (event, { apiKey, summonerName, tagline }) => {
  const cfg = { apiKey, summonerName, tagline: tagline || 'KR1' };
  saveConfig(cfg);

  // PUUID 초기화 → 다음 폴링(최대 10초)에 새 설정으로 자동 재시도
  summonerPuuid = null;
  inGame = false;

  sendToOverlay('status', { message: '설정 저장됨 — 10초 내로 연결을 시도합니다', type: 'idle' });
});

ipcMain.handle('get-screenshot-analysis', async () => {
  const capture = new ScreenCapture();
  return await capture.analyzeCurrentScreen();
});

// ─── 앱 초기화 ───────────────────────────────

app.whenReady().then(() => {
  // userData 경로 초기화 (app ready 이후에만 가능)
  userDataPath = app.getPath('userData');
  configPath = path.join(userDataPath, 'config.json');

  // 초기 API 객체 생성 (폴링에서 매번 최신 cfg 읽으므로 빈 키로 시작해도 무방)
  const initCfg = getConfig();
  riotApi = new RiotAPI(initCfg.apiKey || '', 'kr', 'asia');
  analyzer = new GameAnalyzer(riotApi);

  createOverlayWindow();
  createTray();
  startGamePolling();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createOverlayWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    if (pollInterval) clearInterval(pollInterval);
    app.quit();
  }
});
