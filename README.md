# corkage

콜키지 가능한 식당 정보를 검증 우선 원칙으로 다루는 웹 MVP 저장소입니다.

현재 저장소에는 `web/` 아래 Next.js 기반 모바일 우선 MVP 뼈대가 있습니다.

## 현재 상태

- 식당 목록/상세 화면이 있습니다.
- 제보 초안 저장은 localStorage 기반 목업입니다.
- 내부 review 상태 전환과 accepted canonical preview 흐름이 포함됩니다.
- NAVER 관련 feasibility 문서는 계속 별도 문서로 유지합니다.

## web 검증 루프

```bash
cd web
npm ci
npm run typecheck
npm run lint
npm test
npm run build
```

## 문서

- `docs/api-feasibility-and-product-plan.md`
- `docs/agents-and-skills.md`
- `docs/corkage-data-policy.md`
- `docs/corkage-operator-workflow-policy.md`
- `docs/naver-local-search-checklist.md`
- `AGENTS.md`
- 현재 웹 구현은 브라우저 로컬 목업 기준의 `ReportForm` / `ReviewQueue` 흐름을 포함합니다.
- 기존 식당은 `placeId`를 연결해 제보하고, 신규 식당은 candidate로 저장한 뒤 운영 검수에서 reviewState를 전환합니다.
- accepted 된 기존 식당 제보는 canonical override preview를 만들 수 있지만, candidate 제보는 canonical을 덮지 않습니다.
