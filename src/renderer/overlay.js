const { ipcRenderer } = require('electron');
const { AUGMENT_TIERS, ECONOMY_GUIDE } = require('../engine/tftData');
const PatchAnalyzer = require('../engine/patchAnalyzer');

const patchAnalyzer = new PatchAnalyzer();
let currentData = null;
let isMinimized = false;
let opacityLevel = 0.88;
const opacityLevels = [0.88, 0.7, 0.5, 0.3];
let opacityIdx = 0;

// --- DOM 레퍼런스 ---
const idleScreen = document.getElementById('idle-screen');
const gameInfo = document.getElementById('game-info');
const tabsEl = document.getElementById('tabs');
const contentEl = document.getElementById('content');

// --- 마우스 진입/이탈: 오버레이 위에서는 클릭 가능, 벗어나면 게임으로 통과 ---
const appEl = document.getElementById('app');

appEl.addEventListener('mouseenter', () => {
  ipcRenderer.send('set-ignore-mouse', false);
});

appEl.addEventListener('mouseleave', () => {
  const focused = document.activeElement;
  const isTyping = focused && (focused.tagName === 'INPUT' || focused.tagName === 'TEXTAREA');
  if (!isTyping) {
    ipcRenderer.send('set-ignore-mouse', true);
  }
});

document.addEventListener('blur', (e) => {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
    ipcRenderer.send('set-ignore-mouse', true);
  }
}, true);

ipcRenderer.send('set-ignore-mouse', false);

// --- 탭 전환 ---
document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    tab.classList.add('active');
    const targetId = `tab-${tab.dataset.tab}`;
    const target = document.getElementById(targetId);
    if (target) target.classList.add('active');
  });
});

// --- 컨트롤 버튼 ---
document.getElementById('btn-minimize').addEventListener('click', () => {
  isMinimized = !isMinimized;
  contentEl.style.display = isMinimized ? 'none' : '';
  tabsEl.style.display = isMinimized ? 'none' : '';
});

document.getElementById('btn-opacity').addEventListener('click', () => {
  opacityIdx = (opacityIdx + 1) % opacityLevels.length;
  opacityLevel = opacityLevels[opacityIdx];
  document.getElementById('app').style.background = `rgba(10, 12, 20, ${opacityLevel})`;
});

document.getElementById('btn-meta').addEventListener('click', () => {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
  document.querySelector('[data-tab="meta"]').classList.add('active');
  document.getElementById('tab-meta').classList.add('active');
});

// --- 설정 저장 (LCU 기반) ---
document.getElementById('save-settings-btn').addEventListener('click', () => {
  const riotApiKey = document.getElementById('riot-api-key-input').value.trim();

  ipcRenderer.send('save-config', { riotApiKey });
  updateStatus('설정이 저장되었습니다', 'success');
});

// --- 클라이언트 경로 선택 ---
document.getElementById('browse-lcu-path-btn').addEventListener('click', async () => {
  const result = await ipcRenderer.invoke('select-lcu-path');
  if (result) {
    document.getElementById('lcu-path-input').value = result.path;
    if (result.hasLockfile) {
      updateStatus('클라이언트 경로 설정됨 — 연결 시도 중...', 'idle');
    } else {
      updateStatus('경로 저장됨 — 클라이언트 실행 후 자동 연결됩니다', 'idle');
    }
  }
});

// --- IPC 이벤트 ---

// LCU 연결 상태
ipcRenderer.on('lcu-status', (event, data) => {
  const { state, message, summoner } = data;

  switch (state) {
    case 'disconnected':
      updateStatus(message, 'error');
      updateLCUDetail('연결 안 됨 — TFT 클라이언트를 실행해주세요');
      break;
    case 'searching':
      updateStatus(message, 'idle');
      updateLCUDetail('클라이언트 검색 중...');
      break;
    case 'connected':
      updateStatus(message, 'success');
      if (summoner) {
        updateLCUDetail(`연결됨: ${summoner.name}${summoner.tagLine ? '#' + summoner.tagLine : ''} (Lv.${summoner.summonerLevel || '?'})`);
      } else {
        updateLCUDetail('연결됨');
      }
      break;
    case 'ingame':
      updateStatus(message, 'active');
      break;
  }
});

// 랭크 정보
ipcRenderer.on('rank-info', (event, data) => {
  if (data) {
    const detailEl = document.getElementById('lcu-connection-detail');
    const currentText = detailEl.textContent;
    const rankStr = `${data.tier || '?'} ${data.division || ''} ${data.leaguePoints || 0}LP`;
    detailEl.innerHTML = `${currentText}<br><span style="color:#c8aa64;font-size:10px">TFT 랭크: ${rankStr}</span>`;
  }
});

