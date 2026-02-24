/**
 * TFT Set 16: Lore & Legends — 챔피언 데이터
 * 패치: 16.5 (2026년 2월 기준)
 *
 * TFT_SET16_CHAMPIONS: 한글이름 → { engId, cost, synergies[] }
 */

const TFT_SET16_CHAMPIONS = {
  // ─── 1코스트 ───
  '애니비아': { engId: 'anivia', cost: 1, synergies: ['프렐요드', '인보커'] },
  '일라오이': { engId: 'illaoi', cost: 1, synergies: ['빌지워터', '브루저'] },
  '자르반 IV': { engId: 'jarvaniv', cost: 1, synergies: ['데마시아', '디펜더'] },
  '진': { engId: 'jhin', cost: 1, synergies: ['아이오니아', '건슬링어'] },
  '코그모': { engId: 'kogmaw', cost: 1, synergies: ['공허', '아르카니스트'] },
  '레오나': { engId: 'leona', cost: 1, synergies: ['타곤', '워든'] },
  '룰루': { engId: 'lulu', cost: 1, synergies: ['요들', '아르카니스트'] },
  '럼블': { engId: 'rumble', cost: 1, synergies: ['요들', '디펜더'] },
  '셴': { engId: 'shen', cost: 1, synergies: ['아이오니아', '브루저'] },
  '소나': { engId: 'sona', cost: 1, synergies: ['데마시아', '인보커'] },
  '엘리스': { engId: 'elise', cost: 1, synergies: ['섀도우 아일', '슬레이어'] },
  '나미': { engId: 'nami', cost: 1, synergies: ['빌지워터', '인보커'] },
  '카시오페아': { engId: 'cassiopeia', cost: 1, synergies: ['녹서스', '아르카니스트'] },

  // ─── 2코스트 ───
  '아펠리오스': { engId: 'aphelios', cost: 2, synergies: ['타곤', '롱샷'] },
  '애쉬': { engId: 'ashe', cost: 2, synergies: ['프렐요드', '롱샷'] },
  '바드': { engId: 'bard', cost: 2, synergies: ['케어테이커', '인보커'] },
  '블리츠크랭크': { engId: 'blitzcrank', cost: 2, synergies: ['자운', '워든'] },
  '에코': { engId: 'ekko', cost: 2, synergies: ['자운', '디스럽터'] },
  '그레이브즈': { engId: 'graves', cost: 2, synergies: ['빌지워터', '건슬링어'] },
  '로리스': { engId: 'loris', cost: 2, synergies: ['필토버', '인보커'] },
  '네코': { engId: 'neeko', cost: 2, synergies: ['익스탈', '디펜더', '아르카니스트'] },
  '포피': { engId: 'poppy', cost: 2, synergies: ['데마시아', '브루저'] },
  '사이온': { engId: 'sion', cost: 2, synergies: ['녹서스', '브루저'] },
  '트리스타나': { engId: 'tristana', cost: 2, synergies: ['요들', '건슬링어'] },
  '트린다미어': { engId: 'tryndamere', cost: 2, synergies: ['프렐요드', '슬레이어'] },
  '트위스티드 페이트': { engId: 'twistedfate', cost: 2, synergies: ['빌지워터', '퀵스트라이커'] },
  '바이': { engId: 'vi', cost: 2, synergies: ['필토버', '디펜더'] },
  '신 짜오': { engId: 'xinzhao', cost: 2, synergies: ['데마시아', '저거너트'] },
  '트위치': { engId: 'twitch', cost: 2, synergies: ['자운', '건슬링어'] },
  '녹턴': { engId: 'nocturne', cost: 2, synergies: ['섀도우 아일', '슬레이어'] },

  // ─── 3코스트 ───
  '아리': { engId: 'ahri', cost: 3, synergies: ['아이오니아', '아르카니스트'] },
  '다리우스': { engId: 'darius', cost: 3, synergies: ['녹서스', '디펜더'] },
  '닥터 문도': { engId: 'drmundo', cost: 3, synergies: ['자운', '브루저'] },
  '드레이븐': { engId: 'draven', cost: 3, synergies: ['녹서스', '퀵스트라이커'] },
  '갱플랭크': { engId: 'gangplank', cost: 3, synergies: ['빌지워터', '슬레이어'] },
  '그웬': { engId: 'gwen', cost: 3, synergies: ['섀도우 아일', '디스럽터'] },
  '징크스': { engId: 'jinx', cost: 3, synergies: ['자운', '건슬링어'] },
  '케넨': { engId: 'kennen', cost: 3, synergies: ['아이오니아', '디펜더'] },
  '코부코&유미': { engId: 'kobukoyuumi', cost: 3, synergies: ['익스탈', '브루저'] },
  '말자하': { engId: 'malzahar', cost: 3, synergies: ['공허', '디스럽터'] },
  '노틸러스': { engId: 'nautilus', cost: 3, synergies: ['빌지워터', '워든'] },
  '세주아니': { engId: 'sejuani', cost: 3, synergies: ['프렐요드', '디펜더'] },
  '바인': { engId: 'vayne', cost: 3, synergies: ['데마시아', '롱샷'] },
  '비에고': { engId: 'viego', cost: 3, synergies: ['섀도우 아일', '슬레이어'] },
  '렉사이': { engId: 'reksai', cost: 3, synergies: ['공허', '브루저'] },
  '바루스': { engId: 'varus', cost: 3, synergies: ['아이오니아', '롱샷'] },
  '카서스': { engId: 'karthus', cost: 3, synergies: ['섀도우 아일', '인보커'] },

  // ─── 4코스트 ───
  '암베사': { engId: 'ambessa', cost: 4, synergies: ['녹서스', '퀵스트라이커'] },
  '벨베스': { engId: 'belveth', cost: 4, synergies: ['공허', '슬레이어'] },
  '브라움': { engId: 'braum', cost: 4, synergies: ['프렐요드', '저거너트'] },
  '피즈': { engId: 'fizz', cost: 4, synergies: ['빌지워터', '퀵스트라이커'] },
  '가렌': { engId: 'garen', cost: 4, synergies: ['데마시아', '디펜더'] },
  '카이사': { engId: 'kaisa', cost: 4, synergies: ['어시밀레이터', '공허'] },
  '리산드라': { engId: 'lissandra', cost: 4, synergies: ['프렐요드', '인보커'] },
  '럭스': { engId: 'lux', cost: 4, synergies: ['데마시아', '아르카니스트'] },
  '미스 포츈': { engId: 'missfortune', cost: 4, synergies: ['빌지워터', '건슬링어'] },
  '니달리': { engId: 'nidalee', cost: 4, synergies: ['익스탈', '헌트리스'] },
  '리프트 헤럴드': { engId: 'riftherald', cost: 4, synergies: ['공허', '브루저'] },
  '세라핀': { engId: 'seraphine', cost: 4, synergies: ['자운', '디스럽터'] },
  '스카너': { engId: 'skarner', cost: 4, synergies: ['익스탈', '저거너트'] },
  '스웨인': { engId: 'swain', cost: 4, synergies: ['녹서스', '아르카니스트'] },
  '베이가': { engId: 'veigar', cost: 4, synergies: ['요들', '아르카니스트'] },
  '우콩': { engId: 'wukong', cost: 4, synergies: ['아이오니아', '브루저', '뱅퀴셔'] },
  '오리아나': { engId: 'orianna', cost: 4, synergies: ['필토버', '인보커'] },
  '제드': { engId: 'zed', cost: 4, synergies: ['아이오니아', '슬레이어'] },
  '케일': { engId: 'kayle', cost: 4, synergies: ['데마시아', '롱샷'] },
  '카직스': { engId: 'khazix', cost: 4, synergies: ['공허', '슬레이어'] },
  '자야': { engId: 'xayah', cost: 4, synergies: ['아이오니아', '건슬링어'] },
  '탈리야': { engId: 'taliyah', cost: 4, synergies: ['슈리마', '인보커'] },

  // ─── 5코스트 ───
  '아트록스': { engId: 'aatrox', cost: 5, synergies: ['다킨', '월드 엔더'] },
  '애니': { engId: 'annie', cost: 5, synergies: ['다크 차일드', '아르카니스트'] },
  '아우렐리온 솔': { engId: 'aurelionsol', cost: 5, synergies: ['타곤', '스타 포저'] },
  '아지르': { engId: 'azir', cost: 5, synergies: ['슈리마', '엠퍼러', '디스럽터'] },
  '피들스틱': { engId: 'fiddlesticks', cost: 5, synergies: ['하베스터'] },
  '갈리오': { engId: 'galio', cost: 5, synergies: ['데마시아', '히로익'] },
  '킨드레드': { engId: 'kindred', cost: 5, synergies: ['이터널', '뱅퀴셔'] },
  '루시안&세나': { engId: 'luciansenna', cost: 5, synergies: ['소울바운드', '건슬링어'] },
  '멜': { engId: 'mel', cost: 5, synergies: ['녹서스', '디스럽터'] },
  '오른': { engId: 'ornn', cost: 5, synergies: ['프렐요드', '블랙스미스'] },
  '샤이바나': { engId: 'shyvana', cost: 5, synergies: ['드래곤본'] },
  '탐 켄치': { engId: 'tahmkench', cost: 5, synergies: ['빌지워터', '글러튼', '브루저'] },
  '타릭': { engId: 'taric', cost: 5, synergies: ['타곤', '워든'] },
  '티모': { engId: 'teemo', cost: 5, synergies: ['요들', '롱샷'] },
  '볼리베어': { engId: 'volibear', cost: 5, synergies: ['프렐요드', '브루저'] },
  '질리언': { engId: 'zilean', cost: 5, synergies: ['크로노키퍼'] },
  '나서스': { engId: 'nasus', cost: 5, synergies: ['슈리마', '저거너트'] },

  // ─── 6코스트 ───
  '바론 나서스': { engId: 'baronnashor', cost: 6, synergies: ['공허', '리프트스커지'] },
  '브록': { engId: 'brock', cost: 6, synergies: ['더 보스'] },
  '르블랑': { engId: 'leblanc', cost: 6, synergies: ['녹서스', '뱅퀴셔'] },
  '레넥톤': { engId: 'renekton', cost: 6, synergies: ['슈리마', '어센던트'] },
  '세트': { engId: 'sett', cost: 6, synergies: ['아이오니아', '저거너트'] },
  '싱드': { engId: 'singed', cost: 6, synergies: ['자운', '저거너트'] },
  '티버': { engId: 'tibbers', cost: 6, synergies: ['아르카니스트'] },

  // ─── 7코스트 ───
  '칼리스타': { engId: 'kalista', cost: 7, synergies: ['섀도우 아일', '뱅퀴셔'] },
  '라이즈': { engId: 'ryze', cost: 7, synergies: ['룬 메이지'] },
  '사이라스': { engId: 'sylas', cost: 7, synergies: ['체인브레이커', '디펜더', '아르카니스트'] },
  '티헥스': { engId: 'thex', cost: 7, synergies: ['헥스메크', '건슬링어'] },
  '워윅': { engId: 'warwick', cost: 7, synergies: ['자운', '슬레이어'] },
  '자헨': { engId: 'zaahen', cost: 7, synergies: ['이모탈', '다킨'] },
  '제라스': { engId: 'xerath', cost: 7, synergies: ['슈리마', '어센던트'] },

  // ─── 추가 챔피언 (조합 참조용) ───
  '쓰레쉬': { engId: 'thresh', cost: 3, synergies: ['섀도우 아일', '워든'] },
  '지그스': { engId: 'ziggs', cost: 2, synergies: ['자운', '아르카니스트'] },
  '야스오': { engId: 'yasuo', cost: 3, synergies: ['아이오니아', '퀵스트라이커'] },
  '요네': { engId: 'yone', cost: 3, synergies: ['아이오니아', '슬레이어'] },
  '밀리오': { engId: 'milio', cost: 2, synergies: ['익스탈', '인보커'] },
  '키아나': { engId: 'qiyana', cost: 2, synergies: ['익스탈', '디스럽터'] },
  '요릭': { engId: 'yorick', cost: 3, synergies: ['섀도우 아일', '워든'] },
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
 * @returns {Array<{name: string, engId: string, cost: number, synergies: string[], iconUrl: string}>}
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
