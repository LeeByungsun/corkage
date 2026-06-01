# Task Update - 2026-06-01

## 작업명

`/store` 무료/유료 색상 구분 및 동탄구 지역 전체 옵션 유지

## 배경

동탄구 콜키지 가능 매장 목록에서 무료와 유료 비용 문구가 같은 강조색으로 보여 구분이 약했다. 또한 기본 지역 선택 화면은 가능 매장이 있는 동만 기준으로 옵션을 만들 수 있어, 동탄구 전체 지역 선택지 노출이 데이터 상태에 따라 줄어들 수 있었다.

## 이번에 한 일

- 무료 비용 문구에 전용 green 계열 색상 클래스를 추가했다.
- 유료 및 유료 금액 미상 문구에 전용 rust 계열 색상 클래스를 추가했다.
- 기본 `/store` 지역 선택 옵션은 가능 매장 목록이 아니라 canonical 지역 목록을 우선 사용하게 했다.
- 가능 매장이 없는 동탄구 지역도 기본 지역 선택에서 유지되도록 테스트를 추가했다.
- 동탄구 외 지역은 지역 선택 옵션에서 제외하고, canonical 지역 목록이 비었을 때만 가능 매장 기준으로 fallback한다.

## 검증

- RED 확인: `npm test -- --run src/components/corkage/StoreCard.test.tsx src/components/corkage/StoreExplorer.test.tsx`에서 무료/유료 클래스와 능동 옵션 테스트 실패 확인
- GREEN 확인: `npm test -- --run src/components/corkage/StoreCard.test.tsx src/components/corkage/StoreExplorer.test.tsx`
- 전체 확인: `npm test`
- 타입 확인: `npm run typecheck`
- 린트 확인: `npm run lint`
- 빌드 확인: `npx -y node@22 node_modules/next/dist/bin/next build`
- Playwright smoke:
  - `/store` 기본 페이지에서 `기타`, `목동`, `여울동`, `영천동`, `오산동`, `청계동` 옵션 확인
  - `/store?district=경기도 화성시 동탄구 목동`에서 유료 색상 `rgb(154, 52, 18)`, 무료 색상 `rgb(35, 98, 47)` 확인
  - 스크린샷: `/tmp/corkage-store-fee-colors-dongtan-all.png`

## 남은 리스크

- 색상 대비는 브라우저 computed style 기준으로 확인했지만, 실제 사용자 선호 기반 색상 튜닝은 별도 디자인 QA가 필요하다.
- 지역 선택지는 현재 canonical DB에 존재하는 동탄구 지역을 기준으로 한다.
