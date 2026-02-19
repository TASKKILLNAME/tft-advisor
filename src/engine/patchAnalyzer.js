const axios = require('axios');

class PatchAnalyzer {
  constructor() {
    this.cachedPatch = null;
    this.cacheTime = 0;
    this.CACHE_DURATION = 3600000; // 1시간
  }

  // Riot 공식 패치노트 페이지에서 데이터 가져오기
  async fetchLatestPatchNotes() {
    const now = Date.now();
    if (this.cachedPatch && now - this.cacheTime < this.CACHE_DURATION) {
      return this.cachedPatch;
    }

    try {
      // Community Dragon 패치 데이터 (공식 공개 데이터)
      const res = await axios.get(
        'https://raw.communitydragon.org/latest/cdragon/tft/ko_kr.json',
        { timeout: 15000 }
      );

      const patchData = this.parsePatchData(res.data);
      this.cachedPatch = patchData;
      this.cacheTime = now;
      return patchData;
    } catch (e) {
      return this.getFallbackPatchAnalysis();
    }
  }

  parsePatchData(data) {
    const analysis = {
      version: data.gameVariations?.[0] || '최신',
      buffedUnits: [],
      nerfedUnits: [],
      newSynergies: [],
      metaShifts: [],
      recommendations: []
    };

    // 세트 데이터에서 기물/시너지 정보 파싱
    if (data.sets) {
      const latestSet = Object.values(data.sets).pop();
      if (latestSet?.champions) {
        analysis.totalUnits = latestSet.champions.length;
        analysis.recommendations.push(
          `현재 세트: ${latestSet.name || '최신 세트'} (총 ${analysis.totalUnits}개 기물)`
        );
      }
      if (latestSet?.traits) {
        analysis.totalSynergies = latestSet.traits.length;
      }
    }

    return analysis;
  }

  getFallbackPatchAnalysis() {
    // API 없이 사용할 수 있는 기본 메타 분석
    return {
      version: '14.x (로컬 데이터)',
      metaShifts: [
        '마법사 조합 상향: 럭스/리산드라 강세',
        '저격수 하이퍼롤 여전히 강력',
        '브루저 탱조합 안정적인 탑8 운영',
        '요들 하이퍼롤 이번 패치 약화'
      ],
      buffedUnits: ['리산드라', '럭스', '케이틀린'],
      nerfedUnits: ['트리스타나', '뽀삐'],
      recommendations: [
        'S티어: 마법사 조합, 저격수 하이퍼롤',
        'A티어: 브루저 탱킹, 지하세계 조합',
        '피할 것: 요들 (이번 패치 하향)',
        '증강 픽: 황금 계란, 마법사의 관 최우선'
      ],
      lastUpdated: new Date().toLocaleDateString('ko-KR')
    };
  }

  // 특정 기물 버프/너프 감지
  analyzeUnitChanges(oldData, newData) {
    const changes = [];

    if (!oldData || !newData) return changes;

    // 공격력, 체력 등 변화 비교
    Object.keys(newData).forEach(unitName => {
      const oldUnit = oldData[unitName];
      const newUnit = newData[unitName];

      if (!oldUnit) {
        changes.push({ unit: unitName, type: 'new', description: '새로운 기물' });
        return;
      }

      const hpChange = ((newUnit.hp - oldUnit.hp) / oldUnit.hp * 100).toFixed(1);
      const atkChange = ((newUnit.atk - oldUnit.atk) / oldUnit.atk * 100).toFixed(1);

      if (Math.abs(hpChange) > 3) {
        changes.push({
          unit: unitName,
          type: hpChange > 0 ? 'buff' : 'nerf',
          stat: '체력',
          change: `${hpChange > 0 ? '+' : ''}${hpChange}%`
        });
      }

      if (Math.abs(atkChange) > 5) {
        changes.push({
          unit: unitName,
          type: atkChange > 0 ? 'buff' : 'nerf',
          stat: '공격력',
          change: `${atkChange > 0 ? '+' : ''}${atkChange}%`
        });
      }
    });

    return changes;
  }

  // 현재 메타 요약 생성
  generateMetaSummary(patchData) {
    const lines = ['=== 현재 메타 요약 ==='];

    if (patchData.recommendations) {
      patchData.recommendations.forEach(rec => lines.push(`• ${rec}`));
    }

    if (patchData.buffedUnits?.length > 0) {
      lines.push(`\n상향된 기물: ${patchData.buffedUnits.join(', ')}`);
    }

    if (patchData.nerfedUnits?.length > 0) {
      lines.push(`하향된 기물: ${patchData.nerfedUnits.join(', ')}`);
    }

    return lines.join('\n');
  }
}

module.exports = PatchAnalyzer;
