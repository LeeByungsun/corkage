# Task Update - 2026-05-28

## 작업명

`/store` 마커 선택 시 지도 뷰 고정 및 콜키지 문구 검증 가능화

## 결론

- 마커/카드 선택은 이제 선택 상태와 표시 정보만 바꾸고, live NAVER 지도 중심/줌/fitBounds를 다시 쓰지 않는다.
- 선택된 식당 요약 카드에 리뷰어가 바로 확인할 수 있는 콜키지 상태, 비용, 신뢰 배지, 조건 문구, 표시 정책 문구, NAVER 편의정보 콜키지 태그를 노출했다.
- 회귀 테스트는 실제 marker click handler를 호출한 뒤 `setCenter`, `setZoom`, `fitBounds`, map remount가 발생하지 않는 것을 검증한다.
- 최신 leader checkout에서는 `qa:store-live-markers`도 `localhost` 기준 desktop/mobile Chromium에서 통과했다.

## 이번에 한 일

- `StoreMap`의 `selectedPlaceId` 변경 전용 viewport 이동 effect를 제거했다.
- 현재 위치 이동 버튼과 최초 지도 bounds 맞춤 동작은 유지했다.
- `SelectedStoreCard`가 기존 repo helper를 재사용해 콜키지 표시 근거를 보여주도록 확장했다.
- `StoreMap.test.tsx`에 마커 클릭 후 지도 뷰가 바뀌지 않는 회귀 테스트를 추가했다.
- 선택 요약 카드에 콜키지 관련 문구가 노출되는지 테스트로 고정했다.

## Verification

- `cd web && npm test -- --run src/components/corkage/StoreMap.test.tsx` → PASS
  - 1 file / 10 tests passed.
- `cd web && npm test` → PASS
  - 9 files / 49 tests passed.
- `cd web && npm run typecheck` → PASS
- `cd web && npm run lint` → PASS
- `cd web && npm run build` → PASS
- `cd web && npm run qa:store-live-markers` → PASS
  - `http://localhost:3005/store`
  - desktop/mobile Chromium 2 tests passed.

## 바뀐 파일

- `web/src/components/corkage/StoreMap.tsx`
- `web/src/components/corkage/StoreMap.test.tsx`
- `docs/task-updates/2026-05-28-store-marker-selection-reviewable-qa.md`

## 남은 리스크

- NAVER Console의 임의 origin 설정 조합까지 모두 검증한 것은 아니다.
- 실제 운영 브라우저에서 장시간 수동 탐색 QA는 별도다.
- 선택 시 자동 센터 이동을 다시 넣으면 이번 회귀 테스트와 제품 의도가 깨진다.
