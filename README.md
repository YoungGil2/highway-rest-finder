# 고속도로 휴게소 찾기

카카오맵 API를 활용해 출발지부터 도착지까지의 경로 위에 있는 고속도로 휴게소를 탐색하는 웹 서비스입니다.

## 주요 기능

- **경로 검색**: 출발지/도착지 주소 입력 시 추천 경로, 최단 시간, 최단 거리 3가지 경로 제공
- **경로 선택**: 원하는 경로 선택 시 지도에 해당 경로 강조 표시
- **휴게소 탐색**: 선택한 경로 위 5km 이내 고속도로 휴게소 자동 탐색
- **휴게소 정보**: 각 휴게소의 주소, 전화번호, 주차 대수, 방향(상행/하행) 표시
- **상세 정보 링크**: 네이버 지도 연동으로 휴게소 음식 리뷰 및 메뉴 확인 가능

## 기술 스택

- **Frontend**: Next.js 16 (App Router), TypeScript, Tailwind CSS
- **지도**: 카카오맵 JavaScript SDK
- **경로**: 카카오 모빌리티 Directions API
- **휴게소 데이터**: 한국도로공사 공공데이터 API

## 사용 API

- [카카오맵 JavaScript SDK](https://apis.map.kakao.com) — 지도 렌더링 및 경로 표시
- [카카오 모빌리티 Directions API](https://developers.kakaomobility.com) — 자동차 경로 탐색
- [한국도로공사 공공데이터 API](https://data.ex.co.kr) — 고속도로 휴게소 위치 및 시설 정보
