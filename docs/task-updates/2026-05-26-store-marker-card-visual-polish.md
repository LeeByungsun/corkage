# Task Update - 2026-05-26

## 작업명

/store marker-card 시각 polish와 회귀 테스트 마감

## 이번에 한 일

- `StoreCard`에 selected / nearest 상태를 동시에 유지할 수 있는 시각 훅을 정리했다.
- 선택된 카드에 `선택됨` 배지와 선택 버튼 강조를 추가해 카드 상태를 더 분명하게 보이도록 다듬었다.
- `StoreMap` fallback / live sidebar 모두에서 선택한 식당 요약 카드를 보여주도록 정리했다.
- 선택된 지도 목록 버튼에 전용 selected class를 추가해 fallback 과 live map sidebar의 강조가 같은 방식으로 보이도록 맞췄다.
- `globals.css`에서 card / map 선택 강조, nearest 강조, fallback 선택 카드 스타일을 같은 accent 계열로 맞췄다.
- `StoreCard`, `StoreMap`, `StoreExplorer` 테스트에 selected / nearest DOM class와 fallback 유지 회귀 검증을 추가했다.
- `web/` 의존성이 빠져 있던 worktree라 `npm ci`로 복구한 뒤 전체 검증을 다시 돌렸다.

## 최종 상태

- `/store` 카드에서 selected 와 nearest 상태가 함께 유지된다.
- 선택된 카드는 배지, 버튼, 카드 shell이 함께 강조된다.
- NAVER 키가 없어도 fallback 패널은 그대로 유지되며 선택한 식당 요약과 목록 강조가 남는다.
- live map sidebar에서도 선택한 식당 요약과 목록 강조가 같이 보인다.
- 관련 selected / nearest 시각 계약은 컴포넌트 테스트로 고정됐다.

## 검증 결과

아래 명령 기준으로 확인했다.

1. `cd web && npm run typecheck`
2. `cd web && npm run lint`
3. `cd web && npm run test`
4. `cd web && npm run build`

## 이번 작업에서 바뀐 파일

- `web/src/components/corkage/StoreCard.tsx`
- `web/src/components/corkage/StoreMap.tsx`
- `web/src/app/globals.css`
- `web/src/components/corkage/StoreCard.test.tsx`
- `web/src/components/corkage/StoreMap.test.tsx`
- `web/src/components/corkage/StoreExplorer.test.tsx`
- `docs/task-updates/2026-05-26-store-marker-card-visual-polish.md`

## 지금 기준으로 남은 할 일

### 1. 실브라우저 체감 polish 확인

- 이번 작업은 DOM class / build / test 기준으로 마감했다.
- 실제 모바일 viewport에서 badge 밀도와 간격 체감 확인은 추가로 할 수 있다.

### 2. 지도 marker 자체 selected 표현 확장 여부 결정

- 이번 범위는 sidebar / fallback 목록 강조까지로 제한했다.
- 실제 marker 아이콘 자체 selected 스타일은 별도 범위로 판단이 필요하다.
