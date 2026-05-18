---
name: corkage-webapp-mvp
description: Implement or refine the corkage mobile-first web MVP after feasibility, data policy, and MVP scope decisions exist. Use when building or revising Next.js or PWA screens, route structure, list/detail/map flows, submission forms, or lightweight admin tools while keeping verification-first product constraints.
---

# Corkage Webapp MVP

## Overview

이 스킬은 검증이 끝난 범위 안에서 웹 MVP를 실제로 만드는 단계에 쓴다.

데이터 검증 흐름이 UI보다 먼저라는 전제를 유지한다.

## Start Gate

아래가 비어 있으면 먼저 구현보다 문서 정리를 우선한다.

- 사용할 NAVER API 결정
- 자체 데이터 정책 결정
- MVP 지역 범위 결정
- 핵심 필터와 상세 필드 결정

## Preferred Build Order

구현은 아래 순서를 기본으로 둔다.

1. 데이터 타입과 상태 정의
2. 리스트 화면
3. 상세 화면
4. 제보 또는 관리자 입력 화면
5. 지도 화면
6. PWA 설치성 보강

지도는 핵심 데이터 흐름이 잡힌 뒤에 붙인다.

## Workflow

1. 먼저 아래 문서를 읽는다.
   - `docs/api-feasibility-and-product-plan.md`
   - `docs/naver-local-search-checklist.md`
   - 필요하면 `docs/naver-web-crawling-feasibility.md`
2. 현재 구현이 문서 범위를 넘지 않는지 확인한다.
3. 화면 하나 또는 흐름 하나만 잡아서 구현한다.
4. 새 추상화보다 단순한 구조를 우선한다.
5. 검증 가능한 상태 문구와 최신 확인 표시를 빠뜨리지 않는다.

## Preferred Product Shape

- 모바일 퍼스트
- 웹앱 우선
- 설치 가능하면 PWA
- 리스트와 상세가 기본
- 지도는 보조 탐색 수단
- 사용자 제보는 검수 전제

## Avoid

- 실시간성처럼 보이는 과장
- 출처 없는 콜키지 정보 노출
- 검증 없는 즉시 공개 제보
- 지도만 먼저 화려하게 만드는 구조
- 비공식 크롤링 전제 구현

## Done When

아래를 증명할 수 있으면 된다.

- 사용자가 검증된 식당 정보를 찾을 수 있다
- 콜키지 상태와 최신 확인일을 읽을 수 있다
- 제보 또는 수정 요청 흐름이 있다
- 구현이 현재 문서 범위를 넘지 않는다
