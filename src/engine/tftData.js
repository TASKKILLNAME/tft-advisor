// TFT Set 14 기준 메타 데이터
// Community Dragon / Metatft.com 기반 - 패치마다 업데이트 필요

const META_COMPS = [
  {
    id: 'sorcerer_comp',
    name: '마법사 조합',
    tier: 'S',
    keyUnits: ['리산드라', '럭스', '말자하'],
    synergies: ['마법사 4', '포탈 2'],
    augments: ['마법사의 관', '주문폭발', '마나흐름'],
    positioning: 'backline',
    economy: '레벨 8 강행 or 롤다운 3-2',
    difficulty: '중',
    description: '후반 마법피해 집중, 리산드라 탱킹'
  },
  {
    id: 'bruiser_comp',
    name: '브루저 탱조합',
    tier: 'A',
    keyUnits: ['자크', '렝가', '뽀삐'],
    synergies: ['브루저 6', '전사 2'],
    augments: ['선혈 브루저', '탱킹 전문', '갑옷의 달인'],
    positioning: 'frontline_heavy',
    economy: '레벨 7 강행, 롤다운 3-5',
    difficulty: '하',
    description: '높은 생존력, 안정적인 탑8 보장'
  },
  {
    id: 'sniper_comp',
    name: '저격수 하이퍼롤',
    tier: 'S',
    keyUnits: ['케이틀린', '징크스', '미스포츈'],
    synergies: ['저격수 4', '지하세계 3'],
    augments: ['저격 전문', '목표 포착', '정밀 조준'],
    positioning: 'corner_backline',
    economy: '하이퍼롤 3-2 또는 3-5',
    difficulty: '중',
    description: '케이틀린 3성 핵심, 코너 배치'
  },
  {
    id: 'reroll_yordle',
    name: '요들 하이퍼롤',
    tier: 'A',
    keyUnits: ['트리스타나', '럼블', '뽀삐'],
    synergies: ['요들 6'],
    augments: ['요들 영혼', '꼬마 친구들', '행운의 별'],
    positioning: 'spread',
    economy: '하이퍼롤 2-1부터, 골드 50 이상 유지',
    difficulty: '하',
    description: '초반 강세, 요들 6 활성화 후 안정'
  },
  {
    id: 'twinshot_flex',
    name: '이중사격 플렉스',
    tier: 'B',
    keyUnits: ['미스포츈', '케이틀린', '징크스'],
    synergies: ['이중사격 4', '저격수 2'],
    augments: ['이중사격 전문', '완벽한 조준'],
    positioning: 'backline',
    economy: '레벨 8, 롤다운 4-2',
    difficulty: '중',
    description: '이중사격 폭딜, 미포 캐리'
  }
];

// 증강 티어 리스트 (패치 14.x 기준)
const AUGMENT_TIERS = {
  // S티어 증강
  S: [
    '황금 계란', '부유한 자', '봉우리에서', '별의 수호자',
    '마법사의 관', '스나이퍼의 초점', '선혈 브루저',
    '이중 탱킹', '주문 가속', '완벽한 조준',
    '황금 티켓', '이자 소득', '저격 전문',
    '혼돈의 힘', '소환사의 왕관', '요들 영혼'
  ],
  // A티어 증강
  A: [
    '전투 준비', '갑옷의 달인', '용기의 훈장', '마법 저항 전문가',
    '후방 지원', '선제 공격', '포식자', '도약',
    '절약 전문가', '시장 할인', '복리 이자',
    '탱킹 전문', '전사 영혼', '마법사 영혼'
  ],
  // B티어 증강
  B: [
    '빠른 성장', '초보자 안내서', '체력 지원',
    '마나 흐름', '도구 정비', '방패 전문'
  ],
  // C티어 증강
  C: [
    '불운', '약한 시작', '느린 진행'
  ]
};

