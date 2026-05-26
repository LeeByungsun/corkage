# Task Update - 2026-05-26

## 작업명

`/store` live marker browser QA harness setup

## 이번에 한 일

- `web/scripts/run-store-live-marker-qa.mjs`를 추가해 `/store` live marker QA를 실제 Chromium 브라우저에서 돌릴 수 있는 repo-local 실행 경로를 만들었다.
- `web/package.json`에 `npm run qa:store-live-markers` 스크립트를 추가했다.
- `web/package.json`, `web/package-lock.json`에 `@playwright/test`를 dev dependency로 추가해 Playwright 기반 browser QA를 로컬/CI 런타임에서 재현 가능하게 만들었다.
- harness 실행 시 임시 Playwright config/spec를 `web/.omx/tmp/`에 생성하고, 결과물은 `web/.omx/playwright-results/store-live-marker/` 아래로 남기도록 정리했다.
- `.gitignore`에 `web/.omx/`, `web/test-results/`를 추가해 harness 산출물이 작업 트리를 오염시키지 않게 했다.
- 실제 harness를 실행해 데스크톱/모바일 Chromium 모두에서 `/store` live marker DOM이 나타나지 않는 현재 상태를 재현했고, trace와 error context를 남겼다.

## 최종 상태

- 이제 `/store` live marker QA를 아래 한 줄로 재실행할 수 있다.
  - `cd web && npm run qa:store-live-markers`
- harness는 실제 Chromium을 띄우고 `/store` 페이지에서 live marker DOM 상태를 찾는다.
- 현재 결과는 PASS가 아니라 `실제 marker DOM 미노출`로 FAIL이며, 이 FAIL 자체가 재현 가능한 QA 증거가 됐다.

## 검증 결과

아래 명령 기준으로 확인했다.

1. `cd web && npm run qa:store-live-markers` → FAIL
   - 데스크톱/모바일 Chromium 모두 `[data-marker-state]` DOM 미검출
   - trace 산출물:
     - `web/.omx/playwright-results/store-live-marker/store-live-marker-store-li-5a5b7-er-states-on-real-store-map-desktop-chromium/trace.zip`
     - `web/.omx/playwright-results/store-live-marker/store-live-marker-store-li-5a5b7-er-states-on-real-store-map-mobile-chromium/trace.zip`
2. `cd web && npm run build` → PASS
3. `cd web && npm run typecheck` → PASS
4. `cd web && npm run lint` → PASS
5. `cd web && npm run test` → PASS (`8 files`, `39 tests`)

## 이번 작업에서 바뀐 파일

- `.gitignore`
- `docs/task-updates/2026-05-26-store-browser-qa-harness-setup.md`
- `web/package.json`
- `web/package-lock.json`
- `web/scripts/run-store-live-marker-qa.mjs`

## 지금 기준으로 남은 할 일

- live NAVER map에서 실제 marker DOM/overlay가 왜 노출되지 않는지 원인 확인이 필요하다.
- harness는 준비됐으니 다음 작업은 이 FAIL을 실제 UI/SDK 문제로 좁히는 것이다.
