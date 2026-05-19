# Naver Feasibility Verification - 2026-05-18

## 목적

이 문서는 현재 저장소의 네이버 관련 결론이 `2026-05-18` 기준으로 여전히 맞는지 다시 검증한 기록입니다.

검증 대상은 아래 3개입니다.

1. `docs/api-feasibility-and-product-plan.md`
2. `docs/naver-local-search-checklist.md`
3. `docs/naver-web-crawling-feasibility.md`

## 2026-04-16 공지 재확인 요약

- 2026-04-16 공지는 NAVER 지도 계열의 종료 일정을 다시 확인하게 만든 기준점입니다.
- 종료 시점은 `2026-06-25 18:00 KST`로 본다.
- 종료 범위는 `Web Dynamic Map(JS v3)`, `Static Map`, `Geocoding`, `Reverse Geocoding`을 포함하는 지도 계열로 본다.
- 따라서 현재 저장소에서는 이 묶음을 장기 고정 계약으로 두지 않고, `NAVER Cloud Platform Maps`의 standalone 경로와 `Services > Application Services > Maps` 콘솔 경로를 대체안으로 본다.
- 자동 수집 기준으로는 2026-04-16 공지의 본문 body를 직접 읽지 못했다. 종료 시점과 범위는 `공지 메타데이터 + 현재 공식 Maps 문서 + worker findings`를 합쳐 문서 전제에 반영한다.

## 검증 범위

- 공식 Local Search API가 실제로 어디까지 반환하는지
- 공식 약관/FAQ/정책이 현재 문서 결론과 충돌하지 않는지
- `네이버 웹/내부 API 크롤링 비추천` 결론이 여전히 타당한지
- `2026-04-16` 지도 API 종료 공지와 standalone Maps 전환 경로를 현재 문서 전제에 반영해도 되는지

## 공식 근거 재확인

### 1. Local Search API

출처:

- https://developers.naver.com/docs/serviceapi/search/local/local.md

재확인 내용:

- 요청 URL은 `https://openapi.naver.com/v1/search/local.json`
- 문서 파라미터 표는 `display` 최댓값 `5`, `start` 최댓값 `1`로 적고 있음
- 응답 필드는 `title`, `link`, `category`, `description`, `telephone`, `address`, `roadAddress`, `mapx`, `mapy`
- `telephone`은 `값을 반환하지 않는 요소`로 명시됨
- `link`는 `업체, 기관의 상세 정보 URL`로 설명되지만 예시 응답은 빈 값임
- 공개 문서 안에서 `place detail JSON 재조회 전용 공식 API`는 확인되지 않음

판단:

- `후보 검색 결과 API`라는 현재 문서 결론은 유지
- 상세 place API로 확장되는 안정 계약은 현재도 확인되지 않음

### 2. NAVER Developers FAQ

출처:

- https://developers.naver.com/products/intro/faq/faq.md

재확인 내용:

- AJAX/XHR로 브라우저에서 직접 호출하면 same-origin 문제로 결과를 받지 못할 수 있다고 안내함
- `검색결과를 보여주는 서비스` 또는 `네이버와 유사한 검색서비스`에서 검색 API 결과를 상업적 목적으로 사용할 수 없다고 안내함

판단:

- 현재 저장소 문서의 `서버 경유 호출 전제`는 유지
- 상업적 제품 소스로서의 보수적 판단도 유지

### 3. NAVER API 서비스 이용약관 / 개정 공지

출처:

- https://developers.naver.com/products/intro/terms/terms.md
- https://developers.naver.com/notice/article/21979
- https://developers.naver.com/notice/article/7540

재확인 내용:

- 약관은 `네이버 지역정보를 수집하여 별도 데이터베이스로 관리하며 이용하는 행위`를 금지 예시로 둠
- 개정 공지는 사전 승인 없는 자동화 수단(스크립트, 매크로, 봇, 크롤러 등)의 주기적/반복적 접근을 금지함
- 지도 Open API 이관 공지는 네이버 개발자센터 대신 NAVER Cloud Platform Maps로 옮겨가는 경로를 공식화함

