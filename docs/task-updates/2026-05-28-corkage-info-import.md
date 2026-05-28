# Task Update - 2026-05-28

## 작업명

콜키지 사실 정보 import 경로 추가

## 결론

- 음식점 후보 DB에 콜키지 가능 여부/비용/조건을 덧입히는 operator import 경로를 추가했다.
- 자동 크롤링 결과를 바로 공개하지 않고, `placeId`, `verifiedAt`, `sourceType`, `sourceNote`가 있는 검수 row만 DB에 반영한다.
- 기존 음식점 후보가 없는 `placeId`는 건너뛰고 출력에 표시한다.

## 이번에 한 일

- `CorkageInfoUpdate` 타입을 추가했다.
- SQLite `stores` row의 콜키지 필드만 갱신하는 `updateCorkageInfoInDatabase`를 추가했다.
- `scripts/import-corkage-info.mjs`를 추가했다.
  - JSON array, `{ records: [...] }`, CSV 입력 지원.
  - 한글 상태값 `가능/불가/확인중`도 정규화.
  - `sourceNote`와 `verifiedAt` 필수 검증.
- `npm run db:import:corkage` 스크립트를 추가했다.
- `docs/corkage-info-import-format.md`에 입력 포맷과 정책을 문서화했다.

## Verification

- temp SQLite DB에서 `npm run db:import:stores` 후 `npm run db:import:corkage -- corkage-info.json` → PASS
  - `1284360876` row가 `available`, `15000`, `store_direct`로 갱신됨.
- `cd web && npm test -- --run src/lib/server/store-database.test.ts` → PASS
  - 1 file / 3 tests passed.
- `cd web && npm run typecheck` → PASS
- `cd web && npm run lint` → PASS
- `cd web && npm test` → PASS
  - 9 files / 46 tests passed.
- `cd web && npm run build` → PASS
- `cd web && npm run qa:store-live-markers` → PASS
  - desktop/mobile Chromium 2 tests passed.

## 바뀐 파일

- `web/package.json`
- `web/scripts/import-corkage-info.mjs`
- `web/src/lib/types/corkage.ts`
- `web/src/lib/server/store-database.ts`
- `web/src/lib/server/store-database.test.ts`
- `docs/corkage-info-import-format.md`
- `docs/task-updates/2026-05-28-corkage-info-import.md`

## 남은 리스크

- 실제 콜키지 source 수집 자체는 아직 operator/manual input 기준이다.
- 공식 API나 제휴 데이터 소스가 확보되면 이 import 포맷으로 변환하는 adapter를 추가해야 한다.
