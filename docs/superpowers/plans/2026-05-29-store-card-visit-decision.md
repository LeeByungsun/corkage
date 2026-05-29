# Store Card Visit Decision Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `/store` 목록 카드를 방문 결정형으로 바꿔 콜키지 가능 여부, 비용/조건, 짧은 주소, 출처 요약을 빠르게 판단하게 만든다.

**Architecture:** 데이터 정책은 그대로 두고 카드 표시 전용 helper를 `corkage-repo.ts`에 추가한다. `StoreCard`는 helper 결과를 받아 정보 위계를 재배치하고, CSS는 기존 카드 스타일 위에 작은 visit-decision 변형 클래스를 얹는다.

**Tech Stack:** Next.js 14, React 18, TypeScript, Vitest, Testing Library, plain CSS.

---

## File Structure

- Modify: `web/src/lib/repo/corkage-repo.ts`
  - 카드 표시 전용 helper를 추가한다.
  - 기존 `getFeeLabel`, `getCorkageFacilityLabels`, `getSourceTypeLabel`, 동탄구 주소 helper를 재사용한다.
- Modify: `web/src/components/corkage/StoreCard.tsx`
  - 방문 결정형 레이아웃으로 마크업을 정리한다.
  - `TrustBadge`는 목록 카드에서 제거하고 출처 요약 문구로 대체한다.
  - 조건/태그 중복 표시를 제거한다.
- Modify: `web/src/app/globals.css`
  - `.card--visit-decision`, `.card__topline`, `.card__fee-highlight`, `.card__source-summary` 등 최소 스타일을 추가한다.
- Modify: `web/src/components/corkage/StoreCard.test.tsx`
  - 무료/유료/중복 제거/짧은 주소/상세 링크 회귀 테스트를 갱신한다.
- Create: `docs/task-updates/2026-05-29-store-card-visit-decision.md`
  - 작업 결과, 검증, 남은 리스크를 기록한다.

---

### Task 1: Lock the visit-decision card behavior with tests

**Files:**
- Modify: `web/src/components/corkage/StoreCard.test.tsx`

- [ ] **Step 1: Replace the trusted available card expectation**

In `web/src/components/corkage/StoreCard.test.tsx`, replace the body of `it('renders the trusted available store details', ...)` with this exact assertion shape:

```tsx
  it('renders the trusted available store details as a visit-decision card', () => {
    const store = getStoreById('seoul-vin-table');

    expect(store).toBeDefined();

    render(
      <StoreCard
        isNearest={false}
        onSelect={() => {}}
        selected={false}
        store={store!}
      />,
    );

    expect(screen.getByRole('heading', { name: '빈테이블 청담' })).toBeInTheDocument();
    expect(screen.getByText('가능')).toBeInTheDocument();
    expect(screen.getByText('30,000원 / 병 · 조건 확인 필요')).toBeInTheDocument();
    expect(screen.getByText('750ml 와인 기준. 사전 예약 시 반입 가능')).toBeInTheDocument();
    expect(screen.getByText('청담동 12-3')).toBeInTheDocument();
    expect(screen.getByText('매장 직접 확인 · 2026-05-10 확인')).toBeInTheDocument();
    expect(screen.queryByLabelText('신뢰도 높은 신뢰')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: '빈테이블 청담 카드 선택' })).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByRole('link', { name: '빈테이블 청담 상세 보기' })).toHaveAttribute('href', '/store/seoul-vin-table');
  });
```

- [ ] **Step 2: Update the partial Dongtan address test**

Replace the expectation in `it('renders a full Dongtan-gu road address when source road address is partial', ...)` so the card uses the short list address:

```tsx
    expect(screen.getByText('동탄구 영천동 · 다이닝')).toBeInTheDocument();
    expect(screen.getByText('지산2길 5')).toBeInTheDocument();
    expect(screen.queryByText('경기도 화성시 동탄구 지산2길 5')).not.toBeInTheDocument();
```