판단:

- `지역 검색 API -> 자체 식당 DB 영속 적재`를 기본 전략으로 두기 어렵다는 결론은 유지
- `API 키 기반 자동 수집`도 정책 리스크가 큼

### 4. 네이버 서비스 이용약관 / 검색결과 수집 정책 / robots

출처:

- https://policy.naver.com/policy/service.html
- https://policy.naver.com/policy/search_policy.html
- https://map.naver.com/robots.txt

재확인 내용:

- 네이버 서비스 이용약관은 사전 허락 없는 자동화 수단(로봇, 스파이더, 스크래퍼 등) 사용을 금지함
- 검색결과 수집 정책은 robots.txt 등 보호 장치를 무시한 수집에 대해 법적 책임 가능성을 안내함
- `https://map.naver.com/robots.txt`는 현재 `User-agent: *`에 대해 `Disallow: /`를 반환하며 `/` 루트와 `/p/` 정도만 예외 허용함

판단:

- 네이버 웹 크롤링을 운영 기본 파이프라인으로 두지 말아야 한다는 결론은 더 강해짐

### 5. 2026-04-16 공지와 2026-06-25 18:00 KST 종료 범위

출처:

- 2026-04-16 공지의 worker findings
- 네이버 지도 Open API 종료 및 이관 공지 계열

재확인 내용:

- 종료 시점은 `2026-06-25 18:00 KST`로 안내됨
- 종료 범위는 `Web Dynamic Map(JS v3)`, `Static Map`, `Geocoding`, `Reverse Geocoding`이다
- 대체 경로는 `standalone Maps` 계열, 즉 네이버 클라우드 플랫폼 Maps/Enterprise API 이관이다
- 자동 수집 과정에서는 일부 공지 본문이 `body-unavailable`로 내려와, 제목/스니펫/미러 문구를 함께 대조해야 했다

판단:

- 이전부터 문서에 있던 Maps 계열 이관 결론은 유지하되, 이제는 종료 시점과 종료 범위를 더 분명하게 적어야 한다
- `Web Dynamic Map(JS v3)`는 별도 예외가 아니라 종료 범위 안에 포함해 적는 편이 안전하다
- `standalone Maps`를 대체 경로로 같이 적어야 이후 벤더 선택 문서와 충돌하지 않는다

## 라이브 API 검증

검증 스크립트:

- `scripts/verify_naver_local_search_live.py`

실행 명령:

```bash
python3 scripts/verify_naver_local_search_live.py
```

실행 전제:

- `.env.local`에 `NAVER_CLIENT_ID`, `NAVER_CLIENT_SECRET` 존재
- 호출 헤더는 `Accept: */*`

### 요약 결과

#### case 1

- query: `강남 와인바`
- request: `display=5&start=1&sort=random`
- 결과: `200 OK`
- 응답 메타: `display=5`, `start=1`
- `telephone`: 전부 빈 문자열
- `link`: 외부 URL이 섞여 들어옴

#### case 2

- query: `강남 와인바`
- request: `display=10&start=1&sort=random`
- 결과: `200 OK`
- 응답 메타: 다시 `display=5`

#### case 3

- query: `강남 와인바`
- request: `display=5&start=2&sort=random`
- 결과: `200 OK`
- 응답 메타: 다시 `start=1`

#### case 4

- query: `콜키지 와인바`
- request: `display=5&start=1&sort=comment`
- 결과: `200 OK`
- 응답 메타: `display=5`, `start=1`
- `telephone`: 전부 빈 문자열
- `link`: Naver URL, 외부 URL이 혼합됨

## 현재 문서와의 일치 여부

### 유지되는 결론

