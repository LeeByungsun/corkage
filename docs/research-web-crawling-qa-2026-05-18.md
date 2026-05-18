# Research Web Crawling QA - 2026-05-18

## 결론

- 기존 `corkage` 문서의 큰 결론은 2026년 5월 18일 기준으로 여전히 유효합니다.
- 네이버 공식 공개 API 기준으로는 `지역 검색 -> 상세 place JSON 재조회` 경로를 확인하지 못했습니다.
- 공식 Local Search API는 `식당 후보 수집` 용도로는 쓸 수 있지만 `콜키지 가능 여부`나 안정적인 `상세 place 데이터` 소스로 보기 어렵습니다.
- 비공식 크롤링이 필요하면 `Playwright 네트워크 관찰`이 MVP 보조 수단으로는 가장 실용적이지만, 프로덕션 핵심 파이프라인으로 채택하면 위험이 큽니다.

## 기존 문서 재검증

재검토한 문서:

- `docs/api-feasibility-and-product-plan.md`
- `docs/naver-local-search-checklist.md`

재검증 결과:

- `후보 수집은 가능하지만 상세 정보 공식 API는 불명확하다`는 결론은 유지
- `telephone` 필드는 비어 있을 가능성이 높다는 결론도 유지
- `link` 필드는 일부 결과에서 외부 URL이 들어오지만, 안정적인 네이버 place detail 계약으로 볼 수는 없음

## 공식 문서 확인

### NAVER Developers Search API

공식 문서:

- https://developers.naver.com/docs/serviceapi/search/local/local.md

확인한 내용:

- 지역 검색 요청 URL은 `https://openapi.naver.com/v1/search/local.json`
- 응답 필드는 `title`, `link`, `category`, `description`, `telephone`, `address`, `roadAddress`, `mapx`, `mapy`
- 문서상 `telephone`은 `값을 반환하지 않는 요소`
- 문서상 `link`는 `업체, 기관의 상세 정보 URL`
- 그러나 문서 어디에도 `검색 결과 1건을 별도 상세 JSON으로 재조회하는 공식 place detail API`는 보이지 않음

### Ncloud Maps 관련 최신 공지

공식 공지:

- https://www.ncloud.com/support/notice/all/2158

확인한 내용:

- 공지 제목 기준으로 `AI NAVER API ▶ 지도 API 서비스 제공 종료 안내 (2026.06.25)`가 노출됨

주의:

- 현재 수집 가능한 본문 출력에서는 제목만 확인됐고 상세 범위는 명확히 읽히지 않았습니다.
- 따라서 `2026년 6월 25일 종료`는 분명한 리스크 신호이지만, 정확히 어느 Maps API까지 포함되는지는 추가 확인이 필요합니다.
- 다만 이 공지는 `developers.naver.com`의 Search API와는 별개 축으로 보입니다.

## 라이브 API 검증

검증 일시:

- 2026-05-18

검증 방식:

- `.env.local`의 `NAVER_CLIENT_ID`, `NAVER_CLIENT_SECRET` 사용
- `Accept: */*` 헤더로 `https://openapi.naver.com/v1/search/local.json` 직접 호출

### 케이스 1

- query: `강남 와인바`
- params: `display=5&start=1&sort=random`
- 결과: 200 OK
- 응답: 총 5건, `telephone` 빈 문자열, `link`는 외부 URL 또는 빈값 가능

### 케이스 2

- query: `강남 와인바`
- params: `display=10&start=1&sort=random`
- 결과: 200 OK
- 응답 메타는 다시 `display=5`

### 케이스 3

- query: `강남 와인바`
- params: `display=5&start=2&sort=random`
- 결과: 200 OK
- 응답 메타는 다시 `start=1`

### 검증에서 새로 확인된 점

- 현재 공식 문서의 파라미터 설명은 내부적으로도 다소 일관되지 않습니다.
- 파라미터 표에는 `display` 최댓값 5, `start` 최댓값 1처럼 보이지만, 오류 코드 설명에는 더 넓은 범위가 적혀 있습니다.
- 실제 호출에서는 `display=10`, `start=2`가 에러는 아니었지만 응답이 `display=5`, `start=1`로 정규화됐습니다.
- 즉, 이 API는 현재 `사실상 단일 페이지 5건 후보 수집` 정도로 보는 쪽이 안전합니다.

## 크롤링 경로 비교

### 1. 공식 Local Search API

장점:

- 문서화됨
- 인증/한도/응답 형식이 명확함
- 후보 수집용으로는 가장 안정적

한계:

- 상세 place JSON 재조회 경로를 확인하지 못함
- `telephone` 활용 불가
- `link` 품질이 일정하지 않음
- 콜키지 여부는 해결하지 못함

### 2. Playwright 네트워크 관찰

장점:

- 실제 웹앱이 사용하는 XHR/JSON을 관찰 가능
- DOM 셀렉터 의존보다 덜 취약
- MVP용 데이터 보강 실험에는 가장 현실적

한계:

- 비공식 경로
- anti-bot, 로그인/세션, 응답 스키마 변경 리스크
- 약관/운영 정책 검토 필요

판단:

- `MVP 실험/백필`에는 가능
- `프로덕션 핵심 수집 파이프라인`으로는 비추천

### 3. Selenium/DOM 스크래핑

장점:

- 바로 눈에 보이는 정보 수집은 가능

한계:

- UI 구조 변경에 매우 취약
- 느리고 유지비가 큼
- 네트워크 관찰보다 품질이 낮음

판단:

- 세 가지 중 우선순위가 가장 낮음

### 4. 내부 엔드포인트 직접 호출

장점:

- 성공하면 가장 빠르고 필드가 풍부할 수 있음

한계:

- 비공식
- 헤더/세션/토큰 요구 가능
- 차단, 스키마 드리프트, 법적/정책 리스크가 가장 큼

판단:

- 단기 실험용 가능
- 장기 운영 기반으로는 가장 위험

## 추천

### MVP

- 공식 Local Search API로 후보 식당 수집
- 콜키지 여부와 세부 조건은 내부 DB에서 별도 관리
- 비공식 크롤링은 `초기 seed 보강` 또는 `운영자 검수 보조` 정도로만 제한
- 비공식 경로를 쓴다면 우선순위는 `Playwright 네트워크 관찰 > 직접 내부 엔드포인트 > Selenium DOM`

### Production

- 비공식 네이버 크롤링에 핵심 비즈니스를 걸지 않음
- 자체 큐레이션, 사용자 제보, 수동 검수, 외부 제휴형 데이터가 중심
- 네이버 공식 API는 후보 탐색/좌표/기본 메타 보조 역할로 제한

## 남는 리스크

- 2026년 6월 25일 Ncloud Maps 종료 공지의 정확한 범위 재확인 필요
- Search API와 Maps API 경계를 문서에 더 명확히 나눌 필요
- 콜키지 데이터는 결국 별도 검증 체계 없이는 신뢰도 확보가 어려움
- 현재 저장소에는 전용 크롤러나 저장된 fixture가 없어, 비공식 경로는 아직 `운영 가능한 파이프라인` 수준까지 검증되지는 않음

## 검증 메모

- 저장소에는 별도 `package.json`, `tsconfig.json`, `eslint` 설정, 테스트 러너 설정이 없음
- 따라서 이번 QA 작업은 코드 테스트가 아니라 `공식 문서 재확인 + 라이브 API 호출 검증 + 크롤링 경로 리스크 비교` 중심으로 수행함
