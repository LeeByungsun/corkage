# Task Update - 2026-05-21

## 작업명

web 검증 루프 복구 및 현재 MVP 로컬 검증 상태 정리

## 이번에 한 일

- `web/src/components/corkage/ReportForm.tsx`의 중복 import와 깨진 submit 상태 흐름을 복구했다.
- `web/src/components/corkage/ReviewQueue.tsx`의 중복 import와 candidate / existing 표시 문구를 정리했다.
- `web/src/components/corkage/ReportForm.test.tsx`와 `web/src/components/corkage/ReviewQueue.test.tsx`의 기대값을 현재 구현 의미와 맞췄다.
- `web/src/lib/repo/corkage-repo.test.ts`의 중복 필드 테스트 데이터를 정리했다.
- `README.md`에 existing store / candidate / canonical 반영 규칙이 현재 화면 동작과 맞도록 설명을 보강했다.
- OMX team runtime이 남긴 작업용 auto-checkpoint / merge 이력을 최종 Lore 형식 커밋으로 다시 정리했다.

## 최종 상태

- `/`, `/store`, `/store/[id]`, `/report`, `/review` 라우트가 모두 빌드 가능한 상태다.
- 로컬 제보 → 검수 → canonical 반영 목업 흐름이 현재 기준으로 다시 녹색 상태다.
- 테스트 14개가 모두 통과한다.

## 검증 결과

아래 명령 기준으로 확인했다.

1. `cd web && npm run build` → PASS
2. `cd web && npm run typecheck` → PASS
3. `cd web && npm run lint` → PASS
4. `cd web && npm run test` → PASS

검증 메모:

- 이 저장소는 `web/tsconfig.json`이 `.next/types/**/*.ts`를 포함한다.
- 그래서 `.next` 산출물이 없는 깨끗한 상태에서는 `typecheck`를 먼저 돌리면 실패할 수 있다.
- 안전한 순서는 `build -> typecheck -> lint -> test`다.

## 이번 작업에서 바뀐 파일

- `README.md`
- `web/src/components/corkage/ReportForm.tsx`
- `web/src/components/corkage/ReviewQueue.tsx`
- `web/src/components/corkage/ReportForm.test.tsx`
- `web/src/components/corkage/ReviewQueue.test.tsx`
- `web/src/lib/repo/corkage-repo.test.ts`

## 지금 기준으로 남은 할 일

### 1. 서버 저장으로 전환

- localStorage 기반 `report-drafts`, `canonical-overrides`를 서버 저장으로 바꿔야 한다.
- 최소 테이블 후보:
  - restaurants
  - corkage_records
  - user_reports
  - review_logs

### 2. canonical 공개 규칙 서버화

- accepted 시 어떤 필드만 canonical에 반영할지 서버 규칙으로 옮겨야 한다.
- existing store와 candidate의 반영 경계를 코드와 데이터 모델에서 고정해야 한다.

### 3. 데이터/API 경계 확정

- 네이버는 후보 탐색과 지도/지오코딩 보조로만 다뤄야 한다.
- 콜키지 사실 데이터는 자체 검증 데이터로 유지해야 한다.
- 다음 구현 전에 아래를 확정해야 한다.
  - Maps 사용 여부
  - Geocoding / Reverse Geocoding 사용 방식
  - Local Search를 내부 후보 탐색용으로만 둘지 여부

### 4. 운영자 검수 흐름 고도화

- `/review`를 실제 서버 데이터와 연결해야 한다.
- `pending / accepted / rejected / needs_follow_up` 전환 이력을 남겨야 한다.
- review note, reviewedAt, sourceType 반영 규칙을 서버 기준으로 정리해야 한다.

### 5. 지도는 그 다음 단계

- 현재 우선순위는 지도 추가가 아니다.
- 서버 저장과 canonical 반영 규칙이 먼저 닫힌 뒤에 지도 표시를 붙이는 것이 안전하다.

## 작업 기록 규칙

이번 파일부터 완료된 작업마다 `docs/task-updates/` 아래에 같은 형식의 md 파일을 추가한다.

권장 형식:

- 작업명
- 이번에 한 일
- 최종 상태
- 검증 결과
- 바뀐 파일
- 지금 기준으로 남은 할 일
