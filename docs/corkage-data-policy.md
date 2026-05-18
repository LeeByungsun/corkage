# Corkage Data Policy

작성일: 2026-05-18

## 목적

이 문서는 `콜키지 가능한 식당` 서비스에서 어떤 데이터를 저장하고, 어떤 기준으로 검수하고, 어떤 형태로 사용자에게 표시할지 확정하기 위한 기준 문서입니다.

이 프로젝트에서 가장 중요한 것은 `지도 표시`보다 `콜키지 정보의 신뢰도`입니다.

따라서 이 문서는 아래를 명확히 합니다.

1. 어떤 필드를 저장하는가
2. 어떤 값만 공개 가능한가
3. 사용자 제보가 어떻게 canonical 데이터가 되는가
4. 오래된 정보와 불확실한 정보를 어떻게 처리하는가

## 전제

- 네이버 공식 API와 네이버 웹 크롤링은 `공개용 식당 DB의 주 데이터 소스`로 쓰지 않는다.
- 식당 기본 정보와 콜키지 정보는 같은 레코드에 있더라도 `다른 검증 규칙`으로 관리한다.
- 사용자 제보는 `사실`이 아니라 `검수 전 이벤트`로 저장한다.
- 불확실한 정보는 과장하지 않고 보수적으로 표기한다.

## 데이터 엔티티

정책상 아래 3개를 분리해서 본다.

### 1. 식당 기본 정보

지도와 탐색에 필요한 기본 메타데이터입니다.

예:

- 식당명
- 주소
- 좌표
- 카테고리
- 전화번호
- 외부 참고 링크

### 2. 콜키지 canonical 정보

서비스가 사용자에게 `현재 기준으로 보여주는 공식 상태`입니다.

예:

- 콜키지 가능 여부
- 비용
- 병 수 제한
- 주종 제한
- 특이 조건
- 최신 확인일
- 출처
- 신뢰도

### 3. 사용자 제보 / 운영 이벤트

canonical 데이터를 직접 덮지 않는 입력 기록입니다.

예:

- 신규 식당 제보
- 콜키지 가능/불가 수정 제보
- 비용/조건 변경 제보
- 오래된 정보 신고

## canonical 레코드 기준

### 기본 식당 필드

최소 권장 필드:

- `placeId`
- `name`
- `address`
- `roadAddress`
- `lat`
- `lng`
- `category`

선택 필드:

- `phone`
- `websiteUrl`
- `externalReferenceUrl`
- `memo`

기본 식당 필드는 `식당이 어디 있는가`를 설명합니다.

콜키지 여부와 비용은 여기에 섞어 해석하지 않습니다.

### 콜키지 필드

최소 권장 필드:

- `corkageStatus`
- `freshnessState`
- `confidenceLabel`
- `verifiedAt`
- `sourceType`
- `sourceNote`
- `conditionNote`

조건부 필드:

- `corkageFee`
- `feeUnit`
- `bottleLimit`
- `alcoholTypeLimit`
- `glassServiceAvailable`

운영용 내부 필드:

- `reviewedBy`
- `reviewedAt`
- `internalReviewNote`

## 상태 체계

`공개 상태`와 `검수 상태`를 섞지 않기 위해 2단계로 나눕니다.

### 1. corkageStatus

canonical 사실값입니다.

- `available`
- `unavailable`
- `unknown`

설명:

- `available`: 현재 기준으로 콜키지가 가능하다고 검수됨
- `unavailable`: 현재 기준으로 콜키지가 불가하다고 검수됨
- `unknown`: 아직 확정할 근거가 부족함

### 2. freshnessState

정보 최신성 상태입니다.

- `fresh`
- `stale`

설명:

- `fresh`: 현재 허용된 최신성 기준 안에 있음
- `stale`: 마지막 확인일이 기준을 넘었음

### 3. 사용자 표시용 파생 상태

사용자에게는 아래처럼 보여줍니다.

- `available + fresh` → `가능`
- `unavailable + fresh` → `불가`
- `unknown` → `확인중`
- `available/unavailable + stale` → `정보 오래됨`

이렇게 분리해야 `예전엔 가능했지만 지금은 오래된 정보`를 표현할 수 있습니다.

## 출처 체계

`sourceType`은 아래 중 하나로 제한합니다.

- `operator_verified`
- `store_direct`
- `user_report_reviewed`
- `public_web_reference`
- `partner_data`

설명:

- `operator_verified`: 운영자가 직접 현장/통화/명시 자료로 확인
- `store_direct`: 매장 측이 직접 알려준 정보
- `user_report_reviewed`: 사용자 제보를 검수 후 반영
- `public_web_reference`: 공개 웹 정보 참고
- `partner_data`: 제휴 또는 명시적으로 허용된 외부 데이터

중요:

- `public_web_reference`만으로는 가장 보수적으로 취급합니다.
- `user_report`는 검수 전까지 `sourceType`이 아니라 별도 이벤트로만 저장합니다.

## 신뢰도 체계

`confidenceLabel`은 아래 중 하나로 제한합니다.

- `high`
- `medium`
- `low`

권장 기준:

### high

- `operator_verified` 또는 `store_direct`
- 확인 시점이 freshness 기준 안