// 기존 이벤트 호환
ipcRenderer.on('status', (event, data) => {
  updateStatus(data.message, data.type);
});

ipcRenderer.on('game_start', (event, data) => {
  showGameMode();
  updateStatus(`게임 시작! (ID: ${data.gameId?.toString().slice(-6) || '?'})`, 'active');
});

ipcRenderer.on('game_end', (event) => {
  hideGameMode();
  updateStatus('게임 종료 - 다음 게임 대기 중', 'idle');
});

ipcRenderer.on('update', (event, data) => {
  if (!data || data.error) return;
  currentData = data;
  renderAll(data);
});

// --- 상태 업데이트 ---
function updateStatus(message, type = 'idle') {
  const dot = document.getElementById('status-dot');
  const text = document.getElementById('status-text');

  dot.className = `status-dot ${type}`;
  text.textContent = message;
}

function updateLCUDetail(text) {
  const el = document.getElementById('lcu-connection-detail');
  if (el) el.textContent = text;
}

// --- 게임 모드 표시 ---
function showGameMode() {
  idleScreen.classList.add('hidden');
  gameInfo.classList.remove('hidden');
  document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
  document.getElementById('tab-comp').classList.add('active');
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.querySelector('[data-tab="comp"]').classList.add('active');
}

function hideGameMode() {
  idleScreen.classList.remove('hidden');
  gameInfo.classList.add('hidden');
}

// --- 전체 렌더링 ---
function renderAll(data) {
  renderGameInfo(data.summary);
  renderCompRecommendation(data.compRecommendation);
  renderBuyPriority(data.buyPriority);
  renderEconomy(data.economyAdvice);
  renderPositioning(data.positioningTip);
  renderAugments(data.augmentAdvice);
}

function renderGameInfo(summary) {
  if (!summary) return;
  document.getElementById('chip-stage').textContent = `스테이지 ${summary.stage}`;
  document.getElementById('chip-health').textContent = `체력 ${summary.myHealth}`;
  document.getElementById('chip-rank').textContent = `${summary.myRank}위/${summary.playersAlive}명`;
}

function renderCompRecommendation(rec) {
  const el = document.getElementById('comp-content');
  if (!rec?.recommended) {
    el.innerHTML = '<div style="color:#888;font-size:11px">분석 중...</div>';
    return;
  }

  const comp = rec.recommended;
  const tierClass = `tier-${comp.tier}`;

  let html = `
    <div class="comp-card">
      <div class="comp-name">
        ${comp.name}
        <span class="tier-badge ${tierClass}">${comp.tier}티어</span>
      </div>
      <div class="comp-detail">
        <div>핵심 기물: <span>${comp.keyUnits?.join(', ') || '-'}</span></div>
        <div>시너지: <span>${comp.synergies?.join(', ') || '-'}</span></div>
        <div>경제: <span>${comp.economy || '-'}</span></div>
        <div style="margin-top:5px;color:#ccc">${comp.description || ''}</div>
      </div>
    </div>
  `;

  if (rec.reasoning) {
    html += `<div class="alert info"><span>i</span><span>${rec.reasoning}</span></div>`;
  }

  if (rec.alternatives?.length > 0) {
    html += `<div style="font-size:10px;color:#888;margin-top:6px;margin-bottom:4px">대안 조합</div>`;
    rec.alternatives.forEach(alt => {
      html += `
        <div style="display:flex;align-items:center;gap:6px;padding:5px 8px;background:rgba(255,255,255,0.03);border-radius:4px;margin-bottom:3px;">
          <span style="font-size:11px;color:#ccc">${alt.name}</span>
          <span class="tier-badge tier-${alt.tier}" style="font-size:10px">${alt.tier}</span>
        </div>
      `;
    });
  }

  el.innerHTML = html;
}

function renderBuyPriority(priorities) {
  const el = document.getElementById('buy-content');
  if (!priorities?.length) {
    el.innerHTML = '<div style="color:#888;font-size:11px">분석 중...</div>';
    return;
  }

  const html = priorities.map(item => `
    <div class="buy-item">
      <div class="priority-num">${item.priority}</div>
      <div>${item.text}</div>
    </div>
  `).join('');

  el.innerHTML = html;
}