- `지역 검색은 후보 수집용`이라는 결론
- `상세 place JSON 재조회 공식 API는 확인되지 않음`이라는 결론
- `telephone`는 사실상 비어 있다고 봐야 한다는 결론
- `link`는 안정적인 상세 연동 키로 보기 어렵다는 결론
- `네이버 웹/내부 API 크롤링은 서비스 핵심 수집 경로로 비추천`이라는 결론

### 새로 더 분명해진 점

- 현재 실호출에서도 `display=10` 요청이 `display=5`로 정규화됨
- 현재 실호출에서도 `start=2` 요청이 `start=1`로 정규화됨
- 따라서 현재 시점에서는 `실질적으로 5건 단일 페이지형 후보 탐색 API`처럼 다루는 편이 안전함
- `map.naver.com/robots.txt`는 현재 일반 크롤링에 매우 보수적인 상태임
- `2026-04-16` 공지는 제목/등록일은 확인되지만 자동 수집에서는 본문 body를 직접 읽지 못하는 caveat가 있음

## 검증 체크

- PASS: 공식 Local Search 문서와 현재 저장소 결론이 일치함
- PASS: 공식 약관/FAQ/정책과 현재 저장소의 보수적 제품 판단이 일치함
- PASS: 라이브 API 호출이 문서화된 핵심 한계(`telephone`, `display`, `start`, `link`)를 재현함
- PASS: `map.naver.com/robots.txt` 확인 결과 현재 크롤링 친화적 상태가 아님
- PASS: 2026-04-16 공지와 2026-06-25 18:00 KST 종료 범위가 Maps 계열 종료 문맥과 일치함
- PASS: `scripts/verify_naver_local_search_live.py`를 통해 같은 검증을 반복 실행할 수 있게 됨
- PASS: `2026-04-16` 공지의 종료 시점, 종료 범위, standalone Maps 대체 경로, body-unavailable caveat 를 현재 문서 전제에 반영함

## 저장소 검증 메모

- 현재 저장소에는 `package.json`, `tsconfig.json`, `eslint` 설정, 테스트 러너 설정이 없음
- 따라서 이번 작업의 `test and verify`는 앱 빌드 검증이 아니라 `공식 문서 재확인 + 라이브 API 재현 + robots/정책 재확인` 중심으로 수행함

## 다음 단계 의사결정 가능 여부

- `네이버를 주 데이터 소스로 쓰지 않는다`
- `콜키지 정보는 자체 검증 데이터로 분리한다`
- `네이버 웹/내부 API 크롤링을 운영 기본 경로로 채택하지 않는다`
- `지도/지오코딩 레이어는 standalone Maps 대체 경로를 기준으로 재선정한다`

위 3가지는 현재 문서만으로도 다음 단계 제품 판단을 내려도 됩니다.

`2026-06-25 18:00 KST` 종료 시점은 지금 문서의 전제에 반영해도 됩니다.
이제 남는 의사결정은 `legacy AI NAVER API 지도 묶음`을 어디까지 걷어내고 `standalone Maps`를 어디에 적용할지의 구현 범위 조정입니다.

## 최종 판단

`2026-05-18` 기준으로 현재 저장소의 네이버 관련 핵심 결론은 유지해도 됩니다.

가장 중요한 판단은 아래입니다.

- 네이버 공식 API는 `후보 검색 + 위치 보조` 수준으로 제한
- `2026-06-25 18:00 KST` 종료 대상에 포함되는 `Web Dynamic Map(JS v3) / Static Map / Geocoding / Reverse Geocoding`은 계속 사용할 전제가 아니라 이관 전제의 기능으로 봐야 함
- `standalone Maps`(네이버 클라우드 플랫폼 Maps / Enterprise API)가 대체 경로다
- 콜키지 정보와 공개용 식당 DB는 자체 검증 데이터로 분리
- 네이버 웹/내부 API 크롤링은 운영 기본 수집 파이프라인으로 채택하지 않음
- 지도/지오코딩은 종료 공지 이후 standalone Maps 대체 경로를 우선 검토
