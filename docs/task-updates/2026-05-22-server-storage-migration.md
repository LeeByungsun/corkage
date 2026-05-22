# Task Update - 2026-05-22

## 작업명

localStorage 기반 report-drafts / canonical-overrides를 서버 목업 저장 구조로 전환

## 이번에 한 일

- `web/src/app/api/mvp-state/route.ts`를 추가해 draft report / canonical override / review log를 서버에서 읽고 쓰는 API를 만들었다.
- `web/src/lib/server/mvp-state-store.ts`를 추가해 `web/data/mvp-state.json` 기반 서버 저장소를 만들었다.
- `web/src/lib/repo/report-drafts.ts`, `web/src/lib/repo/canonical-overrides.ts`, `web/src/lib/repo/use-canonical-stores.ts`를 서버 fetch 기반으로 바꿨다.
- `web/src/components/corkage/ReportForm.tsx`와 `web/src/components/corkage/ReviewQueue.tsx`를 비동기 서버 저장 흐름에 맞게 바꿨다.
- `accepted + existing` 조합만 canonical override로 계산되도록 서버에서 재계산하도록 바꿨다.
- `candidate` 제보는 accepted 되어도 canonical override에 들어가지 않게 유지했다.
- 서버 저장소 동작을 검증하는 테스트를 추가하고 기존 UI 테스트를 서버 fetch 기준으로 갱신했다.

## 최종 상태

- report draft는 브라우저 localStorage가 아니라 `web/data/mvp-state.json` 기반 서버 목업 저장소에 저장된다.
- review state 변경 시 canonical override는 서버에서 다시 계산된다.
- `accepted` 상태가 아닌 제보는 canonical override에 남지 않는다.
- existing store와 candidate 구분은 그대로 유지된다.

## 검증 결과

아래 명령 기준으로 확인했다.

1. `cd web && npm run typecheck`
2. `cd web && npm run lint`
3. `cd web && npm run test`
4. `cd web && npm run build`

## 이번 작업에서 바뀐 파일

- `web/data/mvp-state.json`
- `web/src/app/api/mvp-state/route.ts`
- `web/src/components/corkage/ReportForm.tsx`
- `web/src/components/corkage/ReportForm.test.tsx`
- `web/src/components/corkage/ReviewQueue.tsx`
- `web/src/components/corkage/ReviewQueue.test.tsx`
- `web/src/lib/repo/canonical-overrides.ts`
- `web/src/lib/repo/report-drafts.ts`
- `web/src/lib/repo/server-state-client.ts`
- `web/src/lib/repo/use-canonical-stores.ts`
- `web/src/lib/server/mvp-state-store.ts`
- `web/src/lib/server/mvp-state-store.test.ts`
- `web/src/lib/types/corkage.ts`
- `web/src/app/report/page.tsx`

## 지금 기준으로 남은 할 일

### 1. 진짜 DB로 전환

- 현재는 서버 목업 JSON 파일 저장이다.
- 다중 사용자/배포 환경용 DB는 아직 아니다.

### 2. review log UI 노출 여부 결정

- 지금은 `reviewLogs`를 서버에 저장만 한다.
- 운영 화면에서 어떤 수준까지 보여줄지 결정이 필요하다.

### 3. 인증/권한은 아직 없음

- 이번 작업은 auth를 의도적으로 제외했다.
- 실제 운영 전에는 review API 접근 제어가 필요하다.