function renderEconomy(economy) {
  // 이자 테이블
  const interestEl = document.getElementById('interest-table');
  const guide = [
    { gold: 10, interest: 1 },
    { gold: 20, interest: 2 },
    { gold: 30, interest: 3 },
    { gold: 40, interest: 4 },
    { gold: 50, interest: 5, note: '최대!' }
  ];

  interestEl.innerHTML = guide.map(g => `
    <div class="interest-cell ${g.note ? 'highlight' : ''}">
      <div class="gold">${g.gold}G</div>
      <div class="int">+${g.interest}</div>
      ${g.note ? `<div style="font-size:9px;color:#c8aa64">${g.note}</div>` : ''}
    </div>
  `).join('');

  // 경제 조언
  const adviceEl = document.getElementById('economy-advice-content');
  if (economy?.advice) {
    adviceEl.innerHTML = economy.advice.map(a =>
      `<div class="meta-item">• ${a}</div>`
    ).join('');
  }

  // 운영 방식 가이드
  const typeEl = document.getElementById('economy-type-content');
  const guides = [
    { key: 'hyperroll', label: '하이퍼롤', color: '#ff8040' },
    { key: 'slowroll', label: '슬로우롤', color: '#40a0ff' },
    { key: 'fastlevel', label: '빠른 레벨', color: '#80ff80' }
  ];

  typeEl.innerHTML = guides.map(g => {
    const data = ECONOMY_GUIDE[g.key];
    return `
      <div style="margin-bottom:8px;padding:7px;background:rgba(255,255,255,0.03);border-radius:5px;border-left:2px solid ${g.color}">
        <div style="font-size:11px;font-weight:700;color:${g.color};margin-bottom:3px">${g.label}</div>
        <div style="font-size:10px;color:#888">언제: ${data.when}</div>
        <div style="font-size:10px;color:#aaa;margin-top:2px">${data.gold_target}</div>
      </div>
    `;
  }).join('');
}

function renderPositioning(posData) {
  const tipEl = document.getElementById('position-tip-content');
  if (!posData) {
    tipEl.innerHTML = '<div style="color:#888;font-size:11px">분석 중...</div>';
    return;
  }

  tipEl.innerHTML = `
    <div style="font-size:12px;font-weight:700;color:#c8aa64;margin-bottom:5px">${posData.name}</div>
    <div style="font-size:11px;color:#ccc;margin-bottom:5px">${posData.description}</div>
    <div class="alert warning"><span>tip</span><span>${posData.tip}</span></div>
  `;

  // 헥스 보드 시각화
  const boardEl = document.getElementById('hex-board-visual');
  boardEl.innerHTML = renderHexBoard(posData.type);

  // 일반 팁
  const generalEl = document.getElementById('position-tips-general');
  if (posData.generalTips) {
    generalEl.innerHTML = posData.generalTips.map(t =>
      `<div class="meta-item">• ${t}</div>`
    ).join('');
  }
}

function renderHexBoard(posType) {
  // 4행 7열 헥스 보드 시각화
  const boards = {
    corner_backline: [
      ['f', 'f', '', '', '', '', ''],
      ['f', 'f', '', '', '', '', ''],
      ['', '', '', '', '', '', 'c'],
      ['', '', '', '', '', '', 'c']
    ],
    frontline_heavy: [
      ['f', 'f', 'f', 'f', 'f', '', ''],
      ['f', 'f', 'f', '', '', '', ''],
      ['', '', '', 'c', 'c', '', ''],
      ['', '', '', '', 'c', '', '']
    ],
    backline: [
      ['f', 'f', 'f', '', '', '', ''],
      ['f', 'f', '', '', '', '', ''],
      ['', '', '', 'c', 'c', '', ''],
      ['', '', '', 'c', 'c', '', '']
    ],
    spread: [
      ['f', '', 'f', '', 'f', '', ''],
      ['', 'c', '', 'c', '', 'c', ''],
      ['f', '', 'f', '', 'f', '', ''],
      ['', '', '', '', '', '', '']
    ]
  };

  const layout = boards[posType] || boards.backline;
  const labelMap = { f: '탱', c: '캐', s: '보' };
  const classMap = { f: 'frontline', c: 'carry', s: 'support' };

  return `
    <div style="padding:5px">
      ${layout.map(row => `
        <div class="hex-row">
          ${row.map(cell => cell
            ? `<div class="hex ${classMap[cell] || ''}">${labelMap[cell] || ''}</div>`
            : `<div class="hex"></div>`
          ).join('')}
        </div>
      `).join('')}
      <div style="display:flex;gap:8px;margin-top:6px;font-size:10px;color:#888">
        <span><span style="color:#80a0ff">■</span> 탱커(전선)</span>
        <span><span style="color:#ffd700">■</span> 캐리</span>
        <span><span style="color:#80e080">■</span> 서포터</span>
      </div>
    </div>
  `;
}

