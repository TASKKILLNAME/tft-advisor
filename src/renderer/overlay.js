const { ipcRenderer } = require('electron');
const { AUGMENT_TIERS, AUGMENT_DATA, ECONOMY_GUIDE, TFT_META, ROLL_ODDS, STAGE_GUIDE, ITEM_GUIDE, TFT_SET16_CHAMPIONS, getChampionIconUrl } = require('../engine/tftData');
const PatchAnalyzer = require('../engine/patchAnalyzer');

const patchAnalyzer = new PatchAnalyzer();
let currentData = null;
let isMinimized = false;
let opacityLevel = 0.88;
const opacityLevels = [0.88, 0.7, 0.5, 0.3];
let opacityIdx = 0;

// --- 글로벌 에러 핸들러 ---
window.onerror = function(msg, url, line, col, error) {
  console.error('Global error:', msg, url, line, col, error);
  const fb = document.getElementById('error-fallback');
  if (fb) fb.classList.add('visible');
  return false;
};

// --- safeRender 래퍼 ---
function safeRender(fn, containerId) {
  try {
    fn();
  } catch (e) {
    console.error('Render error in', containerId, ':', e);
    const el = document.getElementById(containerId);
    if (el) el.innerHTML = '<div style="color:#888;font-size:11px">데이터 로드 중...</div>';
  }
}

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

// --- 설정 저장 ---
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

ipcRenderer.on('rank-info', (event, data) => {
  if (data) {
    const detailEl = document.getElementById('lcu-connection-detail');
    const currentText = detailEl.textContent;
    const rankStr = `${data.tier || '?'} ${data.division || ''} ${data.leaguePoints || 0}LP`;
    detailEl.innerHTML = `${currentText}<br><span style="color:#c8aa64;font-size:10px">TFT 랭크: ${rankStr}</span>`;
  }
});

ipcRenderer.on('status', (event, data) => {
  updateStatus(data.message, data.type);
});

ipcRenderer.on('game_start', (event, data) => {
  showGameMode();
  updateStatus(`게임 시작! (ID: ${data.gameId?.toString().slice(-6) || '?'})`, 'active');
});

