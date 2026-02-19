require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const { app, BrowserWindow, ipcMain, screen, Tray, Menu, nativeImage } = require('electron');
const path = require('path');
const RiotAPI = require('../api/riotApi');
const GameAnalyzer = require('../engine/analyzer/gameAnalyzer');
const ScreenCapture = require('../engine/screenCapture');

let overlayWindow = null;
let dashboardWindow = null;
let tray = null;
let analyzer = null;
let pollInterval = null;

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
    focusable: false,
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
  const icon = nativeImage.createEmpty();
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

async function startGamePolling() {
  const riotApi = new RiotAPI(
    process.env.RIOT_API_KEY,
    process.env.REGION || 'kr',
    process.env.PLATFORM || 'asia'
  );

  analyzer = new GameAnalyzer(riotApi);

  let inGame = false;
  let summonerPuuid = null;

  pollInterval = setInterval(async () => {
    try {
      if (!summonerPuuid && process.env.SUMMONER_NAME) {
        try {
          const accountData = await riotApi.getAccountByRiotId(
            process.env.SUMMONER_NAME,
            process.env.TAGLINE || 'KR1'
          );
          summonerPuuid = accountData.puuid;
          sendToOverlay('status', { message: `소환사 찾음: ${process.env.SUMMONER_NAME}`, type: 'success' });
        } catch (e) {
          sendToOverlay('status', { message: 'API 키 또는 소환사 이름을 확인하세요', type: 'error' });
          return;
        }
      }

      if (summonerPuuid) {
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
          sendToOverlay('status', { message: '게임 대기 중... (로비 또는 클라이언트)', type: 'idle' });
        }
      }
    } catch (err) {
      if (err.response?.status === 403) {
        sendToOverlay('status', { message: 'API 키 만료 - .env 파일에서 갱신 필요', type: 'error' });
      } else if (err.response?.status === 404) {
        // 게임 중 아님 - 정상
      }
    }
  }, 10000); // 10초마다 폴링
}

function sendToOverlay(event, data) {
  if (overlayWindow && !overlayWindow.isDestroyed()) {
    overlayWindow.webContents.send(event, data);
  }
  if (dashboardWindow && !dashboardWindow.isDestroyed()) {
    dashboardWindow.webContents.send(event, data);
  }
}

// IPC 핸들러
ipcMain.on('set-ignore-mouse', (event, ignore) => {
  if (overlayWindow) {
    overlayWindow.setIgnoreMouseEvents(ignore, { forward: true });
  }
});

ipcMain.on('update-api-key', (event, apiKey) => {
  process.env.RIOT_API_KEY = apiKey;
  const fs = require('fs');
  const envPath = path.join(__dirname, '../../.env');
  let content = fs.readFileSync(envPath, 'utf8');
  content = content.replace(/RIOT_API_KEY=.*/, `RIOT_API_KEY=${apiKey}`);
  fs.writeFileSync(envPath, content);
  sendToOverlay('status', { message: 'API 키가 업데이트되었습니다', type: 'success' });
});

ipcMain.on('update-summoner', (event, { name, tagline }) => {
  process.env.SUMMONER_NAME = name;
  process.env.TAGLINE = tagline;
  const fs = require('fs');
  const envPath = path.join(__dirname, '../../.env');
  let content = fs.readFileSync(envPath, 'utf8');
  content = content.replace(/SUMMONER_NAME=.*/, `SUMMONER_NAME=${name}`);
  content = content.replace(/TAGLINE=.*/, `TAGLINE=${tagline}`);
  fs.writeFileSync(envPath, content);
});

ipcMain.handle('get-screenshot-analysis', async () => {
  const capture = new ScreenCapture();
  return await capture.analyzeCurrentScreen();
});

app.whenReady().then(() => {
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
