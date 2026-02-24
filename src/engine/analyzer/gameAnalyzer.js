const { META_COMPS, AUGMENT_TIERS, AUGMENT_DATA, UNIT_COSTS, POSITIONING_GUIDE, ECONOMY_GUIDE, TFT_META, TFT_SET16_CHAMPIONS, getChampionsByComp } = require('../tftData');

class GameAnalyzer {
  constructor(riotApi) {
    this.riotApi = riotApi;
    this.setData = null;
  }

  async loadSetData() {
    if (!this.setData && this.riotApi) {
      try {
        this.setData = await this.riotApi.getTFTSetData();
      } catch (e) {
        console.warn('세트 데이터 로드 실패, 로컬 데이터 사용');
      }
    }
  }

  // LCU 모드: API 데이터 없이 메타 기반 분석 제공
  getMetaBasedAnalysis() {
    const topComps = META_COMPS.filter(c => c.tier === 'S' || c.tier === 'A');
    const recommended = topComps[0];
    const alternatives = topComps.slice(1, 3);

    // 추천 조합의 아이템 정보 포함
    let itemInfo = '';
    if (recommended.keyItems) {
      const carry = recommended.keyItems.carry;
      if (carry) {
        itemInfo = `${carry.unit} 아이템: ${carry.items.join(', ')}`;
      }
    }

    return {
      timestamp: Date.now(),
      stage: '-',
      summary: {
        stage: '-',
        myHealth: '-',
        avgHealth: '-',
        playersAlive: '-',
        myRank: '-'
      },
      augmentAdvice: {
        current: [],
        advice: 'S티어 증강을 우선 선택하세요.',
        nextAugmentTip: '현재 조합과 시너지 있는 증강 선택'
      },
      compRecommendation: {
        recommended,
        alternatives,
        reasoning: itemInfo
          ? `패치 ${TFT_META.version} 메타 추천. ${itemInfo}`
          : `패치 ${TFT_META.version} 메타 기반 추천입니다.`,
        // v2 데이터
        compAugments: recommended.compAugments || null,
        detailedItems: recommended.detailedItems || null,
        positionBoard: recommended.positionBoard || null,
      },
      economyAdvice: this.getEconomyAdvice({}, '2-1'),
      positioningTip: this.getPositioningTip({ traits: [] }),
      buyPriority: this.getBuyPriority({ traits: [] }, '2-1'),
      itemSuggestion: this._getDetailedItemSuggestion(recommended)
    };
  }

  // 현재 활성 게임 분석
  async analyzeActiveGame(gameData, myPuuid) {
    await this.loadSetData();

    const myParticipant = gameData.participants?.find(p => p.puuid === myPuuid);

    if (!myParticipant) {
      return { error: '참가자 데이터를 찾을 수 없습니다' };
    }

    const stage = this.parseStage(gameData);
    const compRec = this.recommendComp(myParticipant, stage);

    return {
      timestamp: Date.now(),
      stage,
      summary: this.buildSummary(gameData, myParticipant, stage),
      augmentAdvice: this.analyzeAugments(myParticipant.augments || []),
      compRecommendation: compRec,
      economyAdvice: this.getEconomyAdvice(myParticipant, stage),
      positioningTip: this.getPositioningTip(myParticipant),
      buyPriority: this.getBuyPriority(myParticipant, stage),
      itemSuggestion: this._getDetailedItemSuggestion(compRec.recommended)
    };
  }

  parseStage(gameData) {
    const gameLength = gameData.gameLength || 0;
    if (gameLength < 120) return '1-1';
    if (gameLength < 240) return '2-1';
    if (gameLength < 420) return '3-1';
    if (gameLength < 660) return '4-1';
    if (gameLength < 900) return '5-1';
    return '6-1+';
  }

  buildSummary(gameData, myParticipant, stage) {
    const participants = gameData.participants || [];
    const myHealth = myParticipant.health || 100;
    const avgHealth = participants.reduce((acc, p) => acc + (p.health || 0), 0) / participants.length;

    return {
      stage,
      myHealth,
      avgHealth: Math.round(avgHealth),
      playersAlive: participants.filter(p => (p.health || 0) > 0).length,
      myRank: participants
        .filter(p => (p.health || 0) > 0)
        .sort((a, b) => (b.health || 0) - (a.health || 0))
        .findIndex(p => p.puuid === myParticipant.puuid) + 1
    };
  }

