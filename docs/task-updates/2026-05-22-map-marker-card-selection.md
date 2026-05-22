# Task Update - 2026-05-22

## 작업명

마커 클릭 시 해당 식당 카드 강조 및 상세 이동 연결

## 이번에 한 일

- `web/src/components/corkage/StoreExplorer.tsx`에 `selectedPlaceId` 상태를 추가해 map/list selection의 단일 소스로 묶었다.
- `web/src/components/corkage/StoreMap.tsx`에서 NAVER marker click을 `onSelectStore`로 연결했다.
- 지도 fallback/sidebar의 식당 목록을 선택 가능한 버튼으로 바꾸고, 선택된 식당의 상세 링크를 바로 노출했다.
- `web/src/components/corkage/StoreList.tsx`, `web/src/components/corkage/StoreCard.tsx`를 갱신해 선택된 식당 카드가 강조되고 화면 안으로 스크롤되도록 했다.
- marker click wiring과 card highlight + detail 연결을 검증하는 테스트를 추가했다.

## 최종 상태

- 지도 마커를 클릭하면 해당 식당이 selection state로 반영된다.
- 선택된 식당 카드는 강조 스타일로 표시된다.
- 선택된 식당은 지도 영역에서 바로 상세 페이지 링크로 이동할 수 있다.
- 지도 키가 없는 fallback 모드에서도 같은 selection/detail 흐름을 유지한다.

## 검증 결과

아래 명령 기준으로 확인했다.

1. `cd web && npm test -- --run src/components/corkage/StoreExplorer.test.tsx src/components/corkage/StoreMap.test.tsx`
2. `cd web && npm exec tsc -- --noEmit`
3. `cd web && npm exec eslint -- src/components/corkage/StoreExplorer.tsx src/components/corkage/StoreList.tsx src/components/corkage/StoreCard.tsx src/components/corkage/StoreMap.tsx src/components/corkage/StoreExplorer.test.tsx src/components/corkage/StoreMap.test.tsx src/lib/map/naver-maps-loader.ts`
4. `cd web && npm run build`

## 이번 작업에서 바뀐 파일

- `web/src/components/corkage/StoreExplorer.tsx`
- `web/src/components/corkage/StoreList.tsx`
- `web/src/components/corkage/StoreCard.tsx`
- `web/src/components/corkage/StoreMap.tsx`
- `web/src/components/corkage/StoreExplorer.test.tsx`
- `web/src/components/corkage/StoreMap.test.tsx`
- `web/src/lib/map/naver-maps-loader.ts`
- `web/src/app/globals.css`

## 지금 기준으로 남은 할 일

### 1. 실제 NAVER 지도에서 marker active 시각 상태 보강 여부 결정

- 이번 작업은 카드 강조와 상세 이동 연결을 우선 구현했다.
- marker icon 자체의 active 스타일 변경은 후속 polish로 분리 가능하다.
