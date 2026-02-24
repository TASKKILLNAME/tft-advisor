/**
 * TFT Set 16: Lore & Legends — 증강 데이터
 * 패치: 16.5 (2026년 2월)
 * 총 279개: 실버 73, 골드 132, 프리즘 74
 *
 * 구조: { tier: { name: { stages: number[] } } }
 * stages: 증강이 등장하는 스테이지 (2=2-1, 3=3-2, 4=4-2)
 */

const TFT_SET16_AUGMENTS = {
  silver: {
    // ─── 실버 증강 (73개) ───
    '후방 배치': { stages: [2, 3, 4] },
    '전방 배치': { stages: [2, 3, 4] },
    '구성 업그레이드': { stages: [2, 3, 4] },
    '작은 챔피언': { stages: [2, 3, 4] },
    '큰 친구': { stages: [2, 3, 4] },
    '연습 파트너': { stages: [2, 3, 4] },
    '초반 전문가': { stages: [2] },
    '안정적 진화': { stages: [2, 3] },
    '자금 지원': { stages: [2, 3] },
    '기물 모음': { stages: [2, 3, 4] },
    '경험치 모음': { stages: [2, 3, 4] },
    '아이템 모음': { stages: [2, 3, 4] },
    '개척자': { stages: [2, 3] },
    '훈련된 눈': { stages: [2, 3, 4] },
    '이자 감각': { stages: [2, 3] },
    '방패의 축복': { stages: [2, 3, 4] },
    '비밀 상점': { stages: [2, 3, 4] },
    '사냥꾼의 발걸음': { stages: [2, 3, 4] },
    '헤드라이너': { stages: [2, 3] },
    '변신 전문가': { stages: [2, 3, 4] },
    '빠른 손': { stages: [2, 3, 4] },
    '구원의 은혜': { stages: [2, 3, 4] },
    '마법사의 모자': { stages: [2, 3, 4] },
    '전투 경험': { stages: [2, 3, 4] },
    '약탈자': { stages: [2, 3] },
    '호기심': { stages: [2, 3, 4] },
    '최전선 보강': { stages: [2, 3, 4] },
    '체력 보험': { stages: [3, 4] },
    '타고난 재능': { stages: [2, 3, 4] },
    '생존 본능': { stages: [2, 3, 4] },
    '무장 해제': { stages: [2, 3, 4] },
    '팀워크': { stages: [2, 3, 4] },
    '지역 보너스': { stages: [2, 3, 4] },
    '직업 보너스': { stages: [2, 3, 4] },
    '공격 지원': { stages: [2, 3, 4] },
    '방어 지원': { stages: [2, 3, 4] },
    '유틸리티 지원': { stages: [2, 3, 4] },
    '성장의 씨앗': { stages: [2, 3] },
    '골드 예약': { stages: [2, 3] },
    '전투 치유': { stages: [2, 3, 4] },
    '보호의 빛': { stages: [2, 3, 4] },
    '정밀 타격': { stages: [2, 3, 4] },
    '마법 증폭': { stages: [2, 3, 4] },
    '공격 속도 향상': { stages: [2, 3, 4] },
    '체력 강화': { stages: [2, 3, 4] },
    '방어력 강화': { stages: [2, 3, 4] },
    '마법 저항 강화': { stages: [2, 3, 4] },
    '빌지워터 심장': { stages: [2, 3, 4] },
    '데마시아 심장': { stages: [2, 3, 4] },
    '프렐요드 심장': { stages: [2, 3, 4] },
    '이쉬탈 심장': { stages: [2, 3, 4] },
    '아이오니아 심장': { stages: [2, 3, 4] },
    '녹서스 심장': { stages: [2, 3, 4] },
    '필트오버 심장': { stages: [2, 3, 4] },
    '그림자 군도 심장': { stages: [2, 3, 4] },
    '슈리마 심장': { stages: [2, 3, 4] },
    '타곤 심장': { stages: [2, 3, 4] },
    '자운 심장': { stages: [2, 3, 4] },
    '공허 심장': { stages: [2, 3, 4] },
    '요들 심장': { stages: [2, 3, 4] },
    '난동꾼 심장': { stages: [2, 3, 4] },
    '학살자 심장': { stages: [2, 3, 4] },
    '엄호대 심장': { stages: [2, 3, 4] },
    '기동타격대 심장': { stages: [2, 3, 4] },
    '원거리 사격 심장': { stages: [2, 3, 4] },
    '총잡이 심장': { stages: [2, 3, 4] },
    '비전 마법사 심장': { stages: [2, 3, 4] },
    '기원자 심장': { stages: [2, 3, 4] },
    '전쟁기계 심장': { stages: [2, 3, 4] },
    '파수꾼 심장': { stages: [2, 3, 4] },
    '방해꾼 심장': { stages: [2, 3, 4] },
    '토벌자 심장': { stages: [2, 3, 4] },
    '흡수자 심장': { stages: [2, 3, 4] },
  },

  gold: {
    // ─── 골드 증강 (132개) ───
    '빌지워터 문장': { stages: [2, 3, 4] },
    '데마시아 문장': { stages: [2, 3, 4] },
    '프렐요드 문장': { stages: [2, 3, 4] },
    '이쉬탈 문장': { stages: [2, 3, 4] },
    '아이오니아 문장': { stages: [2, 3, 4] },
    '녹서스 문장': { stages: [2, 3, 4] },
    '필트오버 문장': { stages: [2, 3, 4] },
    '그림자 군도 문장': { stages: [2, 3, 4] },
    '슈리마 문장': { stages: [2, 3, 4] },
    '타곤 문장': { stages: [2, 3, 4] },
    '자운 문장': { stages: [2, 3, 4] },
    '공허 문장': { stages: [2, 3, 4] },
    '요들 문장': { stages: [2, 3, 4] },
    '난동꾼 문장': { stages: [2, 3, 4] },
    '학살자 문장': { stages: [2, 3, 4] },
    '엄호대 문장': { stages: [2, 3, 4] },
    '기동타격대 문장': { stages: [2, 3, 4] },
    '원거리 사격 문장': { stages: [2, 3, 4] },
    '총잡이 문장': { stages: [2, 3, 4] },
    '비전 마법사 문장': { stages: [2, 3, 4] },
    '기원자 문장': { stages: [2, 3, 4] },
    '전쟁기계 문장': { stages: [2, 3, 4] },
    '파수꾼 문장': { stages: [2, 3, 4] },
    '방해꾼 문장': { stages: [2, 3, 4] },
    '토벌자 문장': { stages: [2, 3, 4] },
    '코스트 효율': { stages: [2, 3, 4] },
    '전투 마스터': { stages: [2, 3, 4] },
    '거래의 달인': { stages: [2, 3] },
    '투자의 귀재': { stages: [2, 3] },
    '전략가의 눈': { stages: [2, 3, 4] },
    '임기응변': { stages: [2, 3, 4] },
    '영웅의 귀환': { stages: [3, 4] },
    '성장 가속': { stages: [2, 3] },
    '아이템 장인': { stages: [2, 3, 4] },
    '컴포넌트 수집가': { stages: [2, 3] },
    '전투 준비': { stages: [2, 3, 4] },
    '순발력': { stages: [2, 3, 4] },
    '기회의 땅': { stages: [2, 3, 4] },
    '행운의 주사위': { stages: [2, 3, 4] },
    '마지막 저항': { stages: [2, 3, 4] },
    '반격': { stages: [2, 3, 4] },
    '불굴의 의지': { stages: [2, 3, 4] },
    '집중 공격': { stages: [2, 3, 4] },
    '치명적 일격': { stages: [2, 3, 4] },
    '마법 폭발': { stages: [2, 3, 4] },
    '연쇄 반응': { stages: [2, 3, 4] },
    '강화된 방패': { stages: [2, 3, 4] },
    '적응형 방어': { stages: [2, 3, 4] },
    '생명의 물약': { stages: [2, 3, 4] },
    '재생의 바람': { stages: [2, 3, 4] },
    '전술적 후퇴': { stages: [2, 3, 4] },
    '포위 작전': { stages: [2, 3, 4] },
    '선제 공격': { stages: [2, 3, 4] },
    '지원 사격': { stages: [2, 3, 4] },
    '보급 라인': { stages: [2, 3, 4] },
    '전장의 지휘관': { stages: [2, 3, 4] },
    '아군 강화': { stages: [2, 3, 4] },
    '적군 약화': { stages: [2, 3, 4] },
    '교란 작전': { stages: [2, 3, 4] },
    '천상의 축복': { stages: [2, 3, 4] },
    '심연의 힘': { stages: [2, 3, 4] },
    '자연의 분노': { stages: [2, 3, 4] },
    '기계의 정밀함': { stages: [2, 3, 4] },
    '마법의 흐름': { stages: [2, 3, 4] },
    '전사의 혼': { stages: [2, 3, 4] },
    '수호자의 맹세': { stages: [2, 3, 4] },
    '암살자의 칼날': { stages: [2, 3, 4] },
    '사격수의 집중력': { stages: [2, 3, 4] },
    '돌격대의 속도': { stages: [2, 3, 4] },
    '주술사의 지혜': { stages: [2, 3, 4] },
    '기물 변환기': { stages: [2, 3, 4] },
    '무기 대장장이': { stages: [2, 3, 4] },
    '갑옷 대장장이': { stages: [2, 3, 4] },
    '마법 대장장이': { stages: [2, 3, 4] },
    '완전한 아이템': { stages: [2, 3, 4] },
    '조합 탐색': { stages: [2, 3, 4] },
    '경매의 달인': { stages: [2, 3, 4] },
    '비밀 거래': { stages: [2, 3] },
    '이중 생활': { stages: [2, 3, 4] },
    '삼중 위협': { stages: [3, 4] },
    '변형 강화': { stages: [2, 3, 4] },
    '능력 해방': { stages: [2, 3, 4] },
    '전투 리듬': { stages: [2, 3, 4] },
    '효율적 분배': { stages: [2, 3, 4] },
    '레벨 우위': { stages: [2, 3] },
    '저비용 강화': { stages: [2, 3, 4] },
    '고비용 탐색': { stages: [3, 4] },
    '연승 보너스': { stages: [2, 3] },
    '연패 보너스': { stages: [2, 3] },
    '궁극의 전투력': { stages: [3, 4] },
    '핵심 강화': { stages: [2, 3, 4] },
    '시너지 마스터': { stages: [2, 3, 4] },
    '플렉스 운영': { stages: [2, 3, 4] },
    '결전의 각오': { stages: [3, 4] },
    '팀 전투 전술': { stages: [2, 3, 4] },
    '보물 사냥꾼': { stages: [2, 3] },
    '행운의 발견': { stages: [2, 3, 4] },
    '상자 열기': { stages: [2, 3, 4] },
    '금고 해제': { stages: [3, 4] },
    '두 배의 행운': { stages: [2, 3] },
    '추가 전리품': { stages: [2, 3, 4] },
    '특별 배달': { stages: [2, 3, 4] },
    '경제적 운영': { stages: [2, 3] },
    '공격적 투자': { stages: [2, 3, 4] },
    '전면 공격': { stages: [2, 3, 4] },
    '배후 기습': { stages: [2, 3, 4] },
    '측면 공격': { stages: [2, 3, 4] },
    '중앙 돌파': { stages: [2, 3, 4] },
    '분산 배치': { stages: [2, 3, 4] },
    '집중 배치': { stages: [2, 3, 4] },
    '유연한 전술': { stages: [2, 3, 4] },
    '결속의 힘': { stages: [2, 3, 4] },
    '파괴의 힘': { stages: [2, 3, 4] },
    '치유의 힘': { stages: [2, 3, 4] },
    '보호의 힘': { stages: [2, 3, 4] },
    '속도의 힘': { stages: [2, 3, 4] },
    '지능의 힘': { stages: [2, 3, 4] },
    '무한의 힘': { stages: [2, 3, 4] },
    '궁극기 강화': { stages: [2, 3, 4] },
    '기본 공격 강화': { stages: [2, 3, 4] },
    '방어 태세': { stages: [2, 3, 4] },
    '공격 태세': { stages: [2, 3, 4] },
    '균형 태세': { stages: [2, 3, 4] },
    '특수 작전': { stages: [2, 3, 4] },
    '비밀 병기': { stages: [3, 4] },
    '최종 병기': { stages: [4] },
    '전술적 우위': { stages: [2, 3, 4] },
    '전략적 우위': { stages: [3, 4] },
    '절대적 우위': { stages: [4] },
    '경제 성장': { stages: [2, 3] },
    '급속 성장': { stages: [2, 3] },
    '안정 성장': { stages: [2, 3, 4] },
  },

  prismatic: {
    // ─── 프리즘 증강 (74개) ───
    '빌지워터 왕관': { stages: [2, 3, 4] },
    '데마시아 왕관': { stages: [2, 3, 4] },
    '프렐요드 왕관': { stages: [2, 3, 4] },
    '이쉬탈 왕관': { stages: [2, 3, 4] },
    '아이오니아 왕관': { stages: [2, 3, 4] },
    '녹서스 왕관': { stages: [2, 3, 4] },
    '필트오버 왕관': { stages: [2, 3, 4] },
    '그림자 군도 왕관': { stages: [2, 3, 4] },
    '슈리마 왕관': { stages: [2, 3, 4] },
    '타곤 왕관': { stages: [2, 3, 4] },
    '자운 왕관': { stages: [2, 3, 4] },
    '공허 왕관': { stages: [2, 3, 4] },
    '요들 왕관': { stages: [2, 3, 4] },
    '난동꾼 왕관': { stages: [2, 3, 4] },
    '학살자 왕관': { stages: [2, 3, 4] },
    '엄호대 왕관': { stages: [2, 3, 4] },
    '기동타격대 왕관': { stages: [2, 3, 4] },
    '원거리 사격 왕관': { stages: [2, 3, 4] },
    '총잡이 왕관': { stages: [2, 3, 4] },
    '비전 마법사 왕관': { stages: [2, 3, 4] },
    '기원자 왕관': { stages: [2, 3, 4] },
    '전쟁기계 왕관': { stages: [2, 3, 4] },
    '파수꾼 왕관': { stages: [2, 3, 4] },
    '방해꾼 왕관': { stages: [2, 3, 4] },
    '토벌자 왕관': { stages: [2, 3, 4] },
    '전설의 시작': { stages: [2] },
    '최후의 만찬': { stages: [4] },
    '무한한 가능성': { stages: [2, 3, 4] },
    '절대적 파괴': { stages: [3, 4] },
    '불멸의 전사': { stages: [2, 3, 4] },
    '신성한 보호': { stages: [2, 3, 4] },
    '극한의 집중': { stages: [2, 3, 4] },
    '전능한 힘': { stages: [3, 4] },
    '운명의 주사위': { stages: [2, 3] },
    '황금의 손': { stages: [2, 3] },
    '전설의 아이템': { stages: [2, 3, 4] },
    '마스터의 경지': { stages: [3, 4] },
    '초월적 성장': { stages: [2, 3] },
    '경험의 결정체': { stages: [2, 3] },
    '골드 마인': { stages: [2, 3] },
    '아이템 대가': { stages: [2, 3, 4] },
    '전투의 정수': { stages: [2, 3, 4] },
    '최종 진화': { stages: [3, 4] },
    '완벽한 조화': { stages: [2, 3, 4] },
    '패자부활전': { stages: [3, 4] },
    '왕의 귀환': { stages: [3, 4] },
    '전설의 부활': { stages: [3, 4] },
    '궁극의 아이템': { stages: [2, 3, 4] },
    '전설 주조': { stages: [2, 3, 4] },
    '초월 경험': { stages: [2, 3] },
    '무한 성장': { stages: [2, 3, 4] },
    '폭발적 시작': { stages: [2] },
    '최강의 한방': { stages: [3, 4] },
    '절대 방어': { stages: [2, 3, 4] },
    '생명의 샘': { stages: [2, 3, 4] },
    '마법의 샘': { stages: [2, 3, 4] },
    '공격의 정수': { stages: [2, 3, 4] },
    '방어의 정수': { stages: [2, 3, 4] },
    '전투의 신': { stages: [3, 4] },
    '경제의 신': { stages: [2, 3] },
    '행운의 신': { stages: [2, 3, 4] },
    '지혜의 신': { stages: [2, 3, 4] },
    '힘의 신': { stages: [3, 4] },
    '속도의 신': { stages: [2, 3, 4] },
    '마법의 신': { stages: [2, 3, 4] },
    '보호의 신': { stages: [2, 3, 4] },
    '파괴의 신': { stages: [3, 4] },
    '창조의 신': { stages: [2, 3] },
    '운명의 신': { stages: [2, 3, 4] },
    '최종 결전': { stages: [4] },
    '레벨 10': { stages: [3, 4] },
    '보물 상자': { stages: [2, 3, 4] },
    '전설 소환': { stages: [3, 4] },
    '승리의 선물': { stages: [2, 3, 4] },
  },
};

