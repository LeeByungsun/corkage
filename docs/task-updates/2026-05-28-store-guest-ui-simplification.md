# Task Update - 2026-05-28

## 작업명

`/store` 손님용 지역 선택 + 리스트 우선 UI 단순화

## 결론

- `/store` 첫 화면은 지역 선택만 보여주도록 단순화했다.
- 지역 선택 후에는 `가능 + 확인중` 식당만 리스트로 보여주고, `불가`와 `정보 오래됨`은 기본 노출에서 제외했다.
- 지도는 `/store` 첫 화면이 아니라 식당 상세 화면에서 위치 확인 용도로 보여준다.
- `확인중` 식당은 가능처럼 표현하지 않고 방문 전 확인 문구를 함께 표시한다.

## 이번에 한 일

- `StoreExplorer`를 지역 선택 게이트와 리스트 우선 결과 화면으로 정리했다.
- `StoreCard`와 `StoreList`가 선택 버튼 없이 손님용 카드로 동작할 수 있게 했다.
- `StoreLocationMap`을 추가해 상세 화면에서 단일 식당 위치 지도를 표시했다.
- live browser QA를 상세 위치 지도 smoke check로 전환했다.

## Verification

- `cd web && npm test -- --run src/components/corkage/StoreExplorer.test.tsx src/components/corkage/StoreCard.test.tsx src/components/corkage/StoreLocationMap.test.tsx src/components/corkage/StoreDetailView.test.tsx` → PASS, 4 files / 10 tests
- `cd web && npm test` → PASS, 11 files / 50 tests
- `cd web && npm run typecheck` → PASS
- `cd web && npm run lint` → PASS
- `cd web && rm -rf .next && npx -y node@22 node_modules/next/dist/bin/next build` → PASS
- `cd web && rm -rf .next && STORE_QA_PORT=3022 npm run qa:store-live-markers` → PASS, desktop/mobile Chromium 2 tests
- `cd web && node --check scripts/run-store-live-marker-qa.mjs` → PASS

## 확인 중 발견한 blocker와 처리

- Worker worktree에는 `web/.env.local`이 없어 live QA가 처음에는 아래 메시지로 중단됐다.
  - `NEXT_PUBLIC_NAVER_MAPS_CLIENT_ID is missing. Set it in web/.env.local before running qa:store-live-markers.`
- 중간 통합 단계의 QA script에는 nested template literal 문제가 있어 `node --check`가 실패했으나, 최종 script에서는 문자열 결합 방식으로 복구했다.
- 현재 기본 `node`는 v25.8.2이고 Next 14 production build에서 stale/누락 manifest 문제가 재현됐다.
  - source 검증은 프로젝트의 `node:sqlite` 사용과 Next 14 호환성을 고려해 Node 22로 build를 통과시켰다.
- live QA는 stale `.next` 영향을 피하기 위해 `.next`를 지우고 fresh port로 재실행했다.

## 바뀐 파일

- `web/src/app/store/page.tsx`
- `web/src/app/globals.css`
- `web/src/components/corkage/StoreExplorer.tsx`
- `web/src/components/corkage/StoreExplorer.test.tsx`
- `web/src/components/corkage/StoreList.tsx`
- `web/src/components/corkage/StoreCard.tsx`
- `web/src/components/corkage/StoreCard.test.tsx`
- `web/src/components/corkage/StoreLocationMap.tsx`
- `web/src/components/corkage/StoreLocationMap.test.tsx`
- `web/src/components/corkage/StoreDetailView.tsx`
- `web/src/components/corkage/StoreDetailView.test.tsx`
- `web/scripts/run-store-live-marker-qa.mjs`
- `docs/task-updates/2026-05-28-store-guest-ui-simplification.md`

## 남은 리스크

- 지도 중심 탐색은 손님용 첫 화면에서 빠졌으므로, 위치 비교 니즈가 커지면 별도 지도 탭을 다시 설계해야 한다.
- `확인중` 데이터는 후보 정보이므로 가능처럼 오해되지 않게 문구를 계속 보수적으로 유지해야 한다.
- production build는 Node 22에서 검증했다. 현재 로컬 기본 Node 25는 Next 14와 맞지 않아 build manifest 오류가 날 수 있다.