  analyzeAugments(augments) {
    if (!augments || augments.length === 0) {
      return {
        current: [],
        advice: '아직 증강이 없습니다. 첫 증강 선택 시 S티어 우선!'
      };
    }

    const tierMap = {};
    Object.entries(AUGMENT_TIERS).forEach(([tier, names]) => {
      names.forEach(name => { tierMap[name] = tier; });
    });

    const analyzedAugments = augments.map(aug => ({
      name: aug,
      tier: tierMap[aug] || '?',
      synergy: this.getAugmentSynergy(aug)
    }));

    const hasSAug = analyzedAugments.some(a => a.tier === 'S');

    return {
      current: analyzedAugments,
      advice: hasSAug
        ? `S티어 증강 보유! 해당 증강 시너지 조합을 우선 구성하세요.`
        : `현재 증강에 맞는 조합을 선택하거나, 다음 증강에서 S티어를 노리세요.`,
      nextAugmentTip: '다음 증강 시 현재 조합과 시너지 있는 것 선택'
    };
  }

  getAugmentSynergy(augName) {
    if (AUGMENT_DATA && AUGMENT_DATA[augName]) {
      return AUGMENT_DATA[augName].desc;
    }
    return '범용';
  }

  recommendComp(participant, stage) {
    const currentTraits = participant.traits || [];

    const activeTraits = currentTraits
      .filter(t => t.tier_current > 0)
      .map(t => t.name);

    const scored = META_COMPS.map(comp => {
      let score = 0;

      const overlap = activeTraits.filter(t =>
        comp.synergies.some(s => s.includes(t))
      ).length;

      score += overlap * 30;

      // 티어 점수
      const tierScore = { S: 100, A: 70, B: 40, C: 10 };
      score += tierScore[comp.tier] || 0;

      return { ...comp, matchScore: score, traitOverlap: overlap };
    });

    scored.sort((a, b) => b.matchScore - a.matchScore);

    const top3 = scored.slice(0, 3);

    return {
      recommended: top3[0],
      alternatives: top3.slice(1),
      reasoning: this.buildCompReasoning(top3[0], activeTraits, stage),
      // v2 데이터
      compAugments: top3[0]?.compAugments || null,
      detailedItems: top3[0]?.detailedItems || null,
      positionBoard: top3[0]?.positionBoard || null,
    };
  }

  buildCompReasoning(comp, activeTraits, stage) {
    if (!comp) return '조합을 결정하기 어렵습니다.';

    const reasons = [];

    if (comp.matchScore > 80) {
      reasons.push(`현재 유닛이 ${comp.name}과 잘 맞습니다 (${comp.traitOverlap}개 시너지 겹침)`);
    }

    if (comp.tier === 'S') {
      reasons.push('현재 패치 S티어 조합입니다');
    }

    const stageNum = parseFloat(stage.replace('-', '.'));
    if (stageNum >= 3 && comp.economy.includes('하이퍼롤')) {
      reasons.push(`주의: ${stage} 단계에서 하이퍼롤은 늦을 수 있습니다`);
    }

    return reasons.join(' | ') || `${comp.name} 조합으로 방향을 잡으세요`;
  }

  getEconomyAdvice(participant, stage) {
    const stageNum = parseFloat(stage.replace('-', '.'));

    const advice = [];

    if (stageNum <= 2.5) {
      advice.push('초반: 50골드 이자 유지가 최우선');
      advice.push('연승/연패 가능하면 최대한 유지');
    } else if (stageNum <= 3.5) {
      advice.push('중반: 조합 방향에 따라 운영 결정');
      advice.push('하이퍼롤: 지금 롤다운 시작');
      advice.push('빠른 레벨업: 골드 저장 후 레벨 7 강행');
    } else if (stageNum <= 4.5) {
      advice.push('후반: 레벨 8 목표 (4코스트 탐색)');
      advice.push('체력 30 이하면 레벨업/롤보다 생존 우선');
    } else {
      advice.push('후반: 레벨 9 여부 결정 (5코스트 목표)');
      advice.push('체력 관리가 최우선');
    }

    return {
      stage,
      advice,
      interestGuide: this.getInterestGuide()
    };
  }

  getInterestGuide() {
    return [
      { gold: 10, interest: 1 },
      { gold: 20, interest: 2 },
      { gold: 30, interest: 3 },
      { gold: 40, interest: 4 },
      { gold: 50, interest: 5, note: '최대 이자 (50골드 유지!)' }
    ];
  }

