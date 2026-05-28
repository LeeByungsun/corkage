# Store Guest UI Simplification Design

## Status

Draft approved for review on 2026-05-28.

This document is a design spec only. It does not implement UI changes.

## Goal

Simplify the current `/store` experience for guests.

The first user experience should be:

1. Choose a region.
2. See a simple list of corkage-relevant restaurants.
3. Open a restaurant detail page for conditions, trust context, address, and map.

The product should feel like a guest-facing corkage finder, not an internal DB, map, or QA console.

## Context from existing docs

Current project docs point in the same direction:

- `docs/corkage-webapp-mvp-start-plan.md` says the MVP should work without map-first UX, and that list/detail/trust display comes before map-centered exploration.
- `docs/corkage-data-policy.md` says corkage information trust is more important than map display.
- `docs/api-feasibility-and-product-plan.md` separates map rendering from corkage data and asks what users need to know fastest.
- Recent task updates show map and marker QA are valuable, but also add complexity that should not dominate the guest entry screen.

## Design decision

Use a guest-first flow:

```text
/store
  -> region selection gate
  -> simple restaurant list for selected region
  -> /store/[id] detail with corkage facts and map
```

Recommended approach: **region selection first, list first, map on detail**.

## Non-goals

This simplification does not change:

- corkage data policy
- NAVER crawling or extraction strategy
- database schema
- review/report workflow
- canonical override behavior
- live marker QA harness
- admin/operator UI

It also does not remove `StoreMap`. It changes where map UX belongs in the guest journey.

## Guest flow

### 1. Initial `/store` state

When no concrete region is selected, show only a simple region picker.

Content:

- Page title: `어느 지역에서 찾으세요?`
- Short helper copy: `지역을 고르면 콜키지 가능 또는 확인중인 식당을 보여드립니다.`
- Region select or region button list.
- Primary action: `지역 선택하기` if using a select.

Do not show:

- full restaurant list
- map
- marker list
- technical copy such as `DB`, `seed`, `canonical`, or `NAVER Maps JavaScript API v3`
- advanced filters
- current-location controls

Rationale: the user should not meet 249 results before choosing a place.

### 2. Region-selected `/store` state

After a region is selected, show a list-first result screen.

Default result policy:

- include `available`
- include `unknown`
- exclude `unavailable`
- exclude `stale` unless the user explicitly opens an advanced state later

Guest-facing label policy:

- `available` -> `가능`
- `unknown` -> `확인중`

`unknown` must be conservative. It should read as a candidate that needs confirmation, not as likely availability.

Good copy examples:

- `확인중`
- `콜키지 정보 확인 필요`
- `방문 전 확인 필요`

Avoid:

- `가능할 수 있음`
- `콜키지 가능 후보`
- `미확인 가능`
- unverified fee or condition emphasis

### 3. List card content

Each list card should be small and scannable.

Show:

- restaurant name
- area/category line
- status pill: `가능` or `확인중`
- one corkage condition or trust sentence
- small trust/freshness signal
- `상세 보기` action

Hide from the default card:

- address unless needed for disambiguation
- full trust policy paragraph
- map controls
- marker selection button language
- developer/source terms

For `available` cards, use condition copy when policy allows.

For `unknown` cards, prefer conservative copy such as:

> 콜키지 정보 확인 필요 · 방문 전 매장 확인 권장

### 4. Detail page

The detail page is where supporting information belongs.

Show:

- corkage status
- fee label if allowed by policy
- condition note
- source/trust context
- freshness/verified date
- address
- NAVER facility tags when available
- map for location confirmation
- warning copy: `콜키지 정책은 방문 전 매장에 다시 확인하세요.`

The detail page can keep the map because the user has already selected one restaurant.

### 5. Advanced controls

Advanced controls should not appear on first load.

Keep for later or secondary UI:

- max fee
- radius
- sort
- current location
- full status selector
- map/list combined exploration

If retained in this simplification, place them behind a small `필터 더보기` disclosure after a region has been selected.

## Route behavior

### `/store` without region

If `district=all` or no district query is present:

- render region selection gate
- do not render `StoreMap`
- do not render `StoreList`
- do not show result count

### `/store?district=<region>`

If a real district is present:

- render compact selected-region header
- render list of `available + unknown`
- do not render map by default
- show empty state if no eligible stores exist

### `/store/[id]`

Render detail information and map.

If map credentials are unavailable, keep the existing map fallback guidance, but rewrite the guest-facing copy to avoid developer-first language where possible.

## Component boundary proposal

Keep the change small and aligned with existing code.

Potential units:

- `StoreExplorer`
  - owns selected-region state and route/query behavior
  - decides whether to show the region gate or the result list
- `StoreRegionGate`
  - new small component for initial region selection
  - can be internal to `StoreExplorer` at first if simpler
- `StoreList`
  - keeps list rendering
  - receives already-filtered guest result stores
- `StoreCard`
  - gets a simpler guest-facing card variant or simplified default copy
- `StoreDetailView`
  - remains the place for full corkage detail and map handoff
- `StoreMap`
  - remains available, but is not part of the initial list-first guest path

Do not introduce a new state-management layer.

## Data policy alignment

The UI must preserve the existing data policy.

Rules:

- `unknown` is visible only as `확인중`.
- Unverified information must not imply availability.
- Low-confidence or stale details should remain conservative.
- User-facing copy should focus on action and trust, not internal source taxonomy.
- Technical source labels may remain in detail if needed, but should not dominate the first list screen.

## Error and empty states

### No selected region

Show region picker only.

### Region selected, no eligible stores

Show:

> 아직 이 지역에는 공개 가능한 콜키지 정보가 없습니다.

Offer:

- choose another region
- report a restaurant

### Region selected, only unknown stores

Show the list, but use conservative header copy:

> 확인이 필요한 후보 식당입니다. 방문 전 매장에 확인해 주세요.

### Data loading/server error

Keep current Next.js route behavior. If a client-side error state is added later, use plain guest copy:

> 식당 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.

## Testing strategy

Regression tests should prove the guest flow, not just implementation details.

Add or adjust tests for:

- `/store` with no district shows region gate only.
- no district does not render map/list/result count.
- choosing a district or loading with district query shows list results.
- district result defaults to `available + unknown`, excluding `unavailable`.
- unknown cards use `확인중` and conservative copy.
- detail page still shows full corkage details and map/fallback.

Existing map QA should remain valid, but map QA is not the acceptance target for the initial guest screen.

## Rollout plan

1. First implementation slice:
   - region gate on `/store`
   - list-first selected-region state
   - guest default status filter: `available + unknown`
   - hide map from initial selected-region list

2. Second slice, if needed:
   - simplify card copy and advanced filters
   - add `필터 더보기`

3. Later slice:
   - map-on-detail polish
   - optional map/list toggle if user behavior requires it

## Acceptance criteria

The simplification is successful when:

- a first-time guest sees a region choice before any long result list
- selecting a region shows a short, scannable list
- the default list does not include known unavailable stores
- `확인중` does not sound like `가능`
- map UI no longer dominates the first `/store` experience
- detailed trust/context still exists on `/store/[id]`
