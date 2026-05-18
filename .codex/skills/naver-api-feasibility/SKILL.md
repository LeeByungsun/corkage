---
name: naver-api-feasibility
description: Verify which official NAVER APIs are usable for the corkage project, what each returns, how auth and browser/server boundaries work, and whether each API belongs in MVP. Use when deciding Maps JavaScript API, Geocoding, Reverse Geocoding, or Local Search usage, or when updating feasibility docs before implementation.
---

# Naver API Feasibility

## Overview

네이버 공식 API로 이 프로젝트에서 어디까지 할 수 있는지 검증한다.

지도 축과 콜키지 데이터 축을 분리해서 판단한다.

## Workflow

1. 먼저 아래 문서를 읽는다.
   - `docs/api-feasibility-and-product-plan.md`
   - `docs/naver-local-search-checklist.md`
2. 공식 문서만 기준으로 후보 API를 나눈다.
   - 지도 표시
   - 주소/좌표 변환
   - 식당 후보 검색
3. 각 API마다 아래를 적는다.
   - 인증 방식
   - 브라우저 직접 호출 가능 여부
   - 서버 경유 필요 여부
   - 핵심 필드
   - 호출 제한
   - 정책 또는 구현상 제한
4. `사용 / 보류 / 제외`로 분류한다.
5. `콜키지 가능 여부`가 공식 API 필드인지 아닌지 분명히 적는다.
6. 문서 결론이 바뀌면 관련 문서를 함께 갱신한다.

## Required Separation

항상 아래를 분리해서 쓴다.

- `공식적으로 가능한 것`
- `문서로 확인되지 않은 것`
- `콜키지 정보라서 자체 데이터가 필요한 것`

`기본 식당 메타데이터`와 `콜키지 여부/비용/조건`를 같은 층위로 다루지 않는다.

## Preferred Output Shape

API별로 아래 항목을 남긴다.

- 이름
- 공식 문서 링크
- 인증 방식
- 브라우저 직접 호출 가능 여부
- 서버 경유 필요 여부
- 주요 필드
- 호출 제한
- MVP 필요도
- 제한 사항
- 최종 판단

## Done When

아래 질문에 짧게 답할 수 있으면 된다.

- 지도 표시는 어떤 API로 하는가
- 식당 후보 검색은 어떤 API로 하는가
- 주소/좌표 변환은 어떤 API로 하는가
- 콜키지 정보는 왜 별도 데이터인가
