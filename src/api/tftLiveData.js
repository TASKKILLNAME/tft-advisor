const { EventEmitter } = require('events');

class TFTLiveData extends EventEmitter {
  constructor(lcuClient) {
    super();
    this.lcu = lcuClient;
    this._pollingInterval = null;
    this._isPolling = false;
  }

  // ─── 소환사 정보 ─────────────────────────────

  async getCurrentSummoner() {
    try {
      return await this.lcu.request('GET', '/lol-summoner/v1/current-summoner');
    } catch (e) {
      return null;
    }
  }

  async getSummonerRank(puuid) {
    try {
      const ranked = await this.lcu.request('GET', `/lol-ranked/v1/ranked-stats/${puuid}`);
      if (ranked && ranked.queueMap) {
        // TFT 랭크 정보
        const tftRank = ranked.queueMap.RANKED_TFT;
        if (tftRank) {
          return {
            tier: tftRank.tier,
            division: tftRank.division,
            leaguePoints: tftRank.leaguePoints,
            wins: tftRank.wins,
            losses: tftRank.losses
          };
        }
      }
      return null;
    } catch (e) {
      return null;
    }
  }

  // ─── 매치 히스토리 ───────────────────────────

  async getMatchHistory(puuid, count = 20) {
    try {
      const history = await this.lcu.request(
        'GET',
        `/lol-match-history/v1/products/tft/${puuid}/matches?begin=0&count=${count}`
      );
      return history;
    } catch (e) {
      return null;
    }
  }

  // ─── 게임 세션 데이터 ────────────────────────

  async getGameSession() {
    try {
      return await this.lcu.request('GET', '/lol-gameflow/v1/session');
    } catch (e) {
      return null;
    }
  }

  // ─── 인게임 폴링 ────────────────────────────

  startPolling(intervalMs = 8000) {
    if (this._isPolling) return;
    this._isPolling = true;

    this._pollingInterval = setInterval(async () => {
      if (!this.lcu.isConnected()) return;

      try {
        const session = await this.getGameSession();
        if (session) {
          this.emit('session-update', session);
        }
      } catch (e) {
        // 폴링 에러 무시
      }
    }, intervalMs);
  }

  stopPolling() {
    this._isPolling = false;
    if (this._pollingInterval) {
      clearInterval(this._pollingInterval);
      this._pollingInterval = null;
    }
  }

  destroy() {
    this.stopPolling();
    this.removeAllListeners();
  }
}

module.exports = TFTLiveData;
