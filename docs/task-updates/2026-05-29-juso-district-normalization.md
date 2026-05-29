# Task Update - 2026-05-29

## 작업명

도로명주소 검색API 기준 지역 정규화 작업 경로 추가

## 배경

이전 DB 분석에서 `경기도 화성시 동탄구`로만 묶인 식당이 20개 있었다.
원인은 import 추론 로직이 도로명 주소의 `동탄대로`, `동탄대로시범길`을 만나는 순간
동 토큰을 더 이상 찾지 못했기 때문이다.

도로명 문자열을 임의로 동에 매핑하는 방식은 위험하다.
이번 작업은 공식 도로명주소 검색API 응답의 행정 필드(`siNm`, `sggNm`, `emdNm`)를
기준으로 `stores.district`를 보정하는 경로를 추가했다.

## 이번에 한 일

- `district-normalization` 순수 함수를 추가했다.
  - Juso 응답에서 `경기도 화성시 동탄구 청계동` 형태의 district를 만든다.
  - 구 단위에 멈춘 도로명 주소 행을 정규화 대상으로 판별한다.
  - noisy 상세주소에서 전체 검색어와 도로명+건물번호 검색어를 만든다.
- `npm run db:normalize:districts` 스크립트를 추가했다.
  - 기본은 dry-run이다.
  - `--apply`가 있을 때만 DB를 수정한다.
  - `JUSO_CONFIRM_KEY` 또는 `JUSO_API_KEY` 환경변수가 필요하다.
- 현재 DB 기준 정규화 우선 대상은 20개로 판별된다.
- 정규화 반영 시 추적 컬럼을 함께 남기도록 했다.
  - `jibun_address`
  - `legal_dong`
  - `juso_adm_cd`
  - `district_source`
  - `district_normalized_at`
- import 문서에 실행 방법과 정책을 추가했다.

## 사용 명령

Dry-run:

```bash
cd web
JUSO_CONFIRM_KEY=발급받은_도로명주소_API_승인키 npm run db:normalize:districts -- --limit=20
```

DB 반영:

```bash
cd web
JUSO_CONFIRM_KEY=발급받은_도로명주소_API_승인키 npm run db:normalize:districts -- --limit=20 --apply
```

## 검증

- `npm test -- --run src/lib/server/district-normalization.test.ts`
- `node --check scripts/normalize-store-districts.mjs`
- `npm run db:normalize:districts -- --help`
- 승인키 없는 실행이 명확한 환경변수 안내와 함께 실패하는지 확인

## 남은 리스크

- 현재 로컬 환경에는 `JUSO_CONFIRM_KEY`가 없어 실제 API dry-run은 수행하지 않았다.
- 승인키를 넣고 dry-run 결과를 사람이 확인한 뒤에만 `--apply`를 실행해야 한다.
- 도로명주소 검색API 결과가 여러 개인 경우 첫 exact road-address 후보를 우선한다. 애매한 행은 `MISS` 또는 dry-run 출력으로 검토해야 한다.