ipcRenderer.on('update', (event, data) => {
  if (!data || data.error) return;
  currentData = data;
  safeRender(() => renderAll(data), 'content');
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

// --- 챔피언 아이콘 헬퍼 ---
function getChampCostClass(name) {
  const champ = TFT_SET16_CHAMPIONS[name];
  return champ ? `cost-${champ.cost}` : '';
}

function renderChampionIcon(name) {
  const champ = TFT_SET16_CHAMPIONS[name];
  if (!champ) {
    return `<div class="champ-icon-cell"><div style="width:30px;height:30px;border-radius:50%;background:rgba(255,255,255,0.1);border:2px solid #555"></div><span class="champ-name-label">${name}</span></div>`;
  }
  const url = getChampionIconUrl(champ.engId);
  return `<div class="champ-icon-cell"><img src="${url}" class="${getChampCostClass(name)}" alt="${name}" onerror="this.style.display='none'"><span class="champ-name-label">${name}</span></div>`;
}

// --- 전체 렌더링 ---
function renderAll(data) {
  safeRender(() => renderGameInfo(data.summary), 'game-info');
  safeRender(() => renderCompRecommendation(data.compRecommendation), 'comp-content');
  safeRender(() => renderBuyPriority(data.buyPriority), 'buy-content');
  safeRender(() => renderEconomy(data.economyAdvice), 'economy-advice-content');
  safeRender(() => renderPositioning(data.positioningTip, data.compRecommendation), 'position-tip-content');
  safeRender(() => renderAugments(data.augmentAdvice), 'augment-current');
  safeRender(() => renderCompAugments(data.compRecommendation), 'comp-augments-content');
  safeRender(() => renderDetailedItems(data.compRecommendation), 'comp-items-content');
}

function renderGameInfo(summary) {
  if (!summary) return;
  document.getElementById('chip-stage').textContent = `스테이지 ${summary.stage}`;
  document.getElementById('chip-health').textContent = `체력 ${summary.myHealth}`;
  document.getElementById('chip-rank').textContent = `${summary.myRank}위/${summary.playersAlive}명`;
}

function getDiffClass(diff) {
  if (diff === '쉬움') return 'diff-easy';
  if (diff === '어려움') return 'diff-hard';
  return 'diff-medium';
}

function renderCompCard(comp, idx) {
  const tierClass = `tier-${comp.tier}`;
  const diffClass = getDiffClass(comp.difficulty);
  const planId = `game-plan-${idx}`;

  let html = `<div class="comp-card">`;
  html += `
    <div class="comp-name">
      ${comp.name}
      <span class="tier-badge ${tierClass}">${comp.tier}티어</span>
      ${comp.difficulty ? `<span class="diff-badge ${diffClass}">${comp.difficulty}</span>` : ''}
    </div>
    <div class="comp-detail">
      <div>핵심 기물: <span>${comp.keyUnits?.join(', ') || '-'}</span></div>
      <div>시너지: <span>${comp.synergies?.join(', ') || '-'}</span></div>
      <div>경제: <span>${comp.economy || '-'}</span></div>
  `;

  // 풀 조합 with 챔피언 아이콘
  if (comp.fullComp?.length) {
    html += `<div class="champ-icons-row">`;
    comp.fullComp.forEach(u => {
      html += renderChampionIcon(u);
    });
    html += `</div>`;
  }

  // Key items
  if (comp.keyItems) {
    html += `<div class="key-items-row">`;
    if (comp.keyItems.carry) {
      html += `<div class="key-items-group">
        <div class="key-items-label">${comp.keyItems.carry.unit} (캐리)</div>
        <div class="key-items-list">${comp.keyItems.carry.items?.join(', ') || '-'}</div>
      </div>`;
    }
    if (comp.keyItems.tank) {
      html += `<div class="key-items-group">
        <div class="key-items-label">${comp.keyItems.tank.unit} (탱커)</div>
        <div class="key-items-list">${comp.keyItems.tank.items?.join(', ') || '-'}</div>
      </div>`;
    }
    html += `</div>`;
  }

  if (comp.description) {
    html += `<div style="margin-top:5px;color:#ccc">${comp.description}</div>`;
  }

  html += `</div>`; // close comp-detail

  // Game plan (collapsible)
  if (comp.earlyGame || comp.midGame || comp.lateGame) {
    html += `
      <div class="game-plan">
        <div class="game-plan-toggle" onclick="document.getElementById('${planId}').classList.toggle('open');this.textContent=document.getElementById('${planId}').classList.contains('open')?'▼ 게임 플랜 접기':'▶ 게임 플랜 보기'">▶ 게임 플랜 보기</div>
        <div class="game-plan-body" id="${planId}">
          ${comp.earlyGame ? `<div class="game-plan-phase phase-early"><div class="phase-label">초반</div>${comp.earlyGame}</div>` : ''}
          ${comp.midGame ? `<div class="game-plan-phase phase-mid"><div class="phase-label">중반</div>${comp.midGame}</div>` : ''}
          ${comp.lateGame ? `<div class="game-plan-phase phase-late"><div class="phase-label">후반</div>${comp.lateGame}</div>` : ''}
        </div>
      </div>
    `;
  }

  html += `</div>`; // close comp-card
  return html;
}

function renderCompRecommendation(rec) {
  const el = document.getElementById('comp-content');
  if (!rec?.recommended) {
    el.innerHTML = '<div style="color:#888;font-size:11px">분석 중...</div>';
    return;
  }

  let html = renderCompCard(rec.recommended, 0);

  if (rec.reasoning) {
    html += `<div class="alert info"><span>i</span><span>${rec.reasoning}</span></div>`;
  }

  if (rec.alternatives?.length > 0) {
    html += `<div style="font-size:10px;color:#888;margin-top:6px;margin-bottom:4px">대안 조합</div>`;
    rec.alternatives.forEach((alt, i) => {
      html += renderCompCard(alt, i + 1);
    });
  }

  el.innerHTML = html;
}

// --- 조합별 증강 추천 렌더링 ---
function renderCompAugments(rec) {
  const area = document.getElementById('comp-augments-area');
  const el = document.getElementById('comp-augments-content');
  if (!rec?.compAugments) {
    area.classList.add('hidden');
    return;
  }

  area.classList.remove('hidden');
  const aug = rec.compAugments;

  let html = '';
  if (aug.silver?.length) {
    html += `<div class="augment-tier-row"><span class="augment-tier-label silver">Silver</span><span style="color:#ccc">${aug.silver.join(', ')}</span></div>`;
  }
  if (aug.gold?.length) {
    html += `<div class="augment-tier-row"><span class="augment-tier-label gold">Gold</span><span style="color:#ccc">${aug.gold.join(', ')}</span></div>`;
  }
  if (aug.prismatic?.length) {
    html += `<div class="augment-tier-row"><span class="augment-tier-label prismatic">Prism</span><span style="color:#ccc">${aug.prismatic.join(', ')}</span></div>`;
  }

  el.innerHTML = html;
}

// --- 조합별 상세 아이템 렌더링 ---
function renderDetailedItems(rec) {
  const area = document.getElementById('comp-items-area');
  const el = document.getElementById('comp-items-content');
  if (!rec?.detailedItems || rec.detailedItems.length === 0) {
    area.classList.add('hidden');
    return;
  }

  area.classList.remove('hidden');
  let html = '';
  rec.detailedItems.forEach(di => {
    const unitName = di.unit;
    html += `<div class="detailed-item-unit">`;
    html += `<div class="detailed-item-unit-name">${unitName}</div>`;
    if (di.primary?.length || di.items?.length) {
      const items = di.primary || di.items || [];
      html += `<div class="detailed-item-row"><span class="detailed-item-label">주:</span>${items.map(i => `<span class="item-chip">${i}</span>`).join('')}</div>`;
    }
    if (di.alternative?.length) {
      html += `<div class="detailed-item-row"><span class="detailed-item-label">대체:</span>${di.alternative.map(i => `<span class="item-chip" style="opacity:0.7">${i}</span>`).join('')}</div>`;
    }
    if (di.mutant?.length) {
      html += `<div class="detailed-item-row"><span class="detailed-item-label">변이:</span>${di.mutant.map(i => `<span class="item-chip" style="opacity:0.6">${i}</span>`).join('')}</div>`;
    }
    html += `</div>`;
  });

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

  renderRollOdds();

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
    { key: 'slowroll5', color: '#ff6040' },
    { key: 'slowroll6', color: '#ff8040' },
    { key: 'slowroll7', color: '#ffaa40' },
    { key: 'fast8', color: '#40a0ff' },
    { key: 'fast9', color: '#80ff80' },
  ];

  typeEl.innerHTML = guides.map(g => {
    const data = ECONOMY_GUIDE[g.key];
    if (!data) return '';
    return `
      <div style="margin-bottom:8px;padding:7px;background:rgba(255,255,255,0.03);border-radius:5px;border-left:2px solid ${g.color}">
        <div style="font-size:11px;font-weight:700;color:${g.color};margin-bottom:3px">${data.name}</div>
        <div style="font-size:10px;color:#aaa">${data.gold_target}</div>
        <div style="font-size:10px;color:#888;margin-top:2px">타이밍: ${data.timing} | 조합: ${data.when}</div>
      </div>
    `;
  }).join('');

  renderStageGuide();
}

function renderRollOdds() {
  const el = document.getElementById('roll-odds-content');
  if (!ROLL_ODDS) { el.innerHTML = '데이터 없음'; return; }

  const costColors = ['cost-1', 'cost-2', 'cost-3', 'cost-4', 'cost-5'];
  const levels = Object.keys(ROLL_ODDS).sort((a, b) => a - b);

  let html = `<table class="roll-table"><thead><tr>
    <th>레벨</th><th class="cost-1">1코</th><th class="cost-2">2코</th><th class="cost-3">3코</th><th class="cost-4">4코</th><th class="cost-5">5코</th>
  </tr></thead><tbody>`;

  levels.forEach(lv => {
    const odds = ROLL_ODDS[lv];
    html += `<tr><td style="color:#c8aa64;font-weight:700">Lv${lv}</td>`;
    odds.forEach((pct, i) => {
      const isHigh = pct >= 25;
      html += `<td class="${costColors[i]}${isHigh ? ' high' : ''}">${pct}%</td>`;
    });
    html += `</tr>`;
  });

  html += `</tbody></table>`;
  el.innerHTML = html;
}

function renderStageGuide() {
  const el = document.getElementById('stage-guide-content');
  if (!STAGE_GUIDE) { el.innerHTML = '데이터 없음'; return; }

  const stages = Object.keys(STAGE_GUIDE).sort();
  el.innerHTML = stages.map(key => {
    const s = STAGE_GUIDE[key];
    return `
      <div class="stage-guide-item">
        <div class="stage-guide-name">${s.name}</div>
        <div class="stage-guide-tip">${s.tips.map(t => `• ${t}`).join('<br>')}</div>
      </div>
    `;
  }).join('');
}

// --- 배치 탭: 4×7 헥사곤 챔피언 아이콘 보드 ---
function renderPositionHexBoard(positionBoard) {
  const el = document.getElementById('position-hex-board');
  if (!positionBoard || !Array.isArray(positionBoard) || positionBoard.length < 28) {
    el.innerHTML = '<div style="color:#888;font-size:11px">배치 데이터 없음</div>';
    return;
  }

  let html = '<div class="hex-board">';
  // 4행 × 7열, 짝수행(0-indexed)은 오프셋
  for (let row = 0; row < 4; row++) {
    html += `<div class="hex-row">`;
    for (let col = 0; col < 7; col++) {
      const idx = row * 7 + col;
      const champName = positionBoard[idx];
      if (champName) {
        const champ = TFT_SET16_CHAMPIONS[champName];
        if (champ) {
          const url = getChampionIconUrl(champ.engId);
          html += `<div class="hex-cell"><img src="${url}" class="cost-${champ.cost}" alt="${champName}" onerror="this.style.display='none'"><span class="hex-name">${champName}</span></div>`;
        } else {
          html += `<div class="hex-cell"><span class="hex-name">${champName}</span></div>`;
        }
      } else {
        html += `<div class="hex-cell empty"></div>`;
      }
    }
    html += `</div>`;
  }
  html += '</div>';
  html += `<div style="display:flex;gap:8px;margin-top:6px;font-size:9px;color:#888;padding:0 6px">
    <span><span style="color:#888">●</span> 1코</span>
    <span><span style="color:#6bcf6b">●</span> 2코</span>
    <span><span style="color:#5b9bd5">●</span> 3코</span>
    <span><span style="color:#c679e0">●</span> 4코</span>
    <span><span style="color:#ffd700">●</span> 5코+</span>
  </div>`;

  el.innerHTML = html;
}

function renderPositioning(posData, compRec) {
  // v2: 추천 조합의 positionBoard가 있으면 헥스 보드 렌더링
  if (compRec?.positionBoard) {
    renderPositionHexBoard(compRec.positionBoard);
  } else if (compRec?.recommended?.positionBoard) {
    renderPositionHexBoard(compRec.recommended.positionBoard);
  } else {
    const hexEl = document.getElementById('position-hex-board');
    if (hexEl) hexEl.innerHTML = '<div style="color:#888;font-size:11px">추천 조합 선택 후 배치가 표시됩니다</div>';
  }

  const tipEl = document.getElementById('position-tip-content');
  if (!posData) {
    tipEl.innerHTML = '<div style="color:#888;font-size:11px">분석 중...</div>';
    return;
  }

  tipEl.innerHTML = `
    <div style="font-size:12px;font-weight:700;color:#c8aa64;margin-bottom:5px">${posData.name || '배치 가이드'}</div>
    <div style="font-size:11px;color:#ccc;margin-bottom:5px">${posData.description || ''}</div>
    ${posData.tip ? `<div class="alert warning"><span>tip</span><span>${posData.tip}</span></div>` : ''}
  `;

  // 헥스 보드 시각화 (generic)
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
      ${layout.map((row, rowIdx) => `
        <div class="hex-row"${rowIdx % 2 === 1 ? ' style="margin-left:22px"' : ''}>
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
    currentEl.innerHTML = augData.current.map(aug => {
      const data = AUGMENT_DATA[aug.name];
      return `
        <div class="augment-item" style="flex-direction:column;align-items:flex-start">
          <div style="display:flex;align-items:center;gap:8px;width:100%">
            <span class="tier-badge tier-${aug.tier}">${aug.tier}</span>
            <span style="font-size:11px;color:#e8e0d0">${aug.name}</span>
            <span style="font-size:10px;color:#888;margin-left:auto">${aug.synergy}</span>
          </div>
          ${data?.desc ? `<div class="augment-desc">${data.desc}</div>` : ''}
        </div>
      `;
    }).join('');

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
    const augNames = AUGMENT_TIERS[t.tier] || [];
    return `
      <div style="margin-bottom:10px">
        <div style="font-size:11px;font-weight:700;color:${t.color};margin-bottom:4px">${t.label}</div>
        ${augNames.map(name => {
          const data = AUGMENT_DATA[name];
          return `
            <div class="augment-item" style="flex-direction:column;align-items:flex-start">
              <span style="font-size:10px;color:#ccc">${name}</span>
              ${data?.desc ? `<div class="augment-desc">${data.desc}</div>` : ''}
            </div>
          `;
        }).join('')}
      </div>
    `;
  }).join('');
}

// --- 아이템 가이드 렌더링 ---
function renderItemGuide() {
  const categories = [
    { key: 'AD', elId: 'item-ad', cssClass: 'ad' },
    { key: 'AP', elId: 'item-ap', cssClass: 'ap' },
    { key: 'Tank', elId: 'item-tank', cssClass: 'tank' },
  ];

  categories.forEach(cat => {
    const el = document.getElementById(cat.elId);
    const data = ITEM_GUIDE?.[cat.key];
    if (!el || !data) return;

    el.innerHTML = `
      <div style="font-size:11px;color:#aaa;margin-bottom:5px">추천 유닛</div>
      <div class="item-unit-list">
        ${data.units.map(u => `<span class="item-unit-chip">${u}</span>`).join('')}
      </div>
      <div style="font-size:11px;color:#aaa;margin-top:8px;margin-bottom:5px">핵심 아이템</div>
      <div class="item-list">
        ${data.bestItems.map(item => `<span class="item-chip">${item}</span>`).join('')}
      </div>
    `;
  });
}

// --- 로비 정보 렌더링 ---
function renderLobbyInfo(players) {
  const container = document.getElementById('lobby-info');
  const playersEl = document.getElementById('lobby-players');
  if (!players?.length) {
    container.classList.add('hidden');
    return;
  }

  container.classList.remove('hidden');

  playersEl.innerHTML = players.map(p => {
    const rankStr = p.rank ? `${p.rank.tier || '?'} ${p.rank.division || ''}`.trim() : 'Unranked';
    const meClass = p.isMe ? ' me' : '';
    return `
      <div class="lobby-player${meClass}">
        <span class="lobby-name" title="${p.name}">${p.name}</span>
        <span class="lobby-rank">${rankStr}</span>
      </div>
    `;
  }).join('');
}

ipcRenderer.on('lobby-info', (event, players) => {
  renderLobbyInfo(players);
});

ipcRenderer.on('game_end', (event) => {
  hideGameMode();
  updateStatus('게임 종료 - 다음 게임 대기 중', 'idle');
  document.getElementById('lobby-info').classList.add('hidden');
});

// --- 초기 로드 ---
async function init() {
  try {
    renderEconomy(null);
    renderItemGuide();

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
  } catch (e) {
    console.error('Init error:', e);
    const fb = document.getElementById('error-fallback');
    if (fb) fb.classList.add('visible');
  }
}

init();
