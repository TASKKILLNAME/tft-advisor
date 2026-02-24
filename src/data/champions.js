/**
 * TFT Set 16: Lore & Legends — 챔피언 데이터
 * 패치: 16.5 (2026년 2월 기준)
 * 출처: lolchess.gg
 *
 * TFT_SET16_CHAMPIONS: 한글이름 → { engId, cost, synergies[] }
 * 총 100명: 1코 14, 2코 18, 3코 18, 4코 26, 5코 18, 7코해금 6
 */

const TFT_SET16_CHAMPIONS = {
  // ─── 1코스트 (14명) ───
  '애니비아': { engId: 'anivia', cost: 1, synergies: ['프렐요드', '기원자'] },
  '블리츠크랭크': { engId: 'blitzcrank', cost: 1, synergies: ['자운', '파수꾼'] },
  '브라이어': { engId: 'briar', cost: 1, synergies: ['녹서스', '학살자'] },
  '케이틀린': { engId: 'caitlyn', cost: 1, synergies: ['필트오버', '원거리 사격'] },
  '일라오이': { engId: 'illaoi', cost: 1, synergies: ['빌지워터', '난동꾼'] },
  '자르반 4세': { engId: 'jarvaniv', cost: 1, synergies: ['데마시아', '엄호대'] },
  '코그모': { engId: 'kogmaw', cost: 1, synergies: ['공허', '비전 마법사'] },
  '룰루': { engId: 'lulu', cost: 1, synergies: ['요들', '비전 마법사'] },
  '뽀삐': { engId: 'poppy', cost: 1, synergies: ['요들', '난동꾼'] },
  '럼블': { engId: 'rumble', cost: 1, synergies: ['요들', '총잡이'] },
  '셴': { engId: 'shen', cost: 1, synergies: ['아이오니아', '파수꾼'] },
  '소나': { engId: 'sona', cost: 1, synergies: ['데마시아', '기원자'] },
  '트리스타나': { engId: 'tristana', cost: 1, synergies: ['요들', '총잡이'] },
  '이렐리아': { engId: 'irelia', cost: 1, synergies: ['아이오니아', '기동타격대'] },

  // ─── 2코스트 (18명) ───
  '아펠리오스': { engId: 'aphelios', cost: 2, synergies: ['타곤', '원거리 사격'] },
  '애쉬': { engId: 'ashe', cost: 2, synergies: ['프렐요드', '원거리 사격'] },
  '초가스': { engId: 'chogath', cost: 2, synergies: ['공허', '난동꾼'] },
  '에코': { engId: 'ekko', cost: 2, synergies: ['자운', '방해꾼'] },
  '그레이브즈': { engId: 'graves', cost: 2, synergies: ['빌지워터', '총잡이'] },
  '레오나': { engId: 'leona', cost: 2, synergies: ['타곤', '엄호대'] },
  '로리스': { engId: 'loris', cost: 2, synergies: ['필트오버', '기원자'] },
  '밀리오': { engId: 'milio', cost: 2, synergies: ['이쉬탈', '기원자'] },
  '니코': { engId: 'neeko', cost: 2, synergies: ['이쉬탈', '엄호대'] },
  '녹턴': { engId: 'nocturne', cost: 2, synergies: ['그림자 군도', '학살자'] },
  '키아나': { engId: 'qiyana', cost: 2, synergies: ['이쉬탈', '방해꾼'] },
  '사이온': { engId: 'sion', cost: 2, synergies: ['녹서스', '난동꾼'] },
  '트린다미어': { engId: 'tryndamere', cost: 2, synergies: ['프렐요드', '학살자'] },
  '트위스티드 페이트': { engId: 'twistedfate', cost: 2, synergies: ['빌지워터', '기동타격대'] },
  '트위치': { engId: 'twitch', cost: 2, synergies: ['자운', '총잡이'] },
  '바이': { engId: 'vi', cost: 2, synergies: ['필트오버', '난동꾼'] },
  '신 짜오': { engId: 'xinzhao', cost: 2, synergies: ['데마시아', '전쟁기계'] },
  '바드': { engId: 'bard', cost: 2, synergies: ['이쉬탈', '기원자'] },

  // ─── 3코스트 (18명) ───
  '아리': { engId: 'ahri', cost: 3, synergies: ['아이오니아', '비전 마법사'] },
  '다리우스': { engId: 'darius', cost: 3, synergies: ['녹서스', '엄호대'] },
  '문도 박사': { engId: 'drmundo', cost: 3, synergies: ['자운', '난동꾼'] },
  '드레이븐': { engId: 'draven', cost: 3, synergies: ['녹서스', '기동타격대'] },
  '갱플랭크': { engId: 'gangplank', cost: 3, synergies: ['빌지워터', '학살자'] },
  '그웬': { engId: 'gwen', cost: 3, synergies: ['그림자 군도', '방해꾼'] },
  '징크스': { engId: 'jinx', cost: 3, synergies: ['자운', '총잡이'] },
  '케넨': { engId: 'kennen', cost: 3, synergies: ['아이오니아', '엄호대'] },
  '코부코와 유미': { engId: 'kobukoyuumi', cost: 3, synergies: ['요들', '난동꾼'] },
  '말자하': { engId: 'malzahar', cost: 3, synergies: ['공허', '방해꾼'] },
  '노틸러스': { engId: 'nautilus', cost: 3, synergies: ['빌지워터', '파수꾼'] },
  '세주아니': { engId: 'sejuani', cost: 3, synergies: ['프렐요드', '엄호대'] },
  '쓰레쉬': { engId: 'thresh', cost: 3, synergies: ['그림자 군도', '파수꾼'] },
  '바루스': { engId: 'varus', cost: 3, synergies: ['아이오니아', '원거리 사격'] },
  '비에고': { engId: 'viego', cost: 3, synergies: ['그림자 군도', '학살자'] },
  '야스오': { engId: 'yasuo', cost: 3, synergies: ['아이오니아', '기동타격대'] },
  '요릭': { engId: 'yorick', cost: 3, synergies: ['그림자 군도', '파수꾼'] },
  '조이': { engId: 'zoe', cost: 3, synergies: ['타곤', '비전 마법사'] },

  // ─── 4코스트 (26명) ───
  '암베사': { engId: 'ambessa', cost: 4, synergies: ['녹서스', '기동타격대'] },
  '벨베스': { engId: 'belveth', cost: 4, synergies: ['공허', '학살자'] },
  '브라움': { engId: 'braum', cost: 4, synergies: ['프렐요드', '전쟁기계'] },
  '다이애나': { engId: 'diana', cost: 4, synergies: ['타곤', '토벌자'] },
  '피즈': { engId: 'fizz', cost: 4, synergies: ['빌지워터', '기동타격대'] },
  '가렌': { engId: 'garen', cost: 4, synergies: ['데마시아', '엄호대'] },
  '카이사': { engId: 'kaisa', cost: 4, synergies: ['공허', '흡수자'] },
  '칼리스타': { engId: 'kalista', cost: 4, synergies: ['그림자 군도', '토벌자'] },
  '카서스': { engId: 'karthus', cost: 4, synergies: ['그림자 군도', '기원자'] },
  '카직스': { engId: 'khazix', cost: 4, synergies: ['공허', '학살자'] },
  '리산드라': { engId: 'lissandra', cost: 4, synergies: ['프렐요드', '방해꾼'] },
  '럭스': { engId: 'lux', cost: 4, synergies: ['데마시아', '비전 마법사'] },
  '미스 포츈': { engId: 'missfortune', cost: 4, synergies: ['빌지워터', '총잡이'] },
  '니달리': { engId: 'nidalee', cost: 4, synergies: ['이쉬탈', '여사냥꾼'] },
  '오리아나': { engId: 'orianna', cost: 4, synergies: ['필트오버', '기원자'] },
  '리프트 헤럴드': { engId: 'riftherald', cost: 4, synergies: ['공허', '난동꾼'] },
  '세라핀': { engId: 'seraphine', cost: 4, synergies: ['자운', '방해꾼'] },
  '신지드': { engId: 'singed', cost: 4, synergies: ['자운', '전쟁기계'] },
  '스카너': { engId: 'skarner', cost: 4, synergies: ['이쉬탈', '전쟁기계'] },
  '스웨인': { engId: 'swain', cost: 4, synergies: ['녹서스', '비전 마법사'] },
  '베이가': { engId: 'veigar', cost: 4, synergies: ['요들', '비전 마법사'] },
  '워윅': { engId: 'warwick', cost: 4, synergies: ['자운', '학살자'] },
  '우콩': { engId: 'wukong', cost: 4, synergies: ['아이오니아', '난동꾼', '토벌자'] },
  '요네': { engId: 'yone', cost: 4, synergies: ['아이오니아', '학살자'] },
  '유나라': { engId: 'yunara', cost: 4, synergies: ['아이오니아', '방해꾼'] },
  '케일': { engId: 'kayle', cost: 4, synergies: ['데마시아', '원거리 사격'] },

  // ─── 5코스트 (18명) ───
  '아트록스': { engId: 'aatrox', cost: 5, synergies: ['다르킨', '세계의 종결자'] },
  '애니': { engId: 'annie', cost: 5, synergies: ['어둠의 아이'] },
  '아우렐리온 솔': { engId: 'aurelionsol', cost: 5, synergies: ['타곤', '별의 창조자'] },
  '아지르': { engId: 'azir', cost: 5, synergies: ['슈리마', '황제'] },
  '피들스틱': { engId: 'fiddlesticks', cost: 5, synergies: ['수확자'] },
  '갈리오': { engId: 'galio', cost: 5, synergies: ['데마시아', '영웅'] },
  '킨드레드': { engId: 'kindred', cost: 5, synergies: ['영겁', '토벌자'] },
  '르블랑': { engId: 'leblanc', cost: 5, synergies: ['녹서스', '토벌자'] },
  '루시안과 세나': { engId: 'luciansenna', cost: 5, synergies: ['영혼결속자', '총잡이'] },
  '멜': { engId: 'mel', cost: 5, synergies: ['녹서스', '방해꾼'] },
  '나서스': { engId: 'nasus', cost: 5, synergies: ['슈리마', '전쟁기계'] },
  '오른': { engId: 'ornn', cost: 5, synergies: ['프렐요드', '대장장이'] },
  '쉬바나': { engId: 'shyvana', cost: 5, synergies: ['드래곤본'] },
  '탐 켄치': { engId: 'tahmkench', cost: 5, synergies: ['빌지워터', '대식가', '난동꾼'] },
  '타릭': { engId: 'taric', cost: 5, synergies: ['타곤', '파수꾼'] },
  '볼리베어': { engId: 'volibear', cost: 5, synergies: ['프렐요드', '난동꾼'] },
  '질리언': { engId: 'zilean', cost: 5, synergies: ['시간의 수호자'] },

  // ─── 7코스트 해금 (6명) ───
  '내셔 남작': { engId: 'baronnashor', cost: 7, synergies: ['공허', '균열의 재앙'] },
  '브록': { engId: 'brock', cost: 7, synergies: ['우두머리'] },
  '레넥톤': { engId: 'renekton', cost: 7, synergies: ['슈리마', '초월체'] },
  '사일러스': { engId: 'sylas', cost: 7, synergies: ['사슬파괴자'] },
  '세트': { engId: 'sett', cost: 7, synergies: ['아이오니아', '전쟁기계'] },
  '제라스': { engId: 'xerath', cost: 7, synergies: ['슈리마', '초월체'] },

  // ─── 소환물/특수 ───
  'T-헥스': { engId: 'thex', cost: 5, synergies: ['T-헥스', '총잡이'] },
  '티버': { engId: 'tibbers', cost: 5, synergies: ['비전 마법사'] },
  '라이즈': { engId: 'ryze', cost: 7, synergies: ['룬 마법사'] },
  '직스': { engId: 'ziggs', cost: 5, synergies: ['자운', '비전 마법사'] },
  '테모': { engId: 'teemo', cost: 4, synergies: ['요들', '원거리 사격'] },
};