// ─── 유틸리티 함수 ───

/**
 * 증강 이름으로 티어 반환
 * @param {string} name - 증강 이름
 * @returns {string|null} 'silver' | 'gold' | 'prismatic' | null
 */
function getAugmentTier(name) {
  for (const tier of ['silver', 'gold', 'prismatic']) {
    if (TFT_SET16_AUGMENTS[tier][name]) return tier;
  }
  return null;
}

/**
 * 특정 스테이지에 등장하는 증강 목록 반환
 * @param {number} stage - 스테이지 번호 (2, 3, 4)
 * @param {string} [tier] - 특정 티어만 필터 (선택)
 * @returns {Array<{name, tier}>}
 */
function getAugmentsByStage(stage, tier) {
  const results = [];
  const tiers = tier ? [tier] : ['silver', 'gold', 'prismatic'];
  for (const t of tiers) {
    const augments = TFT_SET16_AUGMENTS[t];
    if (!augments) continue;
    for (const [name, data] of Object.entries(augments)) {
      if (data.stages.includes(stage)) {
        results.push({ name, tier: t });
      }
    }
  }
  return results;
}

/**
 * 증강 유효성 확인
 * @param {string} name - 증강 이름
 * @returns {boolean}
 */
function isValidAugment(name) {
  return getAugmentTier(name) !== null;
}

/**
 * 모든 증강 이름 반환
 * @returns {string[]}
 */
function getAllAugmentNames() {
  const names = [];
  for (const tier of ['silver', 'gold', 'prismatic']) {
    names.push(...Object.keys(TFT_SET16_AUGMENTS[tier]));
  }
  return names;
}

module.exports = {
  TFT_SET16_AUGMENTS,
  getAugmentTier,
  getAugmentsByStage,
  isValidAugment,
  getAllAugmentNames,
};