Keep the test store override as:

```tsx
        store={{
          ...store!,
          category: '다이닝',
          district: '경기도 화성시 동탄구 영천동',
          roadAddress: '지산2길 5',
        }}
```

- [ ] **Step 3: Replace the NAVER facility test**

Replace `it('renders imported NAVER corkage facility tags and free fee labels', ...)` with:

```tsx
  it('shows free corkage as condition-check-needed and removes duplicate facility tags', () => {
    const store = getStoreById('seoul-vin-table');

    expect(store).toBeDefined();

    render(
      <StoreCard
        isNearest={false}
        onSelect={() => {}}
        selected={false}
        store={{
          ...store!,
          corkageFee: 0,
          feeUnit: 'free',
          confidenceLabel: 'low',
          sourceType: 'public_web_reference',
          sourceNote: 'NAVER InformationFacilities 자동 추출',
          verifiedAt: '2026-05-28',
          conditionNote: '콜키지 가능 (무료)',
          rawFacilities: ['콜키지 가능 (무료)', '예약'],
        }}
      />,
    );

    expect(screen.getByText('무료 · 조건 확인 필요')).toBeInTheDocument();
    expect(screen.getAllByText('콜키지 가능 (무료)')).toHaveLength(1);
    expect(screen.queryByLabelText('네이버 편의정보 콜키지 태그')).not.toBeInTheDocument();
    expect(
      screen.getByText('공개 웹 참고 · 2026-05-28 확인 · 방문 전 조건 확인 권장'),
    ).toBeInTheDocument();
  });
```

- [ ] **Step 4: Add a paid-unknown-amount test**

Add this test after the free test:

```tsx
  it('shows paid corkage without an amount as cost-check-needed', () => {
    const store = getStoreById('seoul-vin-table');

    expect(store).toBeDefined();

    render(
      <StoreCard
        store={{
          ...store!,
          corkageFee: undefined,
          feeUnit: undefined,
          conditionNote: '콜키지 가능 (유료)',
          rawFacilities: ['콜키지 가능 (유료)'],
        }}
      />,
    );

    expect(screen.getByText('유료 · 비용 확인 필요')).toBeInTheDocument();
    expect(screen.getAllByText('콜키지 가능 (유료)')).toHaveLength(1);
  });
```

- [ ] **Step 5: Run the focused tests and verify they fail**

Run:

```bash
cd web
npm test -- --run src/components/corkage/StoreCard.test.tsx
```

Expected: FAIL. The current card still renders `30,000원 / 병`, full Dongtan-gu card address, `무료`, `TrustBadge`, and duplicate NAVER corkage tag output.

---

### Task 2: Add card presentation helpers

**Files:**
- Modify: `web/src/lib/repo/corkage-repo.ts`

- [ ] **Step 1: Add helper functions after `getStoreRoadAddressLabel`**

In `web/src/lib/repo/corkage-repo.ts`, add this code immediately after `getStoreRoadAddressLabel`:

```ts
export function getStoreCardAddressLabel(store: CorkageStore): string {
  return getStoreRoadAddressLabel(store)
    .replace(/^경기도\s+화성시\s+동탄구\s+/, '')
    .trim();
}

export function getVisitDecisionFeeLabel(store: CorkageStore): string {
  if (store.corkageStatus === 'unavailable') {
    return '반입 불가 안내';
  }

  if (store.corkageStatus === 'unknown') {
    return '비용 공개 전';
  }

  if (store.feeUnit === 'free') {
    return '무료 · 조건 확인 필요';
  }

  const feeLabel = getFeeLabel(store);
  if (typeof store.corkageFee === 'number' && feeLabel) {
    return `${feeLabel} · 조건 확인 필요`;
  }

  const corkageText = [
    store.conditionNote,
    ...getCorkageFacilityLabels(store),
  ].join(' ');

  if (corkageText.includes('유료')) {
    return '유료 · 비용 확인 필요';
  }

  return '비용 확인 필요';
}

export function getStoreCardSourceSummary(store: CorkageStore): string {
  const sourceLabel = getSourceTypeLabel(store.sourceType);
  const baseSummary = `${sourceLabel} · ${store.verifiedAt} 확인`;

  if (store.sourceType === 'public_web_reference' || store.confidenceLabel === 'low') {
    return `${baseSummary} · 방문 전 조건 확인 권장`;
  }

  return baseSummary;
}

export function getDistinctCorkageFacilityLabels(store: CorkageStore): string[] {
  const conditionNote = normalizeWhitespace(store.conditionNote);

  return getCorkageFacilityLabels(store).filter(
    (facility) => normalizeWhitespace(facility) !== conditionNote,
  );
}
```

