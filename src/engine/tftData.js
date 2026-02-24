// TFT Set 16: Lore & Legends 메타 데이터 v2.1
// src/data/tftMeta.js 에서 원본 데이터를 가져와 기존 인터페이스 유지
const TFT_META = require('../data/tftMeta');
const { TFT_SET16_CHAMPIONS, ENG_TO_KOR, getChampionIconUrl, getChampionsByComp } = require('../data/champions');
const { TFT_SET16_AUGMENTS, getAugmentTier, getAugmentsByStage, isValidAugment, getAllAugmentNames } = require('../data/augments');

// ─── META_COMPS: 전체 조합 리스트 (S/A/B/C 통합) ───
const META_COMPS = [
  ...TFT_META.compositions.S,
  ...(TFT_META.compositions.A || []),
  ...(TFT_META.compositions.B || []),
  ...(TFT_META.compositions.C || []),
].map(comp => ({
  id: (comp.nameEn || comp.name).toLowerCase().replace(/[^a-z0-9]+/g, '_'),
  name: comp.name,
  tier: comp.tier,
  keyUnits: comp.coreUnits,
  synergies: comp.traits || [],
  economy: comp.leveling || '',
  difficulty: comp.difficulty || '중간',
  description: comp.playstyle || '',
  fullComp: comp.fullComp || null,
  keyItems: comp.keyItems || null,
  earlyGame: comp.earlyGame || null,
  midGame: comp.midGame || null,
  lateGame: comp.lateGame || null,
  compAugments: comp.compAugments || null,
  detailedItems: comp.detailedItems || null,
  positionBoard: comp.positionBoard || null,
}));

// ─── AUGMENT_TIERS: 증강 이름 배열 (한글) ───
const AUGMENT_TIERS = {
  S: TFT_META.augments.S.map(a => a.nameKr),
  A: TFT_META.augments.A.map(a => a.nameKr),
  B: TFT_META.augments.B.map(a => a.nameKr),
};

// ─── AUGMENT_DATA: 증강 상세 데이터 ───
const AUGMENT_DATA = {};
['S', 'A', 'B'].forEach(tier => {
  TFT_META.augments[tier].forEach(a => {
    AUGMENT_DATA[a.nameKr] = { tier, name: a.name, nameKr: a.nameKr, desc: a.desc };
  });
});

// ─── UNIT_COSTS: 코스트별 챔피언 이름 ───
const UNIT_COSTS = {};
Object.entries(TFT_META.champions).forEach(([cost, units]) => {
  UNIT_COSTS[cost] = units.map(u => u.name);
});

// ─── POSITIONING_GUIDE ───
const POSITIONING_GUIDE = {};
Object.entries(TFT_META.positioning.templates).forEach(([key, tmpl]) => {
  POSITIONING_GUIDE[key] = { name: tmpl.name, description: tmpl.desc, tip: tmpl.tip };
});

// ─── ECONOMY_GUIDE ───
const ECONOMY_GUIDE = {};
TFT_META.economy.strategies.forEach(s => {
  ECONOMY_GUIDE[s.key] = { name: s.name, when: s.when, gold_target: s.desc, timing: s.timing };
});

// ─── SYNERGY_INFO ───
const SYNERGY_INFO = {};
[...TFT_META.traits.origins, ...TFT_META.traits.classes].forEach(t => {
  SYNERGY_INFO[t.name] = { nameEn: t.nameEn, thresholds: t.breakpoints, desc: t.desc };
});

const ROLL_ODDS = TFT_META.rollOdds;
const STAGE_GUIDE = TFT_META.stageGuide;
const ITEM_GUIDE = TFT_META.itemGuide;

module.exports = {
  TFT_META,
  META_COMPS,
  AUGMENT_TIERS,
  AUGMENT_DATA,
  UNIT_COSTS,
  POSITIONING_GUIDE,
  ECONOMY_GUIDE,
  SYNERGY_INFO,
  ROLL_ODDS,
  STAGE_GUIDE,
  ITEM_GUIDE,
  TFT_SET16_CHAMPIONS,
  ENG_TO_KOR,
  getChampionIconUrl,
  getChampionsByComp,
  TFT_SET16_AUGMENTS,
  getAugmentTier,
  getAugmentsByStage,
  isValidAugment,
  getAllAugmentNames,
};
