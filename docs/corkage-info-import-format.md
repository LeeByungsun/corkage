# Corkage Info Import Format

## 목적

사전 수집된 음식점 후보 DB에 콜키지 사실 정보를 덧입히는 operator import 포맷입니다.

NAVER place 후보는 `stores` 테이블에 먼저 적재하고, 콜키지 가능 여부/비용/조건은 검수 근거가 있는 row만 이 포맷으로 반영합니다.

## 실행

### 음식점 + NAVER 편의정보 통합 결과 적재

`docs/research_notes.md`의 `tool/getid/get_ids.js` 결과처럼 음식점 후보와
`corkageAllowed`, `corkageFee`, `facilities`가 함께 들어있는 JSON은
stores import 경로로 바로 적재합니다.

```bash
cd web
CORKAGE_IMPORT_VERIFIED_AT=2026-05-28 npm run db:import:stores -- ../tool/getid/results_경기도_화성시_청계동_음식점.json
```

이 경로는 `facilities` 중 `"콜키지"` 태그를 `rawFacilities`에 보존하고,
`콜키지 가능 (무료)`는 `available + free`, `콜키지 가능 (유료)`는
`available + 비용 문의 필요`, 태그 미검출은 `unavailable`로 정규화합니다.

### 도로명주소 기반 지역 정규화

도로명주소 import 결과가 `경기도 화성시 동탄구`처럼 구 단위에서 멈춘 경우,
도로명주소 검색API의 `siNm`, `sggNm`, `emdNm` 값을 기준으로 동 단위 district를
후속 보정합니다.

기본 실행은 dry-run입니다.

```bash
cd web
JUSO_CONFIRM_KEY=발급받은_도로명주소_API_승인키 npm run db:normalize:districts -- --limit=20
```

DB 반영은 결과를 검토한 뒤 `--apply`를 붙여 실행합니다.

```bash
cd web
JUSO_CONFIRM_KEY=발급받은_도로명주소_API_승인키 npm run db:normalize:districts -- --limit=20 --apply
```

정규화 스크립트는 아래 행을 우선 대상으로 삼습니다.

- 현재 `district`가 읍/면/동으로 끝나지 않는 행
- 주소에는 `화성시 동탄구`가 있으나 `district`에는 `동탄구`가 빠진 행

반영 시 `district` 외에 아래 추적 필드를 함께 기록합니다.

- `jibun_address`
- `legal_dong`
- `juso_adm_cd`
- `district_source = juso-search-api`
- `district_normalized_at`

### 콜키지 사실 정보만 후속 갱신

```bash
cd web
npm run db:import:corkage -- path/to/corkage-info.json
```

CSV도 같은 헤더로 지원합니다.

```bash
cd web
npm run db:import:corkage -- path/to/corkage-info.csv
```

기본 입력 파일명은 `web/corkage-info.json`입니다.

## JSON 예시

```json
[
  {
    "placeId": "1284360876",
    "corkageStatus": "available",
    "verifiedAt": "2026-05-28",
    "sourceType": "store_direct",
    "sourceNote": "매장 통화로 확인",
    "conditionNote": "와인 병당 15,000원, 최대 2병",
    "corkageFee": 15000,
    "feeUnit": "per_bottle",
    "bottleLimit": 2,
    "alcoholTypeLimit": "와인",
    "glassServiceAvailable": true,
    "memo": "운영자 1차 확인"
  }
]
```

또는 아래 형태도 가능합니다.

```json
{
  "records": [
    {
      "place_id": "1284360876",
      "corkage_status": "가능",
      "verified_at": "2026-05-28",
      "source_type": "store_direct",
      "source_note": "매장 통화로 확인"
    }
  ]
}
```

## 필수 필드

- `placeId` 또는 `place_id`
- `corkageStatus` 또는 `corkage_status`
- `verifiedAt` 또는 `verified_at`
- `sourceType` 또는 `source_type`
- `sourceNote` 또는 `source_note`

## 허용 값

### corkageStatus

- `available` 또는 `가능`
- `unavailable` 또는 `불가`
- `unknown` 또는 `확인중` / `미확인`

### sourceType

- `operator_verified`
- `store_direct`
- `user_report_reviewed`
- `public_web_reference`
- `partner_data`

### feeUnit

- `per_bottle` 또는 `병당`
- `per_table` 또는 `테이블당`
- `free` 또는 `무료`

## 보수적 공개 규칙

- import는 기존 `placeId`가 DB에 있을 때만 반영합니다.
- 없는 `placeId`는 skip하고 출력에 표시합니다.
- `sourceNote` 없이 콜키지 사실을 반영하지 않습니다.
- `verifiedAt`은 `YYYY-MM-DD` 형식이어야 합니다.
- 입력하지 않은 비용/병 수/주종/글라스 필드는 기존 DB 값을 유지합니다.