// 기물 코스트별 데이터
const UNIT_COSTS = {
  1: ['트런들', '뽀삐', '말파이트', '녹턴', '케넨', '럼블', '징크스', '케이틀린', '탈론'],
  2: ['갈리오', '렉사이', '자야', '소나', '트위치', '럭스', '레오나', '레넥톤'],
  3: ['세주아니', '아트록스', '칼리스타', '럭스', '제이스', '자크', '미스포츈'],
  4: ['가렌', '바루스', '사이온', '리산드라', '카타리나', '케일', '비에고'],
  5: ['레클레스', '아지르', '오리아나', '모르가나', '우르곳', '카직스']
};

// 포지셔닝 가이드
const POSITIONING_GUIDE = {
  'backline': {
    name: '후열 배치',
    description: '마법사/저격수는 후열 코너에, 탱커는 전열',
    tip: '적 갱크 기물(제드, 피즈 등) 반대쪽 코너에 배치'
  },
  'frontline_heavy': {
    name: '전열 집중',
    description: '탱커를 전열에 밀집, 딜러는 중앙 후열',
    tip: '아이템 탱커는 3번/7번 헥스에 배치'
  },
  'corner_backline': {
    name: '코너 저격수',
    description: '메인 캐리를 구석 후열에, 탱커로 보호',
    tip: '상대 어쌔신 체크 후 반대 코너로 이동'
  },
  'spread': {
    name: '분산 배치',
    description: '광역기 피해 최소화를 위해 간격 유지',
    tip: '요들/아처 조합에 유효'
  }
};

// 경제 운영 가이드
const ECONOMY_GUIDE = {
  hyperroll: {
    name: '하이퍼롤',
    when: '2-1 또는 3-2부터 롤다운',
    gold_target: '골드 50 유지 없이 1~2코스트 3성 목표',
    stages: {
      '1-1 ~ 2-1': '체력 아끼기, 공짜 우승시 롤 1~2회',
      '2-1 ~ 2-5': '골드 소비, 핵심 기물 3성 목표',
      '3-1 이후': '기물 완성 후 레벨업, 전열 보충'
    }
  },
  slowroll: {
    name: '슬로우롤',
    when: '3-5 또는 4-2 저레벨 유지',
    gold_target: '골드 50 초과분만 롤, 이자 최대화',
    stages: {
      '1-1 ~ 3-2': '이자 관리, 50골드 유지',
      '3-5 ~ 4-2': '레벨 5~6 유지하며 타겟 3성',
      '4-5 이후': '완성 후 레벨업'
    }
  },
  fastlevel: {
    name: '빠른 레벨업',
    when: '4코스트 기물 중심 조합',
    gold_target: '3-2에 레벨7, 4-1에 레벨8',
    stages: {
      '1-1 ~ 2-5': '이자 유지하며 전투력 최소화',
      '3-1 ~ 3-5': '저장 후 레벨 7 강행',
      '4-1 ~ 4-5': '레벨 8 후 4코스트 탐색'
    }
  }
};

// 시너지 효과 요약
const SYNERGY_INFO = {
  '마법사': {
    thresholds: [2, 4, 6, 8],
    effects: ['주문력 +20%', '주문력 +40%', '주문력 +60%, 스킬 중첩', '모든 스킬 피해 +100%']
  },
  '저격수': {
    thresholds: [2, 4, 6],
    effects: ['공격력 +15%, 사거리 +1', '공격력 +30%, 치명타 +15%', '공격력 +55%, 치명타 +30%']
  },
  '브루저': {
    thresholds: [2, 4, 6, 8],
    effects: ['최대 체력 +150', '최대 체력 +300', '최대 체력 +450, 피해 감소 10%', '최대 체력 +700, 피해 감소 25%']
  },
  '요들': {
    thresholds: [3, 6, 9],
    effects: ['체력 +150', '체력 +300, 피해 +15%', '체력 +500, 피해 +40%, 방어막']
  }
};

module.exports = {
  META_COMPS,
  AUGMENT_TIERS,
  UNIT_COSTS,
  POSITIONING_GUIDE,
  ECONOMY_GUIDE,
  SYNERGY_INFO
};
