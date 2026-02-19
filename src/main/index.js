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
  let cfg = initApiWithConfig();

  pollInterval = setInterval(async () => {
    // 설정 없으면 안내만
    if (!cfg.apiKey) {
      sendToOverlay('status', { message: '메타 탭 → 설정에서 API 키를 입력하세요', type: 'error' });
      return;
    }
    if (!cfg.summonerName) {
      sendToOverlay('status', { message: '메타 탭 → 설정에서 소환사명을 입력하세요', type: 'error' });
      return;
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
          if (e.response?.status === 403) {
            sendToOverlay('status', { message: 'API 키 만료 또는 오류 — 메타 탭에서 갱신하세요', type: 'error' });
          } else {
            sendToOverlay('status', { message: 'API 키 또는 소환사 이름을 확인하세요', type: 'error' });
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
      if (err.response?.status === 403) {
        sendToOverlay('status', { message: 'API 키 만료 — 메타 탭 → 설정에서 새 키를 입력하세요', type: 'error' });
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

  // 런타임 env 업데이트 + API 재초기화
  riotApi.updateApiKey(apiKey);
  summonerPuuid = null;   // PUUID 재조회 강제
  inGame = false;

  // pollInterval의 cfg 클로저도 갱신되도록 재시작
  if (pollInterval) clearInterval(pollInterval);
  const newCfg = getConfig();
  riotApi = new RiotAPI(newCfg.apiKey, 'kr', 'asia');
  analyzer = new GameAnalyzer(riotApi);
  startGamePolling();

  sendToOverlay('status', { message: '설정이 저장되었습니다. 연결 중...', type: 'success' });
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
