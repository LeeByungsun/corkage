# Task Update - 2026-05-22

## 작업명

현재 위치 기준 가장 가까운 식당 강조

## 이번에 한 일

- `web/src/components/corkage/StoreExplorer.tsx`에서 현재 위치가 있을 때 가장 가까운 식당 `placeId`를 계산해 리스트로 전달했다.
- `web/src/components/corkage/StoreList.tsx`에서 가장 가까운 식당 카드만 별도 강조 prop으로 넘기도록 정리했다.
- `web/src/components/corkage/StoreCard.tsx`에 `가장 가까움` 배지와 강조 스타일을 추가했다.
- `web/src/app/globals.css`에 가장 가까운 카드 전용 border / shadow / badge 스타일을 추가했다.
- `web/src/components/corkage/StoreExplorer.test.tsx`에 가장 가까운 식당 접근성 라벨 회귀 테스트를 추가했다.

## 최종 상태

- 사용자가 현재 위치를 가져오면 가장 가까운 식당 카드가 `가장 가까움` 배지와 함께 강조된다.
- 정렬을 다시 바꿔도 현재 필터 결과 안에서 가장 가까운 식당 강조 기준은 유지된다.
- 기존 거리 표시와 반경 필터 흐름은 그대로 유지된다.

## 검증 결과

아래 명령 기준으로 확인했다.

1. `cd web && npm run lint -- src/components/corkage/StoreExplorer.tsx src/components/corkage/StoreExplorer.test.tsx src/components/corkage/StoreList.tsx src/components/corkage/StoreCard.tsx` → PASS
2. `cd web && npm run typecheck` → PASS
3. `cd web && npm test -- --run src/components/corkage/StoreExplorer.test.tsx src/components/corkage/StoreCard.test.tsx src/lib/map/store-map.test.ts` → PASS (3 files, 9 tests)
4. `cd web && npm run build` → PASS

## 이번 작업에서 바뀐 파일

- `web/src/components/corkage/StoreExplorer.tsx`
- `web/src/components/corkage/StoreExplorer.test.tsx`
- `web/src/components/corkage/StoreList.tsx`
- `web/src/components/corkage/StoreCard.tsx`
- `web/src/app/globals.css`
- `docs/task-updates/2026-05-22-nearest-store-highlight.md`

## 지금 기준으로 남은 할 일

### 1. 지도 사이드바 강조 여부 결정

- 현재 작업은 카드 강조에 집중했다.
- 필요하면 지도 마커 목록에도 같은 `가장 가까움` 표시를 이어서 붙일 수 있다.

### 2. 현재 위치 상태의 URL 동기화

- 현재 위치와 반경은 클라이언트 상태다.
- 공유 가능한 탐색 상태로 확장할지는 다음 단계 판단이 필요하다.
