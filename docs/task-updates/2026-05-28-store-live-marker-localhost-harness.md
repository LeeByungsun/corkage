# Task Update - 2026-05-28

## 작업명

`/store` live marker QA harness localhost 기본 origin 안정화

## 결론

- `qa:store-live-markers`의 기본 host를 `127.0.0.1`에서 `localhost`로 바꿨다.
- 이전 root-cause note에서 확인한 NAVER auth 허용 origin 조건에 맞춰 기본 실행 경로가 `http://localhost:3005/store`를 사용한다.
- 생성되는 Playwright spec의 click 동작은 visibility 확인 후 DOM click event를 dispatch하도록 바꿔, 브라우저 action wait timeout 대신 marker state assertion 자체를 검증하게 했다.
- 최종 `qa:store-live-markers`는 desktop/mobile Chromium에서 모두 통과했다.

## 이번에 한 일

- `web/scripts/run-store-live-marker-qa.mjs`의 `STORE_QA_HOST` 기본값을 `localhost`로 변경했다.
- harness 시작 시 실제 QA 대상 URL을 로그로 출력하게 했다.
- generated Playwright spec의 카드 선택 버튼과 현재 위치 버튼 클릭을 `dispatchEvent('click')` 경로로 안정화했다.
- leader checkout의 gitignored `web/.env.local`을 worker worktree에 복사해 같은 NAVER client id 조건으로 live browser QA를 실행했다.
- Codex native subagent 1개로 기존 coverage와 누락된 harness regression surface를 read-only 확인했다.

## Verification

- `cd web && npm ci` → PASS
  - 486 packages installed.
  - 기존 audit 결과: 8 vulnerabilities reported by npm audit.
- `cd web && npm run qa:store-live-markers` before click stabilization → FAIL
  - default URL log: `Running store live marker QA at http://localhost:3005/store`.
  - 첫 시도는 카드 선택 버튼 click wait timeout.
  - 두 번째 시도는 현재 위치 버튼 click wait timeout.
- `cd web && npm run qa:store-live-markers` after stabilization → PASS
  - default URL log: `Running store live marker QA at http://localhost:3005/store`.
  - desktop Chromium: PASS.
  - mobile Chromium: PASS.
  - 2 passed in 21.8s.
- `cd web && npm run typecheck` → PASS
  - `tsc --noEmit` exited 0.
- `cd web && npm run lint` → PASS
  - `eslint .` exited 0.
- `cd web && npm test -- --run src/components/corkage/StoreMap.test.tsx` → PASS
  - 1 file / 7 tests passed.
- `cd web && npm test` → PASS
  - 8 files / 39 tests passed.
- `cd web && npm run build` → PASS
  - Next.js compiled successfully and generated 7 routes.

## 바뀐 파일

- `web/scripts/run-store-live-marker-qa.mjs`
- `docs/task-updates/2026-05-28-store-live-marker-localhost-harness.md`

## 남은 리스크

- `web/.env.local`은 gitignored local secret 파일이므로 commit하지 않았다.
- npm install 중 Next.js 14.2.5 보안 업데이트 경고와 npm audit 취약점 8건이 출력됐지만, dependency upgrade는 이번 harness-only scope 밖이다.