// ─── 역매핑: engId → 한글이름 ───
const ENG_TO_KOR = {};
Object.entries(TFT_SET16_CHAMPIONS).forEach(([korName, data]) => {
  ENG_TO_KOR[data.engId] = korName;
});

/**
 * CDN 아이콘 URL 생성
 * @param {string} engId - 영문 챔피언 ID (소문자)
 * @returns {string} CDN URL
 */
function getChampionIconUrl(engId) {
  return `https://cdn.dak.gg/tft/images2/tft/champions/set16/${engId}.png`;
}

/**
 * 조합 유닛 목록으로 챔피언 데이터 배열 반환
 * @param {string[]} unitNames - 한글 유닛 이름 배열
 * @returns {Array<{name, engId, cost, synergies, iconUrl}>}
 */
function getChampionsByComp(unitNames) {
  if (!unitNames || !Array.isArray(unitNames)) return [];
  return unitNames.map(name => {
    const champ = TFT_SET16_CHAMPIONS[name];
    if (!champ) return { name, engId: 'unknown', cost: 0, synergies: [], iconUrl: '' };
    return {
      name,
      engId: champ.engId,
      cost: champ.cost,
      synergies: champ.synergies,
      iconUrl: getChampionIconUrl(champ.engId),
    };
  });
}

module.exports = {
  TFT_SET16_CHAMPIONS,
  ENG_TO_KOR,
  getChampionIconUrl,
  getChampionsByComp,
};
