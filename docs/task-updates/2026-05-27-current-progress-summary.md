# Current Progress Summary - 2026-05-27

## 현재 어디까지 왔는가

- `/store` 기본 지도/리스트 탐색 흐름은 구현되어 있다.
- 현재 위치 기반 정렬, 반경 필터, 카드 선택, 마커 선택, URL 상태 동기화까지 붙어 있다.
- 카드/사이드바/fallback 기준의 `selected` / `nearest` 시각 상태도 반영되어 있다.
- live NAVER marker 자체에도 `selected` / `nearest` 상태를 반영하는 코드와 단위 테스트가 들어가 있다.
- 실브라우저 QA를 위한 repo-local 명령 `cd web && npm run qa:store-live-markers` 도 추가되어 있다.

## 최근 완료된 핵심 작업

### 1. 지도 시각 polish 정리

- marker-card visual polish
- 지도 sidebar/fallback의 nearest 강조
- live marker icon state 추가

관련 문서:
- `docs/task-updates/2026-05-26-store-marker-card-visual-polish.md`
- `docs/task-updates/2026-05-26-map-sidebar-nearest-highlight.md`
- `docs/task-updates/2026-05-26-store-live-marker-icon-states.md`

### 2. 실브라우저 QA harness 추가

- `web/scripts/run-store-live-marker-qa.mjs`
- `npm run qa:store-live-markers`
- Playwright 기반 desktop/mobile Chromium 실행 경로 확보

관련 문서:
- `docs/task-updates/2026-05-26-store-browser-qa-harness-setup.md`

### 3. live marker 미노출 원인 좁히기

현재까지 좁혀진 원인:
1. 초기 harness selector mismatch
2. NAVER auth/runtime 불안정 (`/v3/auth` 401, console/API 500 noise)

관련 문서:
- `docs/task-updates/2026-05-27-store-live-marker-root-cause.md`

## 지금 막힌 지점

실브라우저에서 `/store` 페이지를 열면:
- 사이드바/리스트는 정상적으로 보이지만
- live marker DOM/overlay는 안정적으로 유지되지 않는다.

현재 확보한 증거:
- `maps.js`는 로드됨
- NAVER `/v3/auth` 401 발생
- NAVER API console 500 noise 동반
- 시간차 probe에서 marker 수가 잠깐 나타났다가 사라짐
  - 0ms: 0
  - 1000ms: 4
  - 3000ms: 0
  - 7000ms: 0

즉, 현재 다음 우선순위는 `marker 렌더링 코드 자체`보다 `NAVER auth/runtime 조건` 확인이다.

## 현재 검증 상태

PASS:
- `cd web && npm run build`
- `cd web && npm run typecheck`
- `cd web && npm run lint`
- `cd web && npm run test`
- `cd web && npm run qa:store-live-markers` 실행 경로 자체는 동작

FAIL / PARTIAL:
- `cd web && npm run qa:store-live-markers`
  - desktop/mobile 모두 real marker DOM/overlay 확인 실패
  - 현재는 실패가 재현 가능한 상태

## 현재 코드/문서 기준 남은 할 일

### 1. NAVER auth 401 원인 확인

- key 자체 문제인지
- 도메인/리퍼러 제약인지
- 로컬 dev server origin 문제인지
- NAVER SDK runtime 정책 문제인지

### 2. auth 해결 뒤 real browser marker QA 재실행

- desktop breakpoint
- mobile breakpoint
- selected / nearest 상태 유지 여부
- bounds/filter/card sync 체감 확인

### 3. 필요하면 그 다음에만 UI polish

- marker badge clipping
- overlay spacing
- mobile 체감 미세 조정

## 참고 커밋

- `0b920e5` 실브라우저 live marker QA를 재현 가능한 명령으로 고정한다
- `839b532` omx(team): merge worker-1
- `ea6238c` live marker 원인분석 결과를 후속 디버깅 기준으로 남긴다

## 작업 트리 메모

- 현재 브랜치는 `origin/main` 대비 ahead 상태다.
- repo에는 unrelated untracked 파일들이 남아 있다.
- 다음 `omx team` 실행 전에는 worktree 정리가 필요할 수 있다.
