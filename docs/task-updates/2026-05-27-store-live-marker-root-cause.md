# Task Update - 2026-05-27

## 작업명

`/store` live marker DOM 미노출 root cause 분석

## 이번에 한 일

- 실브라우저 QA harness 실패를 다시 추적해 `/store` live marker DOM 미노출 현상을 원인 분석 대상으로 고정했다.
- `web/src/components/corkage/StoreMap.tsx`의 live marker HTML에 `data-marker-state` 속성을 직접 넣어 Playwright selector가 실제 marker HTML을 찾을 수 있는지 확인하는 작은 unblock을 반영했다.
- `web/src/components/corkage/StoreMap.test.tsx`를 현재 marker HTML 구조에 맞게 조정해 mocked marker icon 검증이 selector 기반으로 유지되게 맞췄다.
- worktree에서 leader의 `web/.env.local`을 복사해 live NAVER key가 없는 가짜 실패와 실제 runtime 실패를 분리했다.
- 기존 `qa:store-live-markers` harness와 추가 shell/browser probe로 marker 개수 변화, NAVER auth 요청 상태, console/network noise를 확인했다.

## 최종 상태

- 초기 browser QA 실패 원인 중 하나는 harness selector mismatch였다.
  - 기존 marker HTML에는 `data-marker-state`가 없어서 Playwright가 marker DOM을 찾지 못했다.
- 이 selector mismatch를 보정한 뒤에는 live marker가 잠깐 나타났다가 사라지는 현상이 관찰됐다.
- 추가 probe 기준으로 현재 더 중요한 root cause는 NAVER runtime auth 불안정이다.
  - `maps.js`는 로드되지만 `/v3/auth`가 401을 반환하고,
  - 브라우저 쪽에 NAVER API console 500 noise가 함께 나타난다.
- 따라서 현재 root cause 결론은 아래 두 단계다.
  1. QA harness selector mismatch
  2. real browser에서 NAVER auth/runtime failure로 marker overlay가 안정적으로 유지되지 않음

## 검증 결과

아래 증거를 기준으로 확인했다.

1. `cd web && npm run test -- --run src/components/corkage/StoreMap.test.tsx` → PASS
2. `cd web && npm run qa:store-live-markers` → FAIL 유지
   - 실브라우저 probe에서 marker DOM이 안정적으로 유지되지 않음
3. worktree shell/browser probe 결과
   - `maps.js` 200
   - NAVER `/v3/auth` 401
   - NAVER console/API 500 noise 관찰
4. 시간차 marker count probe
   - 0ms: 0
   - 1000ms: 4
   - 3000ms: 0
   - 7000ms: 0

## 이번 작업에서 바뀐 파일

- `docs/task-updates/2026-05-27-store-live-marker-root-cause.md`
- `web/src/components/corkage/StoreMap.tsx`
- `web/src/components/corkage/StoreMap.test.tsx`

## 지금 기준으로 남은 할 일

- NAVER auth 401/overlay 소실이 key 문제인지, 도메인/리퍼러 제약인지, SDK runtime 정책 문제인지 더 좁혀야 한다.
- 다음 단계는 `StoreMap`/`naver-maps-loader`/browser trace 중심으로 auth 실패 원인을 직접 좁히는 디버깅이다.
