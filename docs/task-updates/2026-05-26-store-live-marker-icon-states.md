# Task Update - 2026-05-26

## 작업명

`/store` live NAVER marker active / nearest visual state 추가

## 이번에 한 일

- `web/src/components/corkage/StoreMap.tsx`에 live NAVER marker instance ref를 추가해 선택 상태와 가장 가까운 상태를 marker icon과 z-index에 직접 반영하도록 연결했다.
- selected / nearest 변경 때 지도 전체를 다시 mount하지 않도록 callback ref와 marker sync effect로 map init 경로를 분리했다.
- selected, nearest, selected+nearest 조합을 구분하는 HTML marker icon 생성 로직을 `StoreMap` 내부에 추가했다.
- `web/src/components/corkage/StoreMap.test.tsx`에 live marker constructor icon 상태와 rerender 후 icon/z-index 갱신, map non-remount 회귀 테스트를 추가했다.
- fresh worktree에 `vitest`가 없어 `cd web && npm ci`로 로컬 toolchain을 복구한 뒤 전체 검증을 다시 돌렸다.

## 최종 상태

- `/store`의 live NAVER map marker가 이제 sidebar / card selection과 같은 selected / nearest 상태를 시각적으로 반영한다.
- selected 변경 시 marker icon만 갱신되고 지도 전체가 다시 mount되지 않는다.
- 기존 URL-state, geolocation, bounds, list/card sync 흐름은 그대로 유지된다.

## 검증 결과

아래 명령 기준으로 확인했다.

1. `cd web && ./node_modules/.bin/vitest run src/components/corkage/StoreMap.test.tsx` → PASS (`1 file`, `7 tests`)
2. `cd web && ./node_modules/.bin/tsc --noEmit` → PASS
3. `cd web && ./node_modules/.bin/eslint src/components/corkage/StoreMap.tsx src/components/corkage/StoreMap.test.tsx` → PASS
4. `cd web && npm test` → PASS (`8 files`, `39 tests`)
5. `cd web && npm run lint` → PASS
6. `cd web && npm run build` → PASS

## 이번 작업에서 바뀐 파일

- `docs/task-updates/2026-05-26-store-live-marker-icon-states.md`
- `web/src/components/corkage/StoreMap.tsx`
- `web/src/components/corkage/StoreMap.test.tsx`

## 지금 기준으로 남은 할 일

- 이번 task 범위 안에서는 남은 필수 작업 없음.
- 실제 모바일 NAVER map 렌더링에서 marker 체감 polish를 더 다듬는 일은 후속 시각 QA로 분리하는 편이 안전하다.
