---
name: corkage-data-policy
description: Define or revise the corkage data model, verification states, source taxonomy, freshness rules, and public display policy for this project. Use when deciding how to store corkage availability, fees, conditions, verified dates, confidence labels, operator review rules, or user reports.
---

# Corkage Data Policy

## Overview

콜키지 서비스의 핵심은 지도보다 데이터 신뢰도다.

이 스킬은 무엇을 저장하고, 어떻게 검수하고, 사용자에게 어떻게 보여줄지 정한다.

## Workflow

1. 먼저 현재 기획 문서를 읽는다.
   - `docs/api-feasibility-and-product-plan.md`
   - 필요하면 `docs/naver-web-crawling-feasibility.md`
2. 아래를 분리해서 정한다.
   - 식당 기본 정보
   - 콜키지 정보
   - 출처 정보
   - 최신 확인 정보
3. 상태값을 정의한다.
4. 출처 유형을 정의한다.
5. 공개 규칙과 경고 문구를 정의한다.
6. 오래된 정보와 불확실한 정보 처리 규칙을 정의한다.

## Minimum Recommended Fields

- 식당명
- 주소
- 좌표
- corkageStatus
- corkageFee
- bottleLimit
- alcoholTypeLimit
- conditionNote
- verifiedAt
- sourceType
- sourceNote
- confidenceLabel

## Minimum Recommended States

- 가능
- 불가
- 확인중
- 정보오래됨

상태는 삭제보다 보수적으로 유지한다.

## Source Rules

출처는 최소 아래 중 하나로 남긴다.

- 운영자 직접 확인
- 매장 직접 확인
- 사용자 제보
- 웹 공개 정보 참고

출처가 없으면 공개 여부를 따로 판단한다.

## Display Rules

항상 아래를 고려한다.

- 마지막 확인일을 보여줄지
- 불확실함을 어떻게 표시할지
- 비용과 조건을 구조화 필드 + 메모로 함께 둘지
- 사용자 제보를 즉시 공개할지 검수 후 공개할지

## Done When

아래 질문에 답할 수 있으면 된다.

- 이 정보는 어디서 왔는가
- 언제 마지막으로 확인했는가
- 틀릴 가능성이 있으면 어떻게 표시하는가
- 사용자 제보는 어떤 과정을 거쳐 공개되는가