function renderAugments(augData) {
  const currentEl = document.getElementById('augment-current');
  if (augData?.current?.length > 0) {
    currentEl.innerHTML = augData.current.map(aug => `
      <div class="augment-item">
        <span class="tier-badge tier-${aug.tier}">${aug.tier}</span>
        <span style="font-size:11px;color:#e8e0d0">${aug.name}</span>
        <span style="font-size:10px;color:#888;margin-left:auto">${aug.synergy}</span>
      </div>
    `).join('');

    if (augData.advice) {
      currentEl.innerHTML += `<div class="alert success" style="margin-top:6px"><span>v</span><span>${augData.advice}</span></div>`;
    }
  } else {
    currentEl.innerHTML = `
      <div style="font-size:11px;color:#888;text-align:center;padding:10px">
        ${augData?.advice || '증강 없음'}
      </div>
    `;
  }

  // 증강 티어 가이드
  const tierEl = document.getElementById('augment-tier-guide');
  const tiers = [
    { tier: 'S', label: 'S티어 - 항상 픽', color: '#ffd700' },
    { tier: 'A', label: 'A티어 - 시너지 있으면 픽', color: '#80e080' },
    { tier: 'B', label: 'B티어 - 상황에 따라', color: '#80a0ff' }
  ];

  tierEl.innerHTML = tiers.map(t => {
    const augList = AUGMENT_TIERS[t.tier]?.slice(0, 5) || [];
    return `
      <div style="margin-bottom:8px">
        <div style="font-size:11px;font-weight:700;color:${t.color};margin-bottom:4px">${t.label}</div>
        <div style="display:flex;flex-wrap:wrap;gap:3px">
          ${augList.map(a => `
            <span style="font-size:10px;padding:2px 6px;background:rgba(255,255,255,0.05);border-radius:3px;color:#ccc">${a}</span>
          `).join('')}
          ${AUGMENT_TIERS[t.tier]?.length > 5
            ? `<span style="font-size:10px;color:#666">+${AUGMENT_TIERS[t.tier].length - 5}개</span>`
            : ''
          }
        </div>
      </div>
    `;
  }).join('');
}

// --- 초기 로드 ---
async function init() {
  // 이자 테이블 초기 렌더링
  renderEconomy(null);

  // 메타 데이터 로드
  try {
    const patchData = await patchAnalyzer.fetchLatestPatchNotes();
    const metaEl = document.getElementById('meta-content');
    metaEl.innerHTML = `
      <div style="font-size:10px;color:#888;margin-bottom:6px">버전: ${patchData.version}</div>
      ${(patchData.recommendations || []).map(r =>
        `<div class="meta-item">• ${r}</div>`
      ).join('')}
      ${patchData.metaShifts?.length > 0 ? `
        <div style="margin-top:8px">
          <div style="font-size:10px;color:#c8aa64;font-weight:700;margin-bottom:4px">META SHIFTS</div>
          ${patchData.metaShifts.map(s => `<div class="meta-item">• ${s}</div>`).join('')}
        </div>
      ` : ''}
      ${patchData.buffedUnits?.length > 0 ? `
        <div style="margin-top:8px">
          <div class="meta-item"><span class="label">상향</span> ${patchData.buffedUnits.join(', ')}</div>
          <div class="meta-item"><span class="label">하향</span> ${patchData.nerfedUnits?.join(', ') || '-'}</div>
        </div>
      ` : ''}
    `;
  } catch (e) {
    document.getElementById('meta-content').textContent = '메타 데이터 로드 실패';
  }

  // 증강 초기 렌더링
  renderAugments({ current: [], advice: '게임 시작 후 증강이 표시됩니다.' });

  // LCU 연결 상태 초기 확인
  try {
    const lcuState = await ipcRenderer.invoke('get-lcu-state');
    if (lcuState.state === 'connected' && lcuState.summoner) {
      updateLCUDetail(`연결됨: ${lcuState.summoner.name}${lcuState.summoner.tagLine ? '#' + lcuState.summoner.tagLine : ''}`);
      updateStatus(`${lcuState.summoner.name} — ${lcuState.inGame ? '게임 중' : '게임 대기 중'}`, lcuState.inGame ? 'active' : 'success');
    } else if (lcuState.state === 'searching') {
      updateStatus('클라이언트 연결 중...', 'idle');
    } else {
      updateStatus('TFT 클라이언트를 실행해주세요', 'error');
    }
  } catch (e) {
    updateStatus('초기화 중...', 'idle');
  }

  // 저장된 설정 불러오기
  try {
    const cfg = await ipcRenderer.invoke('get-config');
    if (cfg.lcuPath) {
      document.getElementById('lcu-path-input').value = cfg.lcuPath;
    }
    if (cfg.riotApiKey) {
      document.getElementById('riot-api-key-input').value = cfg.riotApiKey;
    }
  } catch (e) {
    // 설정 로드 실패 무시
  }
}

init();
