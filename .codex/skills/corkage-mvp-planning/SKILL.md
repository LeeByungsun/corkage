---
name: corkage-mvp-planning
description: Cut the corkage service into a small, testable web MVP with explicit scope, geography, screens, filters, excluded features, and go or no-go gates. Use when deciding what to ship first, what to defer, and what must be true before implementation starts.
---

# Corkage MVP Planning

## Overview

처음부터 큰 서비스를 설계하지 않는다.

테스트 가능한 첫 버전을 짧고 운영 가능하게 자른다.

## Workflow

1. 먼저 아래 문서를 읽는다.
   - `docs/api-feasibility-and-product-plan.md`
   - `docs/agents-and-skills.md`
2. 지역 범위를 먼저 자른다.
3. 데이터 수집 방식을 먼저 고른다.
4. 첫 화면 수를 최소화한다.
5. 필수 필드와 필터만 남긴다.
6. 제외 기능을 명시한다.
7. 구현 착수 조건을 적는다.

## Default MVP Bias

기본값은 아래처럼 둔다.

- 지역: 서울 또는 서울 일부
- 데이터: 수동 검수형 또는 보수적인 반수동형
- 화면: 리스트, 상세, 제보, 지도 중 최소 세트
- 로그인: 초기 제외 가능
- 리뷰, 예약, 소셜 기능: 제외

## Decide These Items

### 1. Region

- 서울만
- 일부 구만
- 수도권

### 2. Data Acquisition

- 운영자 수동 등록
- 후보 수집 후 수동 검수
- 사용자 제보 후 검수

### 3. Core Screens

- 홈
- 리스트
- 상세
- 제보
- 관리자 입력
- 지도

### 4. Core Filters

- 콜키지 가능 여부
- 비용 구간
- 주종 제한
- 지역

### 5. Exclusions

초기 버전에서 하지 않을 것을 반드시 적는다.

## Preferred Output

한 페이지 안에 아래가 보여야 한다.

- 누구를 위한 서비스인가
- 첫 사용자 가치가 무엇인가
- 첫 버전에서 무엇을 하지 않을 것인가
- 구현을 시작해도 되는 조건이 무엇인가

## Done When

다른 사람이 읽어도 바로 아래를 말할 수 있으면 된다.

- 첫 출시 지역
- 첫 데이터 수집 방식
- 첫 화면 목록
- 첫 필터 목록
- 제외 기능 목록
