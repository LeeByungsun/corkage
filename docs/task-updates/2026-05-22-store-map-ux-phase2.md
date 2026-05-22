# Task Update - 2026-05-22

## 작업명

/store 지도 UX 2차 작업 마무리

## 이번에 한 일

- 마커 클릭 시 해당 식당 카드가 선택되고 상세 링크로 이어지는 흐름을 붙였다.
- 현재 위치 기준 가장 가까운 식당을 배지와 카드 강조로 표시했다.
- 현재 지도 bounds 안 식당만 리스트에 반영되도록 연결했다.
- 마커 선택과 카드 선택 상태를 양방향으로 동기화했다.
- `sort`, `radius`, `selected` 상태를 URL 파라미터로 공유 가능하게 만들었다.
- 관련 회귀 테스트를 정리하고 깨진 팀 통합본을 leader에서 최종 정합화했다.

## 최종 상태

- `/store`에서 지도와 카드 선택이 동기화된다.
- 현재 위치가 있으면 가장 가까운 식당이 강조된다.
- 지도 이동 범위에 따라 리스트가 함께 줄어든다.
- URL 파라미터로 정렬/반경/선택 상태를 공유할 수 있다.
- NAVER 키가 없어도 fallback 흐름은 유지된다.

## 검증 결과

아래 명령 기준으로 확인했다.

1. `cd web && npm run typecheck`
2. `cd web && npm run lint`
3. `cd web && npm run test`
4. `cd web && npm run build`

## 이번 작업에서 바뀐 파일

- `web/src/components/corkage/StoreExplorer.tsx`
- `web/src/components/corkage/StoreExplorer.test.tsx`
- `web/src/components/corkage/StoreList.tsx`
- `web/src/components/corkage/StoreCard.tsx`
- `web/src/components/corkage/StoreCard.test.tsx`
- `web/src/components/corkage/StoreMap.tsx`
- `web/src/components/corkage/StoreMap.test.tsx`
- `web/src/lib/map/store-map.ts`
- `web/src/lib/map/store-map.test.ts`
- `web/src/lib/map/naver-maps-loader.ts`
- `web/src/app/store/page.tsx`
- `web/src/app/globals.css`
- `web/next.config.mjs`
- `docs/task-updates/2026-05-22-store-map-ux-phase2.md`

## 지금 기준으로 남은 할 일

### 1. 실제 브라우저 공유 UX 점검

- 공유 URL 진입 시 체감이 자연스러운지 실사용 확인이 더 필요하다.

### 2. 지도 pan/zoom 세부 정책 고도화

- 현재는 bounds 기반 리스트 연동만 붙였다.
- center/zoom 자체를 URL에 얼마나 더 노출할지는 추가 판단이 필요하다.

### 3. 마커/카드 시각 강조 다듬기

- 현재는 기능 중심이다.
- selected/nearest 시각 디자인은 더 다듬을 수 있다.