  getBuyPriority(participant, stage) {
    const currentTraits = participant.traits || [];
    const stageNum = parseFloat(stage.replace('-', '.'));

    const advice = [];

    if (stageNum <= 2.5) {
      advice.push({ priority: 1, text: '1~2코스트 핵심 기물 3성 목표' });
      advice.push({ priority: 2, text: '시너지 완성에 필요한 기물 구매' });
    } else if (stageNum <= 3.5) {
      advice.push({ priority: 1, text: '조합 확정 후 필요 기물만 구매' });
      advice.push({ priority: 2, text: '3코스트 메인 캐리 탐색' });
    } else {
      advice.push({ priority: 1, text: '4코스트 캐리 확보' });
      advice.push({ priority: 2, text: '전선 기물 보충 (탱커)' });
      advice.push({ priority: 3, text: '중복 기물 파괴 → 아이템 재활용' });
    }

    const activeTraits = currentTraits
      .filter(t => t.tier_current > 0)
      .map(t => t.name);

    if (activeTraits.length > 0) {
      advice.push({
        priority: 1,
        text: `현재 시너지 (${activeTraits.slice(0, 3).join(', ')}) 완성에 필요한 기물 탐색`
      });
    }

    return advice;
  }

  // v2: detailedItems 데이터 활용 아이템 추천
  _getDetailedItemSuggestion(comp) {
    if (!comp) return [];

    // detailedItems가 있으면 우선 사용
    if (comp.detailedItems && comp.detailedItems.length > 0) {
      return comp.detailedItems.map(di => ({
        unit: di.unit,
        items: di.primary || [],
        alternative: di.alternative || [],
        mutant: di.mutant || [],
      }));
    }

    // fallback: keyItems에서 추출
    const suggestions = [];
    if (comp.keyItems) {
      if (comp.keyItems.carry) {
        suggestions.push({
          unit: comp.keyItems.carry.unit,
          items: comp.keyItems.carry.items || [],
          alternative: [],
          mutant: [],
        });
      }
      if (comp.keyItems.tank) {
        suggestions.push({
          unit: comp.keyItems.tank.unit,
          items: comp.keyItems.tank.items || [],
          alternative: [],
          mutant: [],
        });
      }
    }

    return suggestions;
  }

  getItemSuggestion(participant, stage) {
    const currentTraits = participant.traits || [];
    const activeTraits = currentTraits.filter(t => t.tier_current > 0).map(t => t.name);
    const stageNum = parseFloat((stage || '2-1').replace('-', '.'));

    const suggestions = [];

    if (activeTraits.includes('마법사')) {
      suggestions.push({ item: '라바돈의 죽음모자', reason: '마법사 AP 극대화' });
      suggestions.push({ item: '모렐로노미콘', reason: '마법사 화상 + AP' });
    }
    if (activeTraits.includes('저격수')) {
      suggestions.push({ item: '무한의 검', reason: '저격수 치명타 극대화' });
      suggestions.push({ item: '최후의 속삭임', reason: '방어구 관통' });
    }
    if (activeTraits.includes('브루저') || activeTraits.includes('전사')) {
      suggestions.push({ item: '선혈갑옷', reason: '탱커 지속력' });
      suggestions.push({ item: '가고일의 돌갑옷', reason: '탱커 방어력 극대화' });
    }

    if (stageNum <= 2.5) {
      suggestions.push({ item: '스파타의 검 / BF 검', reason: '초반 임시 아이템 보유' });
    } else {
      suggestions.push({ item: '스태틱의 단검', reason: '캐리 공속 보조' });
    }

    return suggestions.slice(0, 3);
  }

  getPositioningTip(participant) {
    const currentTraits = participant.traits || [];
    const activeTraits = currentTraits.filter(t => t.tier_current > 0).map(t => t.name);

    let posType = 'backline';

    if (activeTraits.some(t => ['브루저', '전사', '수호자'].includes(t))) {
      posType = 'frontline_heavy';
    } else if (activeTraits.some(t => ['저격수', '마법사'].includes(t))) {
      posType = 'corner_backline';
    } else if (activeTraits.some(t => ['요들'].includes(t))) {
      posType = 'spread';
    }

    const guide = POSITIONING_GUIDE[posType];

    return {
      type: posType,
      ...guide,
      generalTips: [
        '어쌔신 상대: 캐리를 반대편 코너로 이동',
        '광역기 상대: 기물 간격 벌리기',
        '초반 아이템 탱커: 3번 또는 7번 헥스'
      ]
    };
  }
}

module.exports = GameAnalyzer;