### medium

- `user_report_reviewed`
- 또는 `public_web_reference`이지만 운영자 보완 검토가 있음

### low

- 공개 웹 참고만 있음
- 근거가 1건뿐이거나 오래됐음

정책:

- `low` 정보는 공개할 수 있어도 강한 주의 문구를 붙입니다.
- `low + stale`이면 비용/세부 조건은 숨기거나 약하게만 표시합니다.

## 최신성 기준

기본 freshness 기준은 아래로 둡니다.

- `operator_verified` / `store_direct`: 90일
- `user_report_reviewed`: 30일
- `public_web_reference`: 14일
- `partner_data`: 계약 또는 공급 주기 기준

기준을 넘으면:

- `freshnessState = stale`
- 사용자 표시 상태는 `정보 오래됨`
- `verifiedAt`는 그대로 유지
- 마지막으로 무엇을 근거로 봤는지 `sourceNote`를 유지

## 비용과 조건 공개 규칙

### 공개 가능한 경우

아래를 모두 만족하면 비용과 조건을 공개합니다.

- `corkageStatus != unknown`
- `freshnessState = fresh`
- `confidenceLabel = high` 또는 `medium`

### 보수적으로 공개하는 경우

아래 중 하나면 주의 문구와 함께 공개합니다.

- `confidenceLabel = low`
- `freshnessState = stale`

이 경우:

- `정확하지 않을 수 있음`
- `매장 확인 필요`

문구를 함께 표시합니다.

### 숨기거나 약하게 표시하는 경우

아래면 비용/세부 조건은 강하게 노출하지 않습니다.

- `corkageStatus = unknown`
- 근거가 사용자 제보 1건뿐인데 검수 전
- 공개 웹 참고만 있고 확인일이 오래됨

## 사용자 제보 정책

사용자 제보는 canonical 레코드와 분리합니다.

### report 엔티티 최소 필드

- `reportId`
- `placeId` 또는 `placeCandidateText`
- `reportedStatus`
- `reportedFee`
- `reportedConditionNote`
- `reporterNote`
- `reportedAt`
- `evidenceUrl` 또는 `evidenceNote`
- `reviewState`

### reviewState

- `pending`
- `accepted`
- `rejected`
- `needs_follow_up`

정책:

- `pending` 제보는 사용자에게 사실처럼 보이지 않게 합니다.
- 제보는 canonical 데이터를 자동으로 덮지 않습니다.
- `accepted` 후에만 canonical 레코드가 갱신됩니다.

## 관리자 검수 정책

### accepted 기준

아래 중 하나 이상이면 반영 가능합니다.

- 운영자 직접 확인
- 매장 직접 확인
- 사용자 제보 + 증빙 + 운영자 검토
- 명시 허용된 제휴 데이터

### rejected 기준

아래면 반려합니다.

- 출처 불명
- 광고/홍보성
- 날짜 없음
- 다른 최근 근거와 충돌하지만 보완 설명 없음

### needs_follow_up 기준

아래면 보류합니다.

- 상태는 주장하지만 비용/조건 근거가 약함
- 제보 내용이 일부만 맞을 가능성이 높음
- 최신성은 있으나 증빙이 부족함

## 사용자 표시 규칙

공개 화면에서는 최소 아래를 보여줍니다.

- 사용자 상태 배지
- 최신 확인일
- 간단한 출처 요약
- 필요 시 주의 문구

권장 표시 예:

- `가능 · 2026-05-10 확인`
- `정보 오래됨 · 2026-01-12 확인`
- `확인중 · 제보 검토 중`

### 반드시 피할 것

- 검수 전 제보를 사실처럼 표시
- 오래된 정보를 현재 확정 사실처럼 표시
- 출처 없는 비용 정보를 강하게 노출
- `실시간`처럼 오해될 문구 사용

## MVP 기본 정책

초기 MVP는 아래 기본값을 사용합니다.

- canonical 공개는 `reviewed` 정보만
- 사용자 제보는 `pending` 저장 후 관리자 검수
- `public_web_reference` 단독 근거는 보수적으로만 반영
- stale 정보는 삭제하지 않고 `정보 오래됨`으로 전환
- 네이버 데이터는 운영자 참고 수준으로만 사용

## 다음 단계에서 바로 써도 되는 결정

아래는 확정으로 보고 진행합니다.

- canonical 식당 데이터와 사용자 제보를 분리한다
- 공개 상태는 `corkageStatus`와 `freshnessState`를 조합해 만든다
- 신뢰도는 `high / medium / low`로 고정한다
- 검수 전 제보는 canonical 데이터를 덮지 않는다
- 오래된 정보는 숨기기보다 `정보 오래됨`으로 표기한다

## 최종 판단

이 프로젝트의 데이터 정책은 `많이 모으는 것`보다 `보수적으로 검수하고 명확히 표기하는 것`을 우선합니다.

즉:

- 데이터는 적어도 된다
- 출처와 최신성은 반드시 보여준다
- 불확실하면 `확인중` 또는 `정보 오래됨`으로 내린다
- 사용자 제보는 입력 채널이지 곧바로 사실이 아니다
