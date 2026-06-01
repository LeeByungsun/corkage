# Task Update - 2026-06-01

## 작업명

`/store` 동탄구 전체 법정동 선택지 확장

## 배경

기본 `/store` 지역 선택이 현재 DB나 가능 매장이 있는 동 위주로 보일 수 있어 송동, 장지동, 방교동처럼 아직 가능 매장이 없거나 적재가 부족한 동이 빠져 보였다.

## 이번에 한 일

- 동탄구 현재 법정동 선택지 목록을 앱 상수로 분리했다.
- 기본 `/store` 선택지에 아래 동을 항상 노출한다.
  - 반송동, 석우동, 능동, 청계동, 영천동, 중동, 여울동, 방교동, 금곡동, 송동, 산척동, 장지동, 목동, 신동
- 기존 coarse district 데이터용 `기타` 선택지는 동 목록 뒤에 유지했다.
- 2026년 기준 기존 `오산동`은 선택지에서 제거하고 `여울동`으로 정규화한다.
- 과거 `오산동` 링크나 DB 값은 `여울동`으로 접어 기존 링크가 깨지지 않게 했다.

## 확인 근거

- 화성시 동탄구청 행정복지센터 기본현황 기준 동탄4동 `청계동`, 동탄5동 `영천동, 중동`, 동탄6동 `여울동, 방교동, 금곡동`, 동탄7동 `송동, 산척동`, 동탄8동 `장지동`, 동탄9동 `목동, 신동`을 반영했다.
- 동탄1동은 `반송동, 석우동` 공식 기본현황을 반영했다.
- 동탄3동은 현재 프로젝트에서 이미 쓰는 `능동`을 유지했다.
- `오산동`은 2026년 3월 이후 `여울동`으로 취급한다.

## 검증

- RED 확인: `npm test -- --run src/lib/repo/corkage-repo.test.ts src/components/corkage/StoreExplorer.test.tsx`에서 전체 동 목록/오산동 정규화/기본 옵션 테스트 실패 확인
- GREEN 확인: `npm test -- --run src/lib/repo/corkage-repo.test.ts src/components/corkage/StoreExplorer.test.tsx`
- 전체 테스트: `npm test`
- 타입 확인: `npm run typecheck`
- 린트 확인: `npm run lint`
- 빌드 확인: `npx -y node@22 node_modules/next/dist/bin/next build`
- Playwright smoke:
  - `/store` 기본 선택지에서 송동, 장지동, 방교동 포함 전체 동 확인
  - `/store?district=경기도 화성시 동탄구 송동` 선택 결과 헤더 확인
  - `/store?district=경기도 화성시 동탄구 오산동`이 `동탄구 여울동`으로 표시되는지 확인
  - 스크린샷: `/tmp/corkage-dongtan-all-dongs-final.png`

## 남은 리스크

- 동탄2동의 법정동 세부 표기는 공식 기본현황 페이지가 통/반만 노출해 현재 동탄권 법정동 목록과 기존 프로젝트 정규화 기준으로 보수적으로 유지했다.
- 향후 화성시 행정구역 표기가 또 바뀌면 `listDongtanLegalDistricts` 상수를 갱신해야 한다.
