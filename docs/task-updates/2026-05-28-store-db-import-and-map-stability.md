# Task Update - 2026-05-28

## 작업명

`/store` DB 기반 지역 식당 표시와 지도 안정화

## 결론

- `/store`는 더 이상 클라이언트 seed hook만 의존하지 않고 서버 SQLite DB에서 식당 후보를 읽는다.
- 사전 수집된 NAVER place Apollo state를 1회 import하는 스크립트를 추가했고, 현재 로컬 DB에는 `경기 화성시 동탄구 청계동` 식당 후보 52개가 적재되어 있다.
- 지역 쿼리 API는 같은 지역 선택 기준으로 52개를 반환한다.
- 실행 중 보인 지도 깜빡임은 같은 마커 목록이 새 배열로 들어오거나 현재 위치가 바뀔 때 `StoreMap`이 live NAVER map을 다시 만드는 경로를 막아 완화했다.

## 이번에 한 일

- `web/data/corkage.sqlite` 로컬 SQLite DB 경로와 `stores` 테이블 스키마를 추가했다.
- DB가 비어 있으면 기존 seed로 bootstrap하고, `list_apollo_state.json`이 있으면 `npm run db:import:stores`로 후보 데이터를 교체 적재하게 했다.
- `/api/stores`를 추가해 `status`, `district`, `maxFee` 필터를 서버 canonical store 서비스에 연결했다.
- `/`, `/store`, `/store/[id]`가 DB-backed canonical store 읽기를 사용하도록 전환했다.
- `StoreMap`은 stable marker signature 기준으로만 map을 remount하고, 현재 위치 마커는 별도 marker로 갱신하게 했다.
- URL query 동기화는 동일 query일 때 `router.replace`를 건너뛰게 했다.
- live marker QA는 모바일에서도 가장 가까운 marker button을 직접 선택해 `selected-nearest` 상태를 검증하도록 안정화했다.

## Verification

- `cd web && npm run db:import:stores` → PASS
  - 52 stores imported into `web/data/corkage.sqlite`.
- `GET /api/stores?district=경기 화성시 동탄구 청계동` on local dev server → PASS
  - stores: 52, first: `24시전주성콩나물국밥`.
- `cd web && npm run typecheck` → PASS
- `cd web && npm run lint` → PASS
- `cd web && npm test` → PASS
  - 9 files / 43 tests passed.
- `cd web && npm run build` → PASS
- `cd web && npm run qa:store-live-markers` → PASS
  - desktop/mobile Chromium 2 tests passed.

## 바뀐 파일

- `.gitignore`
- `web/package.json`
- `web/scripts/import-store-database.mjs`
- `web/scripts/run-store-live-marker-qa.mjs`
- `web/src/app/api/stores/route.ts`
- `web/src/app/page.tsx`
- `web/src/app/store/page.tsx`
- `web/src/app/store/[id]/page.tsx`
- `web/src/components/corkage/StoreMap.tsx`
- `web/src/components/corkage/StoreExplorer.tsx`
- `web/src/lib/server/store-database.ts`
- `web/src/lib/server/canonical-store-service.ts`

## 남은 리스크

- import 원본 `list_apollo_state.json`과 SQLite 파일은 로컬 산출물이라 커밋하지 않는다. 새 환경에서는 원본 파일을 두고 `cd web && npm run db:import:stores`를 다시 실행해야 한다.
- NAVER 공식 Local Search 서버 호출 credentials는 아직 없어 live official fetch는 하지 않았다.
- NAVER place 후보는 콜키지 사실 검증이 아니므로 모든 신규 후보는 `unknown` 상태로만 공개된다.
- `mvp-state-store`의 accepted report → canonical override 경로는 아직 기존 seed 기준이 남아 있어, DB-only placeId 검수 반영은 후속 작업으로 분리해야 한다.
