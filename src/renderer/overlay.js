const { ipcRenderer } = require('electron');
const { META_COMPS, AUGMENT_TIERS, ECONOMY_GUIDE } = require('../engine/tftData');
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
// forward:true 옵션 덕분에 mouseleave 상태에서도 마우스 위치 추적 가능
const appEl = document.getElementById('app');

appEl.addEventListener('mouseenter', () => {
  ipcRenderer.send('set-ignore-mouse', false);
});

appEl.addEventListener('mouseleave', () => {
  // input/textarea에 포커스 중이면 게임으로 통과 안 함 (입력 보호)
  const focused = document.activeElement;
  const isTyping = focused && (focused.tagName === 'INPUT' || focused.tagName === 'TEXTAREA');
  if (!isTyping) {
    ipcRenderer.send('set-ignore-mouse', true);
  }
});

// input에서 포커스 잃으면 다시 통과 허용
document.addEventListener('blur', (e) => {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
    ipcRenderer.send('set-ignore-mouse', true);
  }
}, true);

// 처음 로드 시 클릭 가능 상태로 시작
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

// --- 설정 저장 ---
document.getElementById('save-settings-btn').addEventListener('click', () => {
  const apiKey = document.getElementById('api-key-input').value.trim();
  const summoner = document.getElementById('summoner-input').value.trim();
  const tagline = document.getElementById('tagline-input').value.trim() || 'KR1';

  if (apiKey) {
    ipcRenderer.send('update-api-key', apiKey);
  }
  if (summoner) {
    ipcRenderer.send('update-summoner', { name: summoner, tagline });
  }

  updateStatus('설정이 저장되었습니다', 'success');
});

// --- IPC 이벤트 ---
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
        <div>🔑 핵심 기물: <span>${comp.keyUnits?.join(', ') || '-'}</span></div>
        <div>⚡ 시너지: <span>${comp.synergies?.join(', ') || '-'}</span></div>
        <div>💡 경제: <span>${comp.economy || '-'}</span></div>
        <div style="margin-top:5px;color:#ccc">${comp.description || ''}</div>
      </div>
    </div>
  `;

  if (rec.reasoning) {
    html += `<div class="alert info"><span>ℹ</span><span>${rec.reasoning}</span></div>`;
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
    <div class="alert warning"><span>💡</span><span>${posData.tip}</span></div>
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
      currentEl.innerHTML += `<div class="alert success" style="margin-top:6px"><span>✓</span><span>${augData.advice}</span></div>`;
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

  updateStatus('API 연결 중...', 'idle');
}

init();
