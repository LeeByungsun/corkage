# Task Update - 2026-05-26

## 작업명

`/store` 지도 사이드바와 fallback 목록에 가장 가까운 식당 강조 추가

## 이번에 한 일

- `web/src/components/corkage/StoreExplorer.tsx`에서 계산 중이던 `nearestStorePlaceId`를 `StoreMap`에도 넘기도록 연결했다.
- `web/src/components/corkage/StoreMap.tsx`에서 지도 sidebar / no-key fallback 목록에 nearest 상태를 함께 표시하도록 `nearestPlaceId` 흐름을 추가했다.
- 선택된 식당 요약 카드가 가장 가까운 식당일 때 `가장 가까움` 배지를 같이 보여주도록 보강했다.
- 지도 목록 item에 `map-point-item--nearest` 강조 클래스를 추가해 selected 상태와 nearest 상태가 동시에 보여도 시각적으로 구분되도록 다듬었다.
- `web/src/components/corkage/StoreMap.test.tsx`에 fallback/live sidebar의 nearest 표시 회귀 테스트를 추가했다.
- `web/src/components/corkage/StoreExplorer.test.tsx`에 nearest 식당 id가 `StoreMap`으로 전달되는지 확인하는 연결 테스트를 추가했다.
- 이전 팀 머지 과정에서 남아 있던 `StoreMap.tsx`의 중복 `selectedStore` 선언도 함께 정리했다.

## 최종 상태

- 카드뿐 아니라 지도 sidebar / fallback 목록에서도 가장 가까운 식당이 별도 강조된다.
- 선택된 식당이 동시에 가장 가까운 식당이면 summary 카드와 목록 양쪽에서 그 상태가 유지된다.
- 기존 selection sync, URL query sync, geolocation, NAVER map loader 흐름은 그대로 유지된다.

## 검증 결과

아래 명령 기준으로 확인했다.

1. `cd web && npm run build` → PASS
2. `cd web && npm run typecheck` → PASS
3. `cd web && npm run lint` → PASS
4. `cd web && npm run test` → PASS (`8 files`, `38 tests`)

추가 확인:

- `cd web && npm run test -- src/components/corkage/StoreMap.test.tsx src/components/corkage/StoreExplorer.test.tsx` → PASS (`2 files`, `11 tests`)

## 이번 작업에서 바뀐 파일

- `docs/task-updates/2026-05-26-map-sidebar-nearest-highlight.md`
- `web/src/app/globals.css`
- `web/src/components/corkage/StoreExplorer.tsx`
- `web/src/components/corkage/StoreExplorer.test.tsx`
- `web/src/components/corkage/StoreMap.tsx`
- `web/src/components/corkage/StoreMap.test.tsx`

## 지금 기준으로 남은 할 일

- 실제 NAVER 지도 marker icon 자체의 active / nearest 시각 상태 변경은 아직 하지 않았다.
- 실제 모바일 브라우저에서 sidebar 강조 체감 QA는 후속 검증으로 남는다.
