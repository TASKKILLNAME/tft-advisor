# ⚔ TFT Advisor

TFT(TeamFight Tactics) 실시간 보조 프로그램 — **Vanguard 안전**

> Riot 공식 API + 화면 캡처만 사용. 메모리 읽기/게임 조작 없음.

---

## 다운로드

👉 [최신 버전 다운로드 (Releases)](../../releases/latest)

`TFT-Advisor-Setup-x.x.x.exe` 클릭 후 설치

---

## 기능

| 탭 | 기능 |
|----|------|
| **조합** | 현재 시너지 기반 S/A/B 티어 조합 추천, 구매 우선순위 |
| **경제** | 이자 가이드, 스테이지별 운영 조언, 하이퍼롤/슬로우롤/빠른레벨 가이드 |
| **배치** | 조합 유형별 헥스 보드 시각화, 어쌔신 대응 팁 |
| **증강** | 현재 증강 티어 표시, S/A/B 티어 증강 목록 |
| **메타** | 최신 패치 메타 분석, API 키 갱신 설정 |

---

## 설치 및 사용법

### 1단계 — Riot API 키 발급 (무료)

1. [developer.riotgames.com](https://developer.riotgames.com) 접속
2. Riot 계정으로 로그인
3. **Development API Key** 복사 (24시간마다 갱신 필요)

### 2단계 — 프로그램 설치

1. [Releases](../../releases/latest)에서 `TFT-Advisor-Setup-x.x.x.exe` 다운로드
2. 설치 후 실행

### 3단계 — 초기 설정

앱 실행 후 **메타 탭 → 설정** 에서:

```
API 키: RGAPI-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
소환사명: 본인 닉네임
태그라인: KR1
```

`저장 및 적용` 클릭 → TFT 게임 시작하면 자동으로 분석 시작!

### API 키 갱신 방법 (매 24시간)

앱 실행 중에도 **메타 탭 → 설정**에서 새 키 붙여넣기 후 저장 → 재시작 불필요

---

## Vanguard 안전 여부

| 방식 | 사용 여부 |
|------|---------|
| 게임 메모리 읽기 | ❌ 절대 없음 |
| 키보드/마우스 자동 조작 | ❌ 절대 없음 |
| Riot 공식 API | ✅ 사용 (허가된 방식) |
| 화면 캡처 (OS 레벨) | ✅ 사용 (OBS와 동일 방식) |

Riot의 [Third Party Application Policy](https://www.riotgames.com/en/legal) 기준 **정보 제공형 오버레이**로 허용 범위 내.

---

## 개발 환경 설정 (직접 빌드하려면)

```bash
git clone https://github.com/OWNER/tft-advisor
cd tft-advisor
npm install
cp .env.example .env
# .env 파일 편집 후
npm start
```

---

## 라이선스

MIT
