# Corkage Webapp MVP Start Plan

작성일: 2026-05-18

## 목적

이 문서는 현재 `docs-first` 상태의 저장소에서 웹 MVP를 어디서부터 시작할지 고정하기 위한 시작 계획서입니다.

이 단계의 목표는 `무엇을 먼저 만들지`를 확정하는 것입니다.

## 현재 상태

현재 저장소는 아래 성격을 가집니다.

- 정책/기획/검증 문서가 먼저 정리됨
- 실행 가능한 Next.js 웹앱이 `web/` 아래에 이미 존재함
- 홈, 리스트, 상세, 제보, 검수 큐 라우트가 있음
- `lint / typecheck / test / build`까지 기본 검증 루프가 있음
- 다만 현재는 `제보 -> 검수 accepted -> canonical 반영`이 화면 전반에 완전히 연결되진 않았음

즉, 현재 구현 단계는 `0 -> 1 부트스트랩`이 아니라 `로컬 운영 흐름을 실제 화면에 붙이는 단계`입니다.

## 저장소 구조 결정

실행 가능한 앱은 루트가 아니라 `web/` 아래에 둡니다.

이유:

- 루트는 현재 문서/조정 공간으로 이미 쓰이고 있음
- `docs/`, `.codex/`, 검증 스크립트와 실행 코드 경계를 분리하기 쉬움
- 이후 앱 코드가 커져도 문서와 충돌이 적음

## 첫 구현 원칙

`지도보다 데이터 검증 흐름이 먼저`라는 기존 정책을 그대로 유지합니다.

따라서 첫 구현 순서는 아래입니다.

1. 타입과 seed 데이터
2. 리스트 화면
3. 상세 화면
4. 제보 화면
5. 지도 화면
6. PWA 보강

초기에는 지도 없이도 동작 가능한 MVP가 우선입니다.

## 첫 라우트 세트

첫 MVP에서 먼저 만드는 라우트는 아래를 권장합니다.

- `/`
- `/store`
- `/store/[id]`
- `/report`

### 각 라우트 의미

#### `/`

- 서비스 소개
- 현재 데이터 신뢰 원칙
- 바로 리스트로 진입하는 CTA

#### `/store`

- 콜키지 식당 리스트
- 상태/신뢰도/최신 확인일 표시
- 지역/비용/상태 필터

#### `/store/[id]`

- 식당 상세
- 콜키지 상태
- 비용/조건
- 최신 확인일
- 출처/신뢰도
- 주의 문구

#### `/report`

- 신규 제보
- 정보 수정 요청
- 증빙 메모/링크 입력

## 나중으로 미루는 것

아래는 첫 구현에서 명시적으로 뒤로 미룹니다.

- 지도 중심 메인 UX
- Naver 기반 자동 수집 파이프라인
- 실시간성처럼 보이는 기능
- 관리자 대시보드 정식 UI
- 로그인
- 리뷰/커뮤니티
- PWA 오프라인/설치 최적화
- E2E 테스트

## 최소 부트스트랩 파일

첫 구현 슬라이스에서 먼저 만드는 파일은 아래입니다.

### 앱 부트스트랩

- `web/package.json`
- `web/tsconfig.json`
- `web/next.config.ts`
- `web/next-env.d.ts`

### 앱 기본 구조

- `web/src/app/layout.tsx`
- `web/src/app/page.tsx`
- `web/src/app/globals.css`

### 데이터와 타입

- `web/src/lib/types/corkage.ts`
- `web/src/lib/data/corkage-seed.ts`
- `web/src/lib/repo/corkage-repo.ts`

### 첫 화면 컴포넌트

- `web/src/components/corkage/StoreCard.tsx`
- `web/src/components/corkage/StoreList.tsx`
- `web/src/components/corkage/TrustBadge.tsx`

### 첫 라우트

- `web/src/app/store/page.tsx`
- `web/src/app/store/[id]/page.tsx`
- `web/src/app/report/page.tsx`

## 최소 툴링

처음에는 최소 구성만 둡니다.

### 바로 필요한 것

- Next.js
- React
- TypeScript
- ESLint

### 바로 없어도 되는 것

- Vitest
- Playwright
- Storybook
- 복잡한 상태관리 라이브러리

테스트 러너는 화면과 데이터 흐름이 실제로 생긴 뒤 붙이는 편이 낫습니다.

## 첫 구현 마일스톤

첫 마일스톤은 아래로 정의합니다.

### Foundation Slice

`검증된 seed 데이터로 리스트/상세/신뢰도 표시가 가능한 정적 웹앱 기본형`

이 마일스톤에서 되는 것:

- 앱 부트스트랩
- seed 데이터 렌더링
- 식당 리스트 조회
- 상세 진입
- 신뢰도/최신 확인일/상태 배지 표시

이 마일스톤에서 아직 안 하는 것:

- 외부 API 연동
- 지도
- 관리자 검수 UI
- 실제 제보 저장

## 구현 전에 이미 확정된 전제

아래는 구현 중 다시 뒤집지 않습니다.

- 네이버는 주 데이터 소스가 아님
- 콜키지 정보는 자체 검증 데이터로 관리
- 제보는 canonical 데이터를 바로 덮지 않음
- stale 정보는 `정보 오래됨`으로 표시

## 다음 액션

바로 다음 구현 액션은 이것입니다.

1. accepted 검수 결과를 로컬 canonical 상태로 저장
2. `/store`와 `/store/[id]`가 그 canonical 상태를 실제로 읽도록 연결
3. 홈 seed 현황 카드도 같은 canonical 기준으로 갱신
4. `report -> review -> canonical 반영` 흐름을 브라우저 로컬 목업 기준으로 닫기
5. 그 다음에만 서버 저장, 지도, 외부 API 연결 순서를 다시 연다

## 최종 판단

`corkage-webapp-mvp`의 현재 다음 slice는 `지도 추가`가 아니라 `accepted 검수 결과가 실제 canonical 화면 상태에 반영되는 로컬 운영 흐름`을 먼저 완성하는 것입니다.