- [ ] **Step 2: Run the focused tests again**

Run:

```bash
cd web
npm test -- --run src/components/corkage/StoreCard.test.tsx
```

Expected: still FAIL. The helpers exist, but `StoreCard` does not use them yet.

---

### Task 3: Rebuild StoreCard markup around visit decisions

**Files:**
- Modify: `web/src/components/corkage/StoreCard.tsx`

- [ ] **Step 1: Update imports**

Replace the repo import block with:

```tsx
import {
  getDistinctCorkageFacilityLabels,
  getDisplayStatus,
  getDistrictDisplayLabel,
  getStoreCardAddressLabel,
  getStoreCardSourceSummary,
  getVisitDecisionFeeLabel,
  getVisibilityNote,
} from '../../lib/repo/corkage-repo';
```

Remove `TrustBadge` import from this file.

- [ ] **Step 2: Update local derived values**

Inside `StoreCard`, replace the current derived values:

```tsx
  const feeLabel = getFeeLabel(store);
  const districtLabel = getDistrictDisplayLabel(store.district);
  const addressLabel = getStoreRoadAddressLabel(store);
  const distanceLabel = getDistanceKmLabel(store.distanceMeters);
  const corkageFacilities = getCorkageFacilityLabels(store);
```

with:

```tsx
  const feeLabel = getVisitDecisionFeeLabel(store);
  const districtLabel = getDistrictDisplayLabel(store.district);
  const addressLabel = getStoreCardAddressLabel(store);
  const sourceSummary = getStoreCardSourceSummary(store);
  const distanceLabel = getDistanceKmLabel(store.distanceMeters);
  const corkageFacilities = getDistinctCorkageFacilityLabels(store);
```

Keep `visibilityNote` for unknown/non-list usages:

```tsx
  const visibilityNote =
    store.corkageStatus === 'unknown'
      ? '콜키지 정보 확인 필요 · 방문 전 매장 확인 권장'
      : getVisibilityNote(store);
```

- [ ] **Step 3: Replace the returned JSX**

Replace the `return (...)` block in `StoreCard` with:

```tsx
  return (
    <article className={`${cardClassName} card--visit-decision`}>
      <div className="card__topline">
        <p className="eyebrow">
          {districtLabel} · {store.category}
        </p>
        <span className="status-pill status-pill--strong">{getDisplayStatus(store)}</span>
      </div>

      <div className="card__title-row">
        <h2>{store.name}</h2>
        <div className="card__badges">
          {selected ? <span className="selection-badge">선택됨</span> : null}
          {isNearest ? (
            <span
              aria-label="현재 위치 기준 가장 가까운 식당"
              className="nearest-badge"
            >
              가장 가까움
            </span>
          ) : null}
        </div>
      </div>

      <section className="card__decision" aria-label={`${store.name} 콜키지 방문 판단`}>
        <p className="card__fee-highlight">{feeLabel}</p>
        <p className="card__condition">{store.conditionNote}</p>
      </section>

      <p className="card__address">{addressLabel}</p>
      <p className="card__source-summary">{sourceSummary}</p>

      {distanceLabel ? (
        <p className="card__distance">현재 위치 기준 {distanceLabel}</p>
      ) : null}

      {store.corkageStatus !== 'available' ? (
        <p className="card__notice">{visibilityNote}</p>
      ) : null}

      {corkageFacilities.length > 0 ? (
        <div className="facility-tags" aria-label="네이버 편의정보 콜키지 태그">
          {corkageFacilities.map((facility) => (
            <span key={facility}>{facility}</span>
          ))}
        </div>
      ) : null}

      <div className="card__actions">
        {onSelect ? (
          <button
            aria-label={`${store.name} 카드 선택`}
            aria-pressed={selected}
            className={
              selected
                ? 'primary-button card__select-button card__select-button--selected'
                : 'secondary-button card__select-button'
            }
            onClick={onSelect}
            type="button"
          >
            카드 선택
          </button>
        ) : null}
        <Link
          aria-label={`${store.name} 상세 보기`}
          className="card__link card__link--primary"
          href={`/store/${store.placeId}`}
        >
          상세 보기
        </Link>
      </div>
    </article>
  );
```

