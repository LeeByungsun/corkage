---
name: naver-web-crawling-feasibility
description: Assess whether crawling or non-official NAVER web data collection is acceptable for this project, separating technical possibility from policy, robots, anti-bot, maintenance, and business risk. Use when evaluating Playwright, Selenium, internal endpoints, or any plan to scrape map.naver.com or reuse NAVER web data.
---

# Naver Web Crawling Feasibility

## Overview

이 스킬은 `기술적으로 될 수 있나`와 `서비스로 채택해도 되나`를 분리해서 판단한다.

네이버 크롤링은 성공 여부보다 정책 적합성과 운영 안정성이 먼저다.

## Workflow

1. 먼저 아래 문서를 읽는다.
   - `docs/naver-web-crawling-feasibility.md`
   - `docs/research-web-crawling-qa-2026-05-18.md`
2. 검토 대상을 분리한다.
   - 공식 API
   - Playwright 네트워크 관찰
   - Selenium 또는 DOM 스크래핑
   - 내부 엔드포인트 직접 호출
3. 각 경로마다 아래를 적는다.
   - 얻을 수 있는 데이터
   - 필요한 인증 또는 세션
   - robots / 약관 / 정책 리스크
   - anti-bot 및 차단 리스크
   - 스키마 드리프트 리스크
   - MVP 보조 수단인지, 핵심 파이프라인 후보인지
4. 최종 판단을 `추천 / 제한적 보조 / 비추천`으로 내린다.

## Mandatory Framing

항상 아래 문장을 유지한다.

- `비공식 경로는 더 많은 필드를 준다고 해도 안정 계약이 아니다`
- `개인 실험 가능성과 서비스 운영 적합성은 다르다`
- `콜키지 서비스의 핵심 데이터는 자체 검증 체계가 필요하다`

## Preferred Conclusions

기본 결론은 아래 쪽으로 기운다.

- 공식 Local Search API는 후보 탐색 보조
- 비공식 크롤링은 운영자 조사 또는 seed 보강 정도
- 프로덕션 핵심 수집 파이프라인으로는 비추천

## Output Shape

각 수집 경로마다 아래 항목을 남긴다.

- 방식
- 장점
- 한계
- 정책 리스크
- 유지보수 리스크
- MVP 판단
- 프로덕션 판단

## Done When

아래 질문에 답할 수 있으면 된다.

- 왜 네이버 크롤링을 주 수집 파이프라인으로 쓰면 위험한가
- 비공식 경로가 허용된다면 어디까지 보조 수단인가
- 어떤 데이터는 반드시 자체 DB와 검수 체계로 가져가야 하는가
