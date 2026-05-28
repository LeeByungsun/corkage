# Task Update - 2026-05-28

## 작업명

`/store` 지도 깜빡임 원인 수정

## 결론

- `/store` 지도 깜빡임은 map bounds 변경이 부모 `StoreExplorer`를 다시 렌더링할 때, 지도에 넘기는 `stores` 배열 참조가 매번 새로 만들어지면서 live `StoreMap`이 불필요하게 remount될 수 있는 구조에서 발생했다.
- `filterStoreList`와 district 목록 계산을 memoized path로 옮겨, bounds-filtered list 상태만 바뀔 때는 `StoreMap` 입력이 유지되게 했다.
- 지도 remount 없이 리스트만 bounds 기준으로 좁혀지도록 회귀 테스트를 추가했다.

## 이번에 한 일

- `StoreExplorer`에서 `districts`와 `baseFilteredStores`를 `useMemo`로 안정화했다.
- `effectiveMaxFee`를 별도 primitive로 분리해 filter memo dependency를 명확히 했다.
- `StoreExplorer.test.tsx`의 `StoreMap` mock이 전달받은 `stores` 참조를 기록하게 했다.
- bounds 변경 후 리스트는 줄어들어도 `StoreMap`으로 내려가는 `stores` 참조는 그대로 유지되는 회귀 테스트를 추가했다.

## Verification

- `cd web && npm test -- --run src/components/corkage/StoreExplorer.test.tsx src/components/corkage/StoreMap.test.tsx` → PASS
  - 2 files / 13 tests passed.
- `cd web && npm run qa:store-live-markers` → PASS
  - `http://localhost:3005/store` 기준 desktop/mobile Chromium 2 tests passed.
- custom Playwright flicker probe → PASS
  - `http://localhost:3017/store`에서 marker count 20 samples가 모두 `4`로 유지됨.
- `cd web && npm run typecheck` → PASS
- `cd web && npm run lint` → PASS
- `cd web && npm test` → PASS
  - 8 files / 40 tests passed.
- `cd web && npm run build` → PASS

## 바뀐 파일

- `web/src/components/corkage/StoreExplorer.tsx`
- `web/src/components/corkage/StoreExplorer.test.tsx`
- `docs/task-updates/2026-05-28-store-map-flicker-fix.md`

## 남은 리스크

- 실제 눈으로 보는 장시간 수동 QA는 아직 별도로 남아 있다.
- NAVER SDK 자체가 외부 auth/runtime 상태에 따라 일시적인 타일 redraw를 할 수 있으나, 이번 앱 상태 루프에서 marker DOM이 0으로 떨어지는 현상은 재현 probe에서 사라졌다.