- [ ] **Step 4: Run focused tests**

Run:

```bash
cd web
npm test -- --run src/components/corkage/StoreCard.test.tsx
```

Expected: PASS or only CSS-independent assertion failures. If assertions fail because exact text differs, fix code to match the tests, not the tests.

---

### Task 4: Apply minimal card CSS hierarchy

**Files:**
- Modify: `web/src/app/globals.css`

- [ ] **Step 1: Add visit-decision styles after the existing `.card` base group**

In `web/src/app/globals.css`, after the block containing `.hero__copy, .stats-card, .detail-card, .card, ...`, add:

```css
.card--visit-decision {
  display: grid;
  gap: 0.9rem;
  padding: 1.25rem;
}

.card__topline,
.card__title-row {
  align-items: flex-start;
  display: flex;
  gap: 0.75rem;
  justify-content: space-between;
}

.card__topline .eyebrow {
  margin: 0;
}

.card__title-row h2 {
  margin: 0;
}

.status-pill--strong {
  background: #e8f6e9;
  color: #23622f;
  flex: 0 0 auto;
}

.card__decision {
  background: #fff7ed;
  border: 1px solid rgba(123, 63, 0, 0.12);
  border-radius: 18px;
  display: grid;
  gap: 0.4rem;
  padding: 0.9rem 1rem;
}

.card__fee-highlight {
  color: var(--accent-strong);
  font-size: 1rem;
  font-weight: 800;
  margin: 0;
}

.card__source-summary,
.card__distance {
  color: var(--muted);
  font-size: 0.9rem;
  margin: 0;
}

.card__link--primary {
  background: var(--accent);
  border-color: var(--accent);
  color: #fff;
}
```

- [ ] **Step 2: Add mobile stacking for the new title row**

In the existing `@media (max-width: 720px)` block near `.site-header, .card__header, .detail-hero`, add `.card__title-row` and `.card__topline`:

```css
  .site-header,
  .card__header,
  .card__topline,
  .card__title-row,
  .detail-hero {
    flex-direction: column;
  }
```

- [ ] **Step 3: Run focused tests**

Run:

```bash
cd web
npm test -- --run src/components/corkage/StoreCard.test.tsx
```

Expected: PASS. CSS should not affect semantic assertions.

---

### Task 5: Add task update note and run full verification

**Files:**
- Create: `docs/task-updates/2026-05-29-store-card-visit-decision.md`

- [ ] **Step 1: Create the task update note**

Create `docs/task-updates/2026-05-29-store-card-visit-decision.md` with:

