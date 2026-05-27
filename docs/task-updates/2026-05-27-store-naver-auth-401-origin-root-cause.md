# Task Update - 2026-05-27

## 작업명

`/store` NAVER auth 401 / marker overlay 소실 root cause 분석

## 결론

- Root cause는 local QA origin mismatch다.
- 같은 `NEXT_PUBLIC_NAVER_MAPS_CLIENT_ID`, 같은 코드, 같은 브라우저 조건에서 `127.0.0.1`은 NAVER `/v3/auth`가 401이고 `localhost`는 200이다.
- `naver-maps-loader`는 공식 v3 파라미터인 `ncpKeyId`로 `maps.js`를 로드한다.
- 따라서 marker renderer 자체나 SDK URL 생성 문제가 아니라 NAVER Console Web service URL/auth origin 조건과 QA host 기본값이 맞지 않는 문제다.

## 이번에 한 일

- `qa:store-live-markers`를 먼저 실행해 worktree의 `web/.env.local` 누락 실패를 재현했다.
- leader checkout의 gitignored `web/.env.local`을 worker worktree에 복사해 같은 client id 조건으로 재실행했다.
- `127.0.0.1` origin과 `localhost` origin을 custom Playwright probe로 비교했다.
- `naver-maps-loader`, `StoreMap`, QA harness, 공식 NAVER 문서 범위만 확인했고 UI/product 코드는 바꾸지 않았다.
- Codex native subagents 3개를 병렬로 사용해 repo map, 공식 문서, verification surface를 분리 확인했다.

## Root cause evidence

- `web/scripts/run-store-live-marker-qa.mjs`의 기본 host는 `127.0.0.1`이다.
- `web/src/lib/map/naver-maps-loader.ts`는 `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=...`만 주입한다.
- `web/src/components/corkage/StoreMap.tsx`는 SDK 로드 이후 map과 marker를 생성하고, cleanup에서 marker/map을 제거한다.
- NAVER 공식 JS 문서는 v3 loader query parameter가 `ncpClientId`에서 `ncpKeyId`로 바뀌었다고 안내한다.
- NAVER Cloud 공식 Application 문서는 Web service URL이 web SDK 사용에 필요한 값이고, 실제 사용 URL과 다르면 인증 실패가 날 수 있다고 안내한다.
- NAVER Cloud 공식 troubleshooting 문서는 Web Dynamic Map 인증 오류 원인으로 service URL의 port/URI 포함과 script parameter 오류를 제시하며, 등록 값은 host만 두라고 안내한다.

## Browser probe 결과

### `http://127.0.0.1:3015/store`

- `maps.js`: 200
- `/v3/auth?...url=http%3A%2F%2F127.0.0.1%3A3015%2Fstore...`: 401
- console: `Failed to load resource: the server responded with a status of 401 (Unauthorized)`
- NAVER console: `Error Code / Error Message: 500 / Internal Server Error`, URI는 `http://127.0.0.1:3015/store`
- marker samples: 0개가 유지되어 live marker overlay가 안정적으로 렌더링되지 않음

### `http://localhost:3016/store`

- `maps.js`: 200
- `/v3/auth?...url=http%3A%2F%2Flocalhost%3A3016%2Fstore...`: 200
- NAVER auth console error: 없음
- marker samples: 1s, 3s, 7s, 10s 모두 marker 4개 유지

## Verification

- `cd web && npm run qa:store-live-markers` with no worker `.env.local` → FAIL as expected
  - `NEXT_PUBLIC_NAVER_MAPS_CLIENT_ID is missing. Set it in web/.env.local before running qa:store-live-markers.`
- `cd web && npm run qa:store-live-markers` after copying leader `.env.local` → FAIL
  - default `127.0.0.1` origin에서 실행됨.
  - desktop/mobile 모두 first default marker는 찾았지만 `cardButtons.first().click()`에서 180000ms timeout.
  - custom network probe에서 같은 default origin의 `/v3/auth` 401을 확인했다.
- `cd web && STORE_QA_HOST=localhost STORE_QA_PORT=3016 npm run qa:store-live-markers` → FAIL
  - auth는 custom probe 기준 200으로 해결되지만, generated Playwright spec은 같은 `cardButtons.first().click()` timeout에서 멈춘다.
  - 이는 auth 401과 분리된 QA harness click/navigation 대기 이슈로 보이며 이번 root-cause 범위에서는 수정하지 않았다.
- custom Playwright browser probe → PASS for root-cause isolation
  - `127.0.0.1`: auth 401 + marker overlay unstable/absent.
  - `localhost`: auth 200 + marker 4개가 10초 이상 유지.
- `cd web && npm run typecheck` → PASS
- `cd web && npm run lint` → PASS
- `cd web && npm test -- StoreMap.test.tsx src/lib/map/store-map.test.ts` → PASS, 2 files / 14 tests
- `cd web && npm test` → PASS, 8 files / 39 tests

## 공식 문서 확인

- NAVER Maps JS v3 Client ID 문서: `ncpKeyId` 사용 확인
  - https://navermaps.github.io/maps.js.en/docs/tutorial-1-Getting-Client-ID.html
- NAVER Cloud Maps Application 문서: Web service URL이 web SDK auth에 필요하고 실제 web 정보와 다르면 auth가 실패할 수 있음
  - https://guide.ncloud-docs.com/docs/en/maps-app/
- NAVER Cloud Maps troubleshooting 문서: Web Dynamic Map auth error는 service URL port/URI 또는 script parameter 오류와 연결됨
  - https://guide.ncloud-docs.com/docs/en/maps-troubleshoot

## 바뀐 파일

- `docs/task-updates/2026-05-27-store-naver-auth-401-origin-root-cause.md`

## 남은 일

1. NAVER Console Web service URL에 `http://127.0.0.1`을 추가하거나, QA harness 기본 host를 `localhost`로 바꾼다.
2. 그 다음 별도 follow-up에서 `qa:store-live-markers`의 `cardButtons.first().click()` timeout을 분리 조사한다.
3. auth 200과 click 안정화가 모두 끝난 뒤 selected / nearest marker full browser assertion을 다시 완료한다.
