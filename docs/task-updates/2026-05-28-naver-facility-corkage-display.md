# Task Update - 2026-05-28

## 작업명

NAVER 편의정보 기반 콜키지 가능 여부 표시

## 결론

- `docs/research_notes.md`의 `tool/getid` 결과 포맷을 `db:import:stores`가 직접 읽도록 확장했다.
- `corkageAllowed`, `corkageFee`, `facilities`를 DB의 공개 상태/비용/조건/원본 편의정보로 정규화했다.
- `/store` 카드와 상세 화면에서 콜키지 조건과 NAVER 편의정보 콜키지 태그를 표시한다.
- 현재 로컬 DB에는 청계동 음식점 249개가 적재됐고, 콜키지 가능 39개(무료 15개, 유료 24개)가 화면 데이터로 반영됐다.

## 이번에 한 일

- `rawFacilities` 타입과 SQLite `raw_facilities_json` 컬럼을 추가했다.
- 기존 DB에도 컬럼을 자동 추가하도록 마이그레이션을 넣었다.
- `web/scripts/import-store-database.mjs`가 Apollo State 객체와 `tool/getid` JSON 배열을 모두 처리하도록 확장했다.
- 무료 콜키지(`feeUnit: free`, `corkageFee: 0`)가 `무료`로 표시되도록 비용 라벨 로직을 수정했다.
- StoreCard와 StoreDetailView에 조건 문구와 콜키지 편의정보 태그를 표시했다.
- import 문서에 `tool/getid` 결과 적재 명령을 추가했다.

## Verification

- `cd web && tmpdir=$(mktemp -d) && CORKAGE_STORE_DB_FILE="$tmpdir/corkage.sqlite" CORKAGE_IMPORT_VERIFIED_AT=2026-05-28 npm run db:import:stores -- ../tool/getid/results_경기도_화성시_청계동_음식점.json` → PASS
  - 249 stores imported.
  - `available` 39개.
- `cd web && CORKAGE_IMPORT_VERIFIED_AT=2026-05-28 npm run db:import:stores -- ../tool/getid/results_경기도_화성시_청계동_음식점.json` → PASS
  - 로컬 화면 DB에 total 249 / available 39 / unavailable 210 / free 15 / paid 24 반영.
- `cd web && npm test -- --run src/components/corkage/StoreCard.test.tsx src/lib/server/store-database.test.ts` → PASS
  - 2 files / 6 tests passed.
- `cd web && npm test` → PASS
  - 9 files / 47 tests passed.
- `cd web && npm run typecheck` → PASS
- `cd web && npm run lint` → PASS
- `cd web && npm run build` → PASS
- `cd web && PORT=3101 npm run start -- -p 3101` + HTTP check → PASS
  - `/api/stores?status=available` and `/store?status=available` both include `계돈이네 동탄역본점`, `무료`, `콜키지 가능 (무료)`, `NAVER`.

## 바뀐 파일

- `web/scripts/import-store-database.mjs`
- `web/src/lib/types/corkage.ts`
- `web/src/lib/server/store-database.ts`
- `web/src/lib/repo/corkage-repo.ts`
- `web/src/components/corkage/StoreCard.tsx`
- `web/src/components/corkage/StoreDetailView.tsx`
- `web/src/app/globals.css`
- `web/src/components/corkage/StoreCard.test.tsx`
- `web/src/lib/server/store-database.test.ts`
- `docs/corkage-info-import-format.md`
- `docs/task-updates/2026-05-28-naver-facility-corkage-display.md`

## 남은 리스크

- `tool/getid` 결과는 NAVER 편의정보 자동 추출 기반이므로 `sourceType=public_web_reference`, `confidenceLabel=low`로 보수 표시한다.
- 유료 콜키지는 세부 금액이 없어서 `비용 문의 필요`와 원본 태그를 함께 표시한다.
- 실제 NAVER 지도 marker live QA는 이번 검증에서 별도 실행하지 않았다.
