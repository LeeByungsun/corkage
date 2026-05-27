# Task Update - 2026-05-27

## 작업명

`/store` NAVER auth 401 / marker overlay 소실 root cause 분석

## 이번에 한 일

- `qa:store-live-markers`를 먼저 재현해 worktree의 `web/.env.local` 누락 실패와 실제 NAVER runtime 실패를 분리했다.
- leader checkout의 `web/.env.local`을 worktree에 복사해 같은 client id 조건으로 실브라우저 probe를 실행했다.
- `127.0.0.1` origin과 `localhost` origin을 같은 코드/키/브라우저 조건에서 비교했다.
- `naver-maps-loader`, `StoreMap`, QA harness 범위만 확인했고 UI/product 코드는 바꾸지 않았다.

## Root cause

- 원인은 local QA origin mismatch다.
- 현재 QA harness 기본값은 `http://127.0.0.1:3005` 계열 origin이다.
- NAVER SDK는 `maps.js`를 먼저 200으로 로드한 뒤 별도 `/v3/auth` 요청에서 현재 page URL을 검사한다.
- `127.0.0.1` origin에서는 `/v3/auth`가 401을 반환했고 marker DOM은 잠깐 나타난 뒤 사라졌다.
- 같은 키와 같은 코드로 `localhost` origin을 쓰면 `/v3/auth`가 200을 반환했고 marker DOM 4개가 10초 이상 유지됐다.
- 따라서 `StoreMap` marker renderer나 `naver-maps-loader` URL 생성 문제가 아니라 NAVER에 등록된 Web URL/referrer 조건과 QA origin이 맞지 않는 문제다.

## Evidence

- `web/src/lib/map/naver-maps-loader.ts`는 `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=...`만 주입한다.
- `web/src/components/corkage/StoreMap.tsx`는 SDK 로드 이후 map과 marker를 생성한다.
- `web/scripts/run-store-live-marker-qa.mjs` 기본 host는 `127.0.0.1`이다.
- 공식 NAVER 문서는 Maps API v3 로드에 `ncpKeyId`가 필요하고, 콘솔의 Application Services > Maps > Application에서 application과 Dynamic Map 선택을 확인하라고 안내한다.
- NAVER 연동 API 문서는 web SDK 사용에 Web URL이 필요한 값이라고 설명한다.

## Probe 결과

### `http://127.0.0.1:3015/store`

- `maps.js`: 200
- `/v3/auth?...url=http%3A%2F%2F127.0.0.1%3A3015%2Fstore...`: 401
- console: `Failed to load resource: the server responded with a status of 401 (Unauthorized)`
- NAVER console: `Error Code / Error Message: 500 / Internal Server Error`, URI는 `http://127.0.0.1:3015/store`
- marker count:
  - 0ms: 0
  - 1000ms: 4
  - 3000ms: 0
  - 7000ms: 4
  - 10000ms: 0

### `http://localhost:3016/store`

- `maps.js`: 200
- `/v3/auth?...url=http%3A%2F%2Flocalhost%3A3016%2Fstore...`: 200
- console NAVER auth error: 없음
- marker count:
  - 0ms: 0
  - 1000ms: 4
  - 3000ms: 4
  - 7000ms: 4
  - 10000ms: 4

## 검증 결과

- `cd web && npm run qa:store-live-markers` → FAIL
  - worktree에 `web/.env.local`이 없으면 fail-fast로 `NEXT_PUBLIC_NAVER_MAPS_CLIENT_ID is missing`.
- `cd web && npm run qa:store-live-markers` after copying leader `web/.env.local` → FAIL/blocked
  - default `127.0.0.1` origin에서 NAVER `/v3/auth` 401 재현.
  - generated Playwright run can hang on the first desktop assertion because marker overlay is unstable after auth failure.
- custom browser probe → PASS for root-cause isolation
  - `127.0.0.1`은 auth 401 + marker instability.
  - `localhost`는 auth 200 + marker persistence.

## 이번 작업에서 바뀐 파일

- `docs/task-updates/2026-05-27-store-naver-auth-401-origin-root-cause.md`

## 남은 일

1. QA harness를 `localhost` 기본값으로 바꾸거나 NAVER console Web URL에 `127.0.0.1` origin을 추가한다.
2. 그 다음 `cd web && STORE_QA_HOST=localhost npm run qa:store-live-markers`를 다시 안정화한다.
3. auth가 200으로 고정된 뒤 selected / nearest marker assertion을 다시 확인한다.
