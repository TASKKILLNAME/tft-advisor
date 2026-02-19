#!/bin/bash
echo "=== TFT Advisor 설정 ==="
echo ""
echo "1. Riot Developer Portal에서 API 키를 발급받으세요:"
echo "   https://developer.riotgames.com"
echo ""
echo "2. .env 파일을 편집하세요:"
echo "   RIOT_API_KEY=RGAPI-여기에-키-입력"
echo "   SUMMONER_NAME=소환사명"
echo "   TAGLINE=KR1"
echo ""
read -p "API 키를 입력하세요: " API_KEY
read -p "소환사명을 입력하세요: " SUMMONER
read -p "태그라인 (기본값: KR1): " TAG
TAG=${TAG:-KR1}

cat > .env << EOF
RIOT_API_KEY=$API_KEY
REGION=kr
PLATFORM=asia
SUMMONER_NAME=$SUMMONER
TAGLINE=$TAG
EOF

echo ""
echo "✅ 설정 완료! 'npm start'로 실행하세요."
