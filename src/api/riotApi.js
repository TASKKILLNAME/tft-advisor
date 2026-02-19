const axios = require('axios');

class RiotAPI {
  constructor(apiKey, region = 'kr', platform = 'asia') {
    this.apiKey = apiKey;
    this.region = region;
    this.platform = platform;

    // 리전별 베이스 URL
    this.regionalBase = `https://${region}.api.riotgames.com`;
    this.platformBase = `https://${platform}.api.riotgames.com`;

    this.client = axios.create({
      timeout: 10000,
      headers: { 'X-Riot-Token': this.apiKey }
    });
  }

  updateApiKey(newKey) {
    this.apiKey = newKey;
    this.client.defaults.headers['X-Riot-Token'] = newKey;
  }

  async getAccountByRiotId(gameName, tagLine) {
    const res = await this.client.get(
      `${this.platformBase}/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`
    );
    return res.data;
  }

  async getSummonerByPuuid(puuid) {
    const res = await this.client.get(
      `${this.regionalBase}/tft/summoner/v1/summoners/by-puuid/${puuid}`
    );
    return res.data;
  }

  async getActiveGame(puuid) {
    try {
      const res = await this.client.get(
        `${this.regionalBase}/lol/spectator/tft/v5/active-games/by-summoner/${puuid}`
      );
      return res.data;
    } catch (e) {
      if (e.response?.status === 404) return null;
      throw e;
    }
  }

  async getMatchHistory(puuid, count = 20) {
    const res = await this.client.get(
      `${this.platformBase}/tft/match/v1/matches/by-puuid/${puuid}/ids?count=${count}`
    );
    return res.data;
  }

  async getMatchDetail(matchId) {
    const res = await this.client.get(
      `${this.platformBase}/tft/match/v1/matches/${matchId}`
    );
    return res.data;
  }

  async getTFTLeague(summonerId) {
    const res = await this.client.get(
      `${this.regionalBase}/tft/league/v1/entries/by-summoner/${summonerId}`
    );
    return res.data;
  }

  // Community Dragon에서 최신 TFT 데이터 가져오기 (API 키 불필요)
  async getTFTSetData() {
    const res = await axios.get(
      'https://raw.communitydragon.org/latest/cdragon/tft/ko_kr.json',
      { timeout: 15000 }
    );
    return res.data;
  }

  async getDataDragonVersion() {
    const res = await axios.get('https://ddragon.leagueoflegends.com/api/versions.json');
    return res.data[0];
  }
}

module.exports = RiotAPI;