```markdown
# Task Update - 2026-05-29

## 작업명

`/store` 방문 결정형 카드 디자인 적용

## 배경

동탄구 가능 매장 목록에서 사용자가 카드 하나만 보고 콜키지 가능 여부, 비용/조건, 주소, 상세 진입 여부를 빠르게 판단할 수 있게 카드 위계를 조정했다.

## 이번에 한 일

- 카드 상단에 지역/카테고리와 `가능` 배지를 배치했다.
- 비용 요약을 핵심 판단 정보로 올렸다.
- 무료 매장도 `무료 · 조건 확인 필요`로 표시한다.
- 유료 금액 미상 매장은 `유료 · 비용 확인 필요`로 표시한다.
- 조건 문구와 콜키지 태그가 같은 경우 중복 태그를 숨긴다.
- 목록 카드 주소는 `경기도 화성시 동탄구` 접두어를 줄여 짧게 표시한다.
- 신뢰도 배지는 목록 카드에서 보조 출처 요약 문구로 낮췄다.
- 상세 보기 링크는 더 강한 CTA 스타일로 유지했다.

## 검증

- `npm test -- --run src/components/corkage/StoreCard.test.tsx`
- `npm test`
- `npm run typecheck`
- `npm run lint`
- `npx -y node@22 node_modules/next/dist/bin/next build`

## 남은 리스크

- 실제 브라우저 시각 QA는 별도 확인이 필요하다.
- 상세 페이지 디자인은 이번 범위에서 제외했다.
```

- [ ] **Step 2: Run full tests**

Run:

```bash
cd web
npm test
```

Expected: all Vitest suites pass.

- [ ] **Step 3: Run typecheck**

Run:

```bash
cd web
npm run typecheck
```

Expected: command exits `0` with no TypeScript errors.

- [ ] **Step 4: Run lint**

Run:

```bash
cd web
npm run lint
```

Expected: command exits `0` with no ESLint errors.

- [ ] **Step 5: Run production build with Node 22**

Run:

```bash
cd web
rm -rf .next
npx -y node@22 node_modules/next/dist/bin/next build
```

Expected: build succeeds. `node:sqlite` experimental warnings are acceptable.

- [ ] **Step 6: Commit implementation**

Run:

```bash
git add web/src/lib/repo/corkage-repo.ts \
  web/src/components/corkage/StoreCard.tsx \
  web/src/components/corkage/StoreCard.test.tsx \
  web/src/app/globals.css \
  docs/task-updates/2026-05-29-store-card-visit-decision.md

git commit -m "방문 판단이 쉬운 콜키지 카드를 만든다" \
  -m "목록 카드에서 가능 여부, 비용 확인 필요성, 조건, 짧은 주소를 먼저 보이게 해 사용자가 동탄구 가능 매장을 빠르게 고를 수 있게 했다. 무료도 조건 확인 문구를 포함하고 중복 콜키지 태그는 숨겨 과장과 반복을 줄였다." \
  -m "Constraint: 목록 카드만 변경하고 상세 페이지와 DB 구조는 유지" \
  -m "Rejected: TrustBadge를 상단에 계속 유지 | 보조 정보가 비용/조건 판단보다 먼저 보여 카드 목적을 흐림" \
  -m "Confidence: high" \
  -m "Scope-risk: narrow" \
  -m "Directive: 무료 콜키지도 조건 확인 문구를 제거하지 말 것" \
  -m "Tested: npm test; npm run typecheck; npm run lint; npx -y node@22 node_modules/next/dist/bin/next build" \
  -m "Not-tested: 실제 브라우저 수동 시각 QA"
```

---

## Self-Review

- Spec coverage: 비용 표시, 무료 조건 확인, 중복 태그 제거, 짧은 주소, 출처 요약, 상세 링크 유지가 Tasks 1-4에 반영되어 있다.
- Placeholder scan: 이 계획에는 `TBD`, `TODO`, `구현 예정`, `적절히 처리` 같은 빈 지시가 없다.
- Type consistency: 새 helper 이름은 `getStoreCardAddressLabel`, `getVisitDecisionFeeLabel`, `getStoreCardSourceSummary`, `getDistinctCorkageFacilityLabels`로 Tasks 2-3에서 동일하게 사용한다.
- Scope check: 상세 페이지, 지도, DB 구조, 지역 선택 UI는 변경하지 않는다.
