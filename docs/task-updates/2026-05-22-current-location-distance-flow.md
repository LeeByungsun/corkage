# Task Update - 2026-05-22

## 작업명

현재 위치 기반 지도 마커, 거리 계산, 가까운 순 정렬, 반경 필터 추가

## 이번에 한 일

- `web/src/components/corkage/StoreExplorer.tsx`에 현재 위치 요청 흐름을 추가했다.
- 브라우저 `navigator.geolocation`으로 현재 위치를 받아 `distance` 정렬 모드와 반경 필터를 연결했다.
- `web/src/components/corkage/StoreMap.tsx`에 현재 위치 마커와 `내 위치로 지도 이동` 버튼을 추가했다.
- `web/src/lib/map/store-map.ts`에 거리 계산, 거리 라벨, 거리 정렬, 반경 필터 helper를 추가했다.
- `web/src/components/corkage/StoreCard.tsx`에 현재 위치 기준 거리 표시를 추가했다.
- 현재 위치/거리 helper 테스트와 탐색 UI 테스트를 추가했다.

## 최종 상태

- 사용자가 현재 위치를 요청할 수 있다.
- 현재 위치가 잡히면 지도에 현재 위치 마커가 추가된다.
- 리스트는 현재 위치 기준 가까운 순 정렬이 가능하다.
- 반경 필터로 1km / 3km / 5km / 10km 범위를 좁힐 수 있다.
- 지도 키가 없어도 현재 위치 좌표와 거리 흐름은 fallback UI로 확인 가능하다.

## 검증 결과

아래 명령 기준으로 확인했다.

1. `cd web && npm run build`
2. `cd web && npm run typecheck`
3. `cd web && npm run lint`
4. `cd web && npm run test`

## 이번 작업에서 바뀐 파일

- `web/src/components/corkage/StoreExplorer.tsx`
- `web/src/components/corkage/StoreExplorer.test.tsx`
- `web/src/components/corkage/StoreMap.tsx`
- `web/src/components/corkage/StoreMap.test.tsx`
- `web/src/components/corkage/StoreCard.tsx`
- `web/src/components/corkage/StoreList.tsx`
- `web/src/lib/map/store-map.ts`
- `web/src/lib/map/store-map.test.ts`

## 지금 기준으로 남은 할 일

### 1. 실제 위치 권한 UX 다듬기

- 권한 거부/실패 메시지는 기본형만 있다.
- 재시도 안내와 브라우저별 문구는 더 다듬을 수 있다.

### 2. 지도 상호작용 고도화

- 현재는 현재 위치 마커 + 이동까지만 있다.
- 식당 마커 클릭 시 상세 이동, info window, 선택 상태 동기화는 다음 단계다.

### 3. 서버/URL 상태 동기화

- 현재 정렬/반경은 클라이언트 상태다.
- 공유 가능한 URL 파라미터까지 밀어붙일지는 다음 결정이 필요하다.
