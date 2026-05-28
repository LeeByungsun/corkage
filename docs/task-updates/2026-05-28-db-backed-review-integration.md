# Task Update - 2026-05-28

## 작업명

DB-backed 식당의 제보 검수 canonical 반영 연결

## 결론

- `/store` 지도/리스트가 DB 데이터를 쓰는 상태에서, DB에만 있는 식당 placeId도 accepted report 검수 후 canonical override로 반영되도록 보강했다.
- 서버 canonical override 파생 로직은 더 이상 기존 seed만 기준으로 보지 않고 `stores` SQLite DB를 기준으로 existing report를 찾는다.
- 검수 큐 UI preview도 DB-backed store catalog를 사용해 DB-only placeId의 accepted preview를 보여준다.

## 이번에 한 일

- `mvp-state-store`의 accepted report → canonical override 파생 기준을 `readStoresFromDatabase()`로 전환했다.
- `ReviewQueue`가 seed catalog 대신 `/api/stores` 기반 store catalog를 읽도록 연결했다.
- DB-only placeId accepted report가 canonical override로 반영되는 서버 테스트를 추가했다.
- DB-backed placeId accepted report preview가 검수 큐에 표시되는 컴포넌트 테스트를 추가했다.

## Verification

- `cd web && npm test -- --run src/lib/server/mvp-state-store.test.ts src/components/corkage/ReviewQueue.test.tsx` → PASS
  - 2 files / 9 tests passed.
- `cd web && npm run typecheck` → PASS
- `cd web && npm run lint` → PASS
- `cd web && npm test` → PASS
  - 9 files / 45 tests passed.
- `cd web && npm run build` → PASS
- `cd web && npm run qa:store-live-markers` → PASS
  - desktop/mobile Chromium 2 tests passed.
- `GET /api/stores?district=경기 화성시 동탄구 청계동` on local dev server → PASS
  - stores: 52, first: `24시전주성콩나물국밥`.

## 바뀐 파일

- `web/src/lib/server/mvp-state-store.ts`
- `web/src/lib/server/mvp-state-store.test.ts`
- `web/src/components/corkage/ReviewQueue.tsx`
- `web/src/components/corkage/ReviewQueue.test.tsx`
- `docs/task-updates/2026-05-28-db-backed-review-integration.md`

## 남은 리스크

- 실제 운영 DB 배포와 공식 NAVER Local Search 수집은 아직 별도 작업이다.
- DB import 원본과 SQLite 파일은 로컬 산출물로 유지한다.
