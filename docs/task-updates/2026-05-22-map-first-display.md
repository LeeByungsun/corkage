# Task Update - 2026-05-22

## 작업명

식당 리스트 상단에 NAVER 지도 표시를 먼저 붙임

## 이번에 한 일

- `web/src/components/corkage/StoreMap.tsx`를 추가해 `/store` 화면 상단에 식당 좌표 마커 지도를 붙였다.
- `web/src/lib/map/naver-maps-loader.ts`를 추가해 NAVER Maps JavaScript API v3 스크립트를 `ncpKeyId` 방식으로 로드하도록 만들었다.
- `web/src/lib/map/store-map.ts`를 추가해 지도용 포인트 변환과 중심 좌표 계산을 분리했다.
- `web/src/components/corkage/StoreExplorer.tsx`에서 필터 결과를 지도와 리스트에 함께 연결했다.
- `NEXT_PUBLIC_NAVER_MAPS_CLIENT_ID`가 없을 때는 서버/테스트 환경에서도 깨지지 않도록 좌표 fallback UI를 만들었다.
- 홈/리스트 문구를 지도 우선 흐름에 맞게 업데이트했다.
- 지도 helper와 지도 UI 계약 테스트를 추가했다.

## 최종 상태

- `/store`에서 현재 필터 결과 식당을 지도에 먼저 볼 수 있다.
- NAVER Maps 키가 있으면 동적 지도와 마커가 표시된다.
- 키가 없으면 좌표 목록과 env 가이드가 fallback으로 표시된다.

## 검증 결과

아래 명령 기준으로 확인했다.

1. `cd web && npm run build`
2. `cd web && npm run typecheck`
3. `cd web && npm run lint`
4. `cd web && npm run test`

## 이번 작업에서 바뀐 파일

- `web/src/components/corkage/StoreMap.tsx`
- `web/src/components/corkage/StoreMap.test.tsx`
- `web/src/components/corkage/StoreExplorer.tsx`
- `web/src/lib/map/naver-maps-loader.ts`
- `web/src/lib/map/store-map.ts`
- `web/src/lib/map/store-map.test.ts`
- `web/src/app/page.tsx`
- `web/src/app/store/page.tsx`
- `web/src/app/layout.tsx`
- `web/src/app/globals.css`

## 지금 기준으로 남은 할 일

### 1. 실제 키 연결

- 동적 지도 표시는 `NEXT_PUBLIC_NAVER_MAPS_CLIENT_ID` 설정이 있어야 한다.

### 2. 마커 상호작용 고도화

- 현재는 기본 마커 표시 중심이다.
- info window, 클릭 시 상세 이동, marker style 구분은 다음 단계다.

### 3. 지도/필터 동기화 고도화

- 현재는 필터 결과를 지도에 반영하는 1차 버전이다.
- bounds 변화와 선택 상태 동기화는 다음 단계다.
