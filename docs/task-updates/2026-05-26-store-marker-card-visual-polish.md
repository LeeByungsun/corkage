# Task Update - 2026-05-26

## 작업명

`/store` marker-card visual polish 마무리

## 이번에 한 일

- `web/src/components/corkage/StoreCard.tsx`에서 selected 상태와 nearest 상태를 동시에 표현하도록 카드 class 조합을 정리했다.
- 선택된 카드에 `선택됨` 배지를 추가해 selected 강조가 border/shadow 외에도 텍스트 신호로 보이도록 보강했다.
- `web/src/components/corkage/StoreMap.tsx`에 선택된 식당 요약 카드(`선택한 식당`)를 추가해 sidebar와 no-key fallback 모두에서 현재 선택 상태를 더 분명하게 보여주도록 했다.
- fallback / marker list에 `선택됨` 상태 배지와 selected item 강조를 추가해 marker-card sync가 시각적으로 더 분명해지도록 다듬었다.
- `web/src/app/globals.css`에 selected / nearest / map fallback 관련 시각 polish 스타일을 추가했다.
- `web/src/components/corkage/StoreCard.test.tsx`, `web/src/components/corkage/StoreMap.test.tsx`에 selected + nearest / fallback preselected 회귀 체크를 추가했다.
- 검증 전에 `web/` 의존성이 비어 있어 `npm ci`로 로컬 toolchain을 복구했다.

## 최종 상태

- selected 카드와 nearest 카드가 동시에 성립할 때 둘 다 시각적으로 유지된다.
- map sidebar와 map key fallback 모두에서 현재 선택된 식당이 요약 카드와 selected marker list 상태로 함께 드러난다.
- `/store` selection model, URL query sync, geolocation, NAVER loader 동작은 그대로 유지된다.

## 검증 결과

아래 명령 기준으로 확인했다.

1. `cd web && npm test -- src/components/corkage/StoreCard.test.tsx src/components/corkage/StoreMap.test.tsx src/components/corkage/StoreExplorer.test.tsx` → PASS
2. `cd web && npm run build` → PASS
3. `cd web && npm run typecheck` → PASS
4. `cd web && npm run lint` → PASS
5. `cd web && npm run test` → PASS

## 이번 작업에서 바뀐 파일

- `docs/task-updates/2026-05-26-store-marker-card-visual-polish.md`
- `web/src/app/globals.css`
- `web/src/components/corkage/StoreCard.tsx`
- `web/src/components/corkage/StoreCard.test.tsx`
- `web/src/components/corkage/StoreMap.tsx`
- `web/src/components/corkage/StoreMap.test.tsx`

## 지금 기준으로 남은 할 일

- 이번 task 범위 안에서는 남은 필수 작업 없음.
- marker icon 자체 active 스타일 변경이나 추가 map micro-polish는 후속 시각 작업으로 분리하는 편이 안전하다.
