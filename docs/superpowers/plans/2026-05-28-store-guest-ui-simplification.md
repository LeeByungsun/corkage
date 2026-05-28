# Store Guest UI Simplification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn `/store` into a guest-first region picker and simple corkage list, with maps moved to restaurant detail pages.

**Architecture:** Keep the existing Next.js app and corkage data helpers. Simplify `StoreExplorer` into a region-gated list controller, keep `StoreCard` reusable by making selection controls optional, and add a focused detail-location map that reuses the NAVER loader without bringing the full explorer map back to the first screen.

**Tech Stack:** Next.js App Router, React client components, TypeScript, Vitest + Testing Library, Playwright harness for live NAVER map smoke checks.

---

## File Structure

- Modify `web/src/app/store/page.tsx`
  - Stop treating `/store` as a full filter/map page.
  - Read all canonical stores for the selected district so the client can show `available + unknown` by default.
  - Replace DB/map-first copy with guest-first region copy.

- Modify `web/src/components/corkage/StoreExplorer.tsx`
  - Render a region-selection gate when no concrete district is selected.
  - Render a list-first guest result screen when a district is selected.
  - Filter guest-visible results to `available + unknown` and non-stale stores.
  - Remove map/current-location/radius/sort behavior from this first guest flow.

- Modify `web/src/components/corkage/StoreExplorer.test.tsx`
  - Replace map-first behavior tests with guest-flow tests.
  - Keep assertions focused on region gate, eligible statuses, and hidden map/list before region selection.

- Modify `web/src/components/corkage/StoreList.tsx`
  - Make selection props optional so the guest list can render plain cards.
  - Preserve selection support for any future map-driven usage.

- Modify `web/src/components/corkage/StoreCard.tsx`
  - Make `onSelect`, `selected`, and `isNearest` optional.
  - Hide the card selection button when no selection handler is provided.
  - Use conservative guest copy for `unknown` cards.

- Modify `web/src/components/corkage/StoreCard.test.tsx`
  - Update existing tests for optional selection controls.
  - Add an unknown-card conservative-copy regression.

- Create `web/src/components/corkage/StoreLocationMap.tsx`
  - Small client-only detail map for one restaurant.
  - Reuse `loadNaverMaps`.
  - Show guest-friendly fallback copy when key/coordinates/load fail.

- Create `web/src/components/corkage/StoreLocationMap.test.tsx`
  - Unit coverage for fallback and successful NAVER loader/marker wiring.

- Modify `web/src/components/corkage/StoreDetailView.tsx`
  - Render the location map on detail pages.
  - Add the visit-before-confirming warning copy from the data policy.

- Create `web/src/components/corkage/StoreDetailView.test.tsx`
  - Assert detail page includes full corkage facts, warning copy, and the location map component.

- Modify `web/scripts/run-store-live-marker-qa.mjs`
  - Retarget live map smoke QA from `/store` explorer markers to `/store/[id]` detail location map.
  - Keep `localhost` default and env-key blocker behavior.

- Modify `web/src/app/globals.css`
  - Add small styles for the region gate, guest result header, and detail map.
  - Reuse existing button/card visual language.

- Create `docs/task-updates/2026-05-28-store-guest-ui-simplification.md`
  - Record the implementation result, verification, changed files, and risks.

---

## Task 1: Lock the guest `/store` flow with failing tests

**Files:**
- Modify: `web/src/components/corkage/StoreExplorer.test.tsx`

- [ ] **Step 1: Replace the StoreMap mock with a sentinel-only mock**

Update the mock near the top of `StoreExplorer.test.tsx` so tests can prove the map is not rendered in the guest-first path:

```tsx
vi.mock('./StoreMap', () => ({
  StoreMap: () => <div data-testid="store-map">지도</div>,
}));
```

- [ ] **Step 2: Replace the test store fixture with mixed guest statuses**

Use this fixture in `StoreExplorer.test.tsx`:

```tsx
const testStores = [
  {
    placeId: 'available-gangnam',
    name: '가능 식당',
    address: '서울시 강남구 1',
    roadAddress: '서울시 강남구 1',
    lat: 37.5252,
    lng: 127.0482,
    category: '다이닝',
    district: '강남',
    corkageStatus: 'available',
    freshnessState: 'fresh',
    confidenceLabel: 'high',
    verifiedAt: '2026-05-22',
    sourceType: 'operator_verified',
    sourceNote: '매장 확인',
    conditionNote: '와인 1병 가능',
  },
  {
    placeId: 'unknown-gangnam',
    name: '확인중 식당',
    address: '서울시 강남구 2',
    roadAddress: '서울시 강남구 2',
    lat: 37.5262,
    lng: 127.0492,
    category: '비스트로',
    district: '강남',
    corkageStatus: 'unknown',
    freshnessState: 'fresh',
    confidenceLabel: 'low',
    verifiedAt: '검수 전',
    sourceType: 'public_web_reference',
    sourceNote: '후보 정보',
    conditionNote: '확인 필요',
  },
  {
    placeId: 'unavailable-gangnam',
    name: '불가 식당',
    address: '서울시 강남구 3',
    roadAddress: '서울시 강남구 3',
    lat: 37.5272,
    lng: 127.0502,
    category: '한식',
    district: '강남',
    corkageStatus: 'unavailable',
    freshnessState: 'fresh',
    confidenceLabel: 'high',
    verifiedAt: '2026-05-22',
    sourceType: 'operator_verified',
    sourceNote: '매장 확인',
    conditionNote: '반입 불가',
  },
  {
    placeId: 'stale-gangnam',
    name: '오래된 식당',
    address: '서울시 강남구 4',
    roadAddress: '서울시 강남구 4',
    lat: 37.5282,
    lng: 127.0512,
    category: '와인바',
    district: '강남',
    corkageStatus: 'available',
    freshnessState: 'stale',
    confidenceLabel: 'medium',
    verifiedAt: '2025-01-01',
    sourceType: 'operator_verified',
    sourceNote: '오래된 확인',
    conditionNote: '정보 오래됨',
  },
  {
    placeId: 'available-seongsu',
    name: '성수 가능 식당',
    address: '서울시 성수구 1',
    roadAddress: '서울시 성수구 1',
    lat: 37.5602,
    lng: 127.1502,
    category: '다이닝',
    district: '성수',
    corkageStatus: 'available',
    freshnessState: 'fresh',
    confidenceLabel: 'medium',
    verifiedAt: '2026-05-22',
    sourceType: 'operator_verified',
    sourceNote: '매장 확인',
    conditionNote: '확인됨',
  },
] as const;
```

- [ ] **Step 3: Replace the render helper with an override-friendly helper**

```tsx
function renderStoreExplorer(
  overrides: Partial<React.ComponentProps<typeof StoreExplorer>> = {},
) {
  return render(
    <StoreExplorer
      district="all"
      districts={[...testDistricts]}
      stores={[...testStores]}
      {...overrides}
    />,
  );
}
```

- [ ] **Step 4: Add a failing no-region gate test**

```tsx
it('shows only the region gate before a region is selected', () => {
  renderStoreExplorer({ district: 'all' });

  expect(
    screen.getByRole('heading', { name: '어느 지역에서 찾으세요?' }),
  ).toBeInTheDocument();
  expect(screen.getByLabelText('지역')).toBeInTheDocument();
  expect(
    screen.getByRole('button', { name: '지역 선택하기' }),
  ).toBeInTheDocument();
  expect(screen.queryByTestId('store-map')).not.toBeInTheDocument();
  expect(screen.queryByText(/개 결과|개 식당/)).not.toBeInTheDocument();
  expect(screen.queryByRole('heading', { name: '가능 식당' })).not.toBeInTheDocument();
});
```

- [ ] **Step 5: Add a failing selected-region list test**

```tsx
it('shows available and unknown stores for the selected region without the map', () => {
  renderStoreExplorer({ district: '강남' });

  expect(screen.getByText('강남')).toBeInTheDocument();
  expect(screen.getByText('2개 식당')).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: '가능 식당' })).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: '확인중 식당' })).toBeInTheDocument();
  expect(screen.queryByRole('heading', { name: '불가 식당' })).not.toBeInTheDocument();
  expect(screen.queryByRole('heading', { name: '오래된 식당' })).not.toBeInTheDocument();
  expect(screen.queryByRole('heading', { name: '성수 가능 식당' })).not.toBeInTheDocument();
  expect(screen.queryByTestId('store-map')).not.toBeInTheDocument();
});
```

- [ ] **Step 6: Run the focused test and verify it fails**

Run:

```bash
cd web && npm test -- --run src/components/corkage/StoreExplorer.test.tsx
```

Expected: FAIL because the current implementation still renders the full filter bar, map, result count, and map-driven list before region selection.

- [ ] **Step 7: Commit the failing tests**

```bash
git add web/src/components/corkage/StoreExplorer.test.tsx
git commit -m "손님용 지역 진입 흐름을 테스트로 고정한다"
```

---

## Task 2: Implement the region gate and list-first `/store` flow

**Files:**
- Modify: `web/src/app/store/page.tsx`
- Modify: `web/src/components/corkage/StoreExplorer.tsx`
- Modify: `web/src/app/globals.css`
- Test: `web/src/components/corkage/StoreExplorer.test.tsx`

- [ ] **Step 1: Simplify `StoreExplorerProps`**

In `StoreExplorer.tsx`, replace the props type with:

```tsx
type StoreExplorerProps = {
  stores: CorkageStore[];
  districts: string[];
  district: string;
};
```

- [ ] **Step 2: Replace the `StoreExplorer` implementation with the guest-first controller**

Replace the current `StoreExplorer` function and helper functions with:

```tsx
export function StoreExplorer({
  stores,
  districts,
  district,
}: StoreExplorerProps) {
  const isRegionSelected = district !== 'all';
  const regionalStores = useMemo(
    () =>
      isRegionSelected
        ? filterStoreList(stores, {
            status: 'all',
            district,
          })
        : [],
    [district, isRegionSelected, stores],
  );
  const guestStores = useMemo(
    () => filterGuestVisibleStores(regionalStores),
    [regionalStores],
  );

  if (!isRegionSelected) {
    return <StoreRegionGate districts={districts} />;
  }

  return (
    <>
      <section className="guest-result-header" aria-label="선택한 지역 결과">
        <div>
          <p className="eyebrow">선택한 지역</p>
          <h2>{district}</h2>
          <p>
            콜키지 가능 또는 확인이 필요한 식당만 먼저 보여드립니다.
          </p>
        </div>
        <a className="secondary-button" href="/store">
          지역 다시 선택
        </a>
      </section>

      <p className="helper-text">{guestStores.length}개 식당</p>

      {guestStores.length === 0 ? (
        <section className="empty-state">
          <h2>아직 이 지역에는 공개 가능한 콜키지 정보가 없습니다.</h2>
          <p>다른 지역을 선택하거나 제보 페이지에서 식당을 알려주세요.</p>
        </section>
      ) : (
        <StoreList stores={guestStores} />
      )}
    </>
  );
}
```

- [ ] **Step 3: Add `StoreRegionGate` and guest filtering helpers below `StoreExplorer`**

```tsx
function StoreRegionGate({ districts }: { districts: string[] }) {
  return (
    <section className="region-gate" aria-label="지역 선택">
      <p className="eyebrow">콜키지 식당 찾기</p>
      <h2>어느 지역에서 찾으세요?</h2>
      <p>
        지역을 고르면 콜키지 가능 또는 확인중인 식당을 보여드립니다.
      </p>
      <form className="region-gate__form">
        <label>
          <span>지역</span>
          <select aria-label="지역" defaultValue="" name="district" required>
            <option disabled value="">
              지역 선택
            </option>
            {districts.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
        <button className="primary-button" type="submit">
          지역 선택하기
        </button>
      </form>
    </section>
  );
}

function filterGuestVisibleStores(stores: CorkageStore[]) {
  return stores.filter((store) => {
    if (store.freshnessState === 'stale') {
      return false;
    }

    return store.corkageStatus === 'available' || store.corkageStatus === 'unknown';
  });
}
```

- [ ] **Step 4: Remove unused imports from `StoreExplorer.tsx`**

Keep only these imports at the top:

```tsx
'use client';

import { useMemo } from 'react';
import { filterStoreList } from '../../lib/repo/corkage-repo';
import type { CorkageStore } from '../../lib/types/corkage';
import { StoreList } from './StoreList';
```

- [ ] **Step 5: Simplify `/store` route props and data loading**

In `web/src/app/store/page.tsx`, replace the search params type with:

```tsx
type StorePageProps = {
  searchParams?: {
    district?: string;
  };
};
```

Replace the data selection block with:

```tsx
  const district = searchParams?.district || 'all';
  const stores = await readCanonicalStores({
    status: 'all',
    district,
  });
  const districts = listCanonicalDistricts();
```

- [ ] **Step 6: Replace the `/store` header copy**

In `web/src/app/store/page.tsx`, replace the header JSX with:

```tsx
      <header className="section-header">
        <p className="eyebrow">콜키지 식당 찾기</p>
        <h1>지역별 콜키지 식당</h1>
        <p>
          지역을 먼저 선택하면 콜키지 가능 또는 확인중인 식당만 간단히 보여드립니다.
        </p>
      </header>
```

- [ ] **Step 7: Update the `StoreExplorer` usage in `/store`**

Replace the existing `StoreExplorer` JSX props with:

```tsx
      <StoreExplorer
        stores={stores}
        districts={districts}
        district={district}
      />
```

- [ ] **Step 8: Add minimal styles**

Append this to `web/src/app/globals.css` near the existing card/form styles:

```css
.region-gate,
.guest-result-header {
  background: #fffaf3;
  border: 1px solid rgba(123, 63, 0, 0.14);
  border-radius: 28px;
  box-shadow: 0 18px 48px rgba(94, 47, 0, 0.08);
  padding: 28px;
}

.region-gate {
  display: grid;
  gap: 18px;
  max-width: 720px;
}

.region-gate__form {
  display: grid;
  gap: 14px;
}

.region-gate__form label {
  display: grid;
  gap: 8px;
  font-weight: 700;
}

.region-gate__form select {
  border: 1px solid rgba(123, 63, 0, 0.2);
  border-radius: 16px;
  font: inherit;
  padding: 14px 16px;
}

.guest-result-header {
  align-items: center;
  display: flex;
  gap: 16px;
  justify-content: space-between;
}

.guest-result-header h2,
.region-gate h2 {
  margin: 0;
}

@media (max-width: 720px) {
  .guest-result-header {
    align-items: flex-start;
    flex-direction: column;
  }
}
```

- [ ] **Step 9: Run the focused test and verify it passes**

Run:

```bash
cd web && npm test -- --run src/components/corkage/StoreExplorer.test.tsx
```

Expected: PASS.

- [ ] **Step 10: Commit the region gate implementation**

```bash
git add web/src/app/store/page.tsx web/src/components/corkage/StoreExplorer.tsx web/src/components/corkage/StoreExplorer.test.tsx web/src/app/globals.css
git commit -m "손님용 지역 선택 화면을 먼저 보여준다"
```

---

## Task 3: Simplify list cards for guest browsing

**Files:**
- Modify: `web/src/components/corkage/StoreList.tsx`
- Modify: `web/src/components/corkage/StoreCard.tsx`
- Modify: `web/src/components/corkage/StoreCard.test.tsx`

- [ ] **Step 1: Make `StoreList` selection props optional**

Replace `StoreListProps` in `StoreList.tsx` with:

```tsx
type StoreListProps = {
  stores: StoreWithDistance[];
  nearestStorePlaceId?: string | null;
  onSelectPlaceId?: (placeId: string) => void;
  selectedPlaceId?: string | null;
};
```

- [ ] **Step 2: Update `StoreList` to pass optional selection props safely**

Replace the `StoreCard` call inside `StoreList` with:

```tsx
        <StoreCard
          key={store.placeId}
          isNearest={store.placeId === nearestStorePlaceId}
          onSelect={onSelectPlaceId ? () => onSelectPlaceId(store.placeId) : undefined}
          selected={store.placeId === selectedPlaceId}
          store={store}
        />
```

- [ ] **Step 3: Make `StoreCard` props optional**

Replace `StoreCardProps` in `StoreCard.tsx` with:

```tsx
type StoreCardProps = {
  isNearest?: boolean;
  onSelect?: () => void;
  selected?: boolean;
  store: CorkageStore & {
    distanceMeters?: number;
  };
};
```

Keep the function signature as destructuring with defaults:

```tsx
export function StoreCard({
  isNearest = false,
  onSelect,
  selected = false,
  store,
}: StoreCardProps) {
```

- [ ] **Step 4: Add guest-safe notice text in `StoreCard`**

After `const corkageFacilities = getCorkageFacilityLabels(store);`, add:

```tsx
  const visibilityNote = store.corkageStatus === 'unknown'
    ? '콜키지 정보 확인 필요 · 방문 전 매장 확인 권장'
    : getVisibilityNote(store);
```

Replace:

```tsx
      <p className="card__notice">{getVisibilityNote(store)}</p>
```

with:

```tsx
      <p className="card__notice">{visibilityNote}</p>
```

- [ ] **Step 5: Hide card selection controls when no selection handler is provided**

Replace the `card__actions` block in `StoreCard.tsx` with:

```tsx
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
        <Link aria-label={`${store.name} 상세 보기`} className="card__link" href={`/store/${store.placeId}`}>
          상세 보기
        </Link>
      </div>
```

- [ ] **Step 6: Add a no-selection-control test**

Append this test to `StoreCard.test.tsx`:

```tsx
  it('renders as a simple guest card when no selection handler is provided', () => {
    const store = getStoreById('seoul-vin-table');

    expect(store).toBeDefined();

    render(<StoreCard store={store!} />);

    expect(screen.queryByRole('button', { name: /카드 선택$/ })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: '빈테이블 청담 상세 보기' })).toHaveAttribute('href', '/store/seoul-vin-table');
  });
```

- [ ] **Step 7: Add an unknown-card conservative-copy test**

Append this test to `StoreCard.test.tsx`:

```tsx
  it('uses conservative guest copy for unknown corkage stores', () => {
    const store = getStoreById('seoul-vin-table');

    expect(store).toBeDefined();

    render(
      <StoreCard
        store={{
          ...store!,
          corkageStatus: 'unknown',
          confidenceLabel: 'low',
          conditionNote: '확인 필요',
          sourceNote: '후보 정보',
          verifiedAt: '검수 전',
        }}
      />,
    );

    expect(screen.getByText('확인중')).toBeInTheDocument();
    expect(
      screen.getByText('콜키지 정보 확인 필요 · 방문 전 매장 확인 권장'),
    ).toBeInTheDocument();
    expect(screen.getByText('비용 공개 전')).toBeInTheDocument();
  });
```

- [ ] **Step 8: Run card/list tests**

Run:

```bash
cd web && npm test -- --run src/components/corkage/StoreCard.test.tsx src/components/corkage/StoreExplorer.test.tsx
```

Expected: PASS.

- [ ] **Step 9: Commit card simplification**

```bash
git add web/src/components/corkage/StoreList.tsx web/src/components/corkage/StoreCard.tsx web/src/components/corkage/StoreCard.test.tsx web/src/components/corkage/StoreExplorer.test.tsx
git commit -m "손님용 리스트 카드를 선택 없이 읽게 한다"
```

---

## Task 4: Add a detail-page location map

**Files:**
- Create: `web/src/components/corkage/StoreLocationMap.tsx`
- Create: `web/src/components/corkage/StoreLocationMap.test.tsx`
- Modify: `web/src/components/corkage/StoreDetailView.tsx`
- Create: `web/src/components/corkage/StoreDetailView.test.tsx`
- Modify: `web/src/app/globals.css`

- [ ] **Step 1: Create the detail map component test**

Create `web/src/components/corkage/StoreLocationMap.test.tsx`:

```tsx
import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { StoreLocationMap } from './StoreLocationMap';
import { loadNaverMaps } from '../../lib/map/naver-maps-loader';
import { getStoreById } from '../../lib/repo/corkage-repo';

const mockLoadNaverMaps = vi.hoisted(() => vi.fn());

vi.mock('../../lib/map/naver-maps-loader', () => ({
  loadNaverMaps: mockLoadNaverMaps,
}));

describe('StoreLocationMap', () => {
  it('shows guest-friendly fallback copy when the map key is missing', () => {
    const store = getStoreById('seoul-vin-table');

    expect(store).toBeDefined();

    render(<StoreLocationMap clientId="" store={store!} />);

    expect(screen.getByText('위치 지도 준비 중')).toBeInTheDocument();
    expect(screen.getByText(/상세 주소를 먼저 확인해 주세요/)).toBeInTheDocument();
  });

  it('loads NAVER map and places one marker for the detail store', async () => {
    const store = getStoreById('seoul-vin-table');
    const mapConstructor = vi.fn(function MapMock() {
      return { destroy: vi.fn() };
    });
    const markerConstructor = vi.fn(function MarkerMock() {
      return { setMap: vi.fn() };
    });
    const latLngConstructor = vi.fn(function LatLngMock(lat: number, lng: number) {
      return { lat, lng };
    });

    expect(store).toBeDefined();

    mockLoadNaverMaps.mockResolvedValue({
      maps: {
        LatLng: latLngConstructor,
        Map: mapConstructor,
        Marker: markerConstructor,
      },
    });

    render(<StoreLocationMap clientId="test-client-id" store={store!} />);

    await waitFor(() => expect(loadNaverMaps).toHaveBeenCalledWith('test-client-id'));
    expect(latLngConstructor).toHaveBeenCalledWith(store!.lat, store!.lng);
    expect(mapConstructor).toHaveBeenCalled();
    expect(markerConstructor).toHaveBeenCalledWith(
      expect.objectContaining({
        title: store!.name,
      }),
    );
    await waitFor(() =>
      expect(screen.getByLabelText(`${store!.name} 위치 지도`)).toHaveAttribute(
        'data-location-map-state',
        'ready',
      ),
    );
  });
});
```

- [ ] **Step 2: Run the new test and verify it fails**

Run:

```bash
cd web && npm test -- --run src/components/corkage/StoreLocationMap.test.tsx
```

Expected: FAIL because `StoreLocationMap.tsx` does not exist.

- [ ] **Step 3: Create `StoreLocationMap.tsx`**

Create `web/src/components/corkage/StoreLocationMap.tsx`:

```tsx
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { loadNaverMaps } from '../../lib/map/naver-maps-loader';
import type { CorkageStore } from '../../lib/types/corkage';

type StoreLocationMapProps = {
  clientId?: string;
  store: CorkageStore;
};

type MapInstance = {
  destroy?: () => void;
};

type MarkerInstance = {
  setMap?: (map: null) => void;
};

export function StoreLocationMap({
  clientId = process.env.NEXT_PUBLIC_NAVER_MAPS_CLIENT_ID || '',
  store,
}: StoreLocationMapProps) {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [mapState, setMapState] = useState<'loading' | 'ready'>('loading');
  const hasCoordinates = useMemo(
    () => Number.isFinite(store.lat) && Number.isFinite(store.lng),
    [store.lat, store.lng],
  );

  useEffect(() => {
    if (!clientId || !hasCoordinates || !mapRef.current) {
      return;
    }

    let cancelled = false;
    let marker: MarkerInstance | null = null;
    let mapInstance: MapInstance | null = null;

    setErrorMessage('');
    setMapState('loading');

    loadNaverMaps(clientId)
      .then(({ maps }) => {
        if (cancelled || !mapRef.current) {
          return;
        }

        const position = new maps.LatLng(store.lat, store.lng);
        mapInstance = new maps.Map(mapRef.current, {
          center: position,
          zoom: 15,
        });
        marker = new maps.Marker({
          map: mapInstance,
          position,
          title: store.name,
        });
        setMapState('ready');
      })
      .catch(() => {
        if (!cancelled) {
          setErrorMessage('지도를 불러오지 못했습니다. 주소를 먼저 확인해 주세요.');
        }
      });

    return () => {
      cancelled = true;
      marker?.setMap?.(null);
      mapInstance?.destroy?.();
    };
  }, [clientId, hasCoordinates, store.lat, store.lng, store.name]);

  if (!hasCoordinates) {
    return (
      <section className="detail-map detail-map--fallback">
        <h2>위치 지도 준비 중</h2>
        <p>이 식당은 지도에 표시할 좌표가 아직 없습니다. 상세 주소를 먼저 확인해 주세요.</p>
      </section>
    );
  }

  if (!clientId) {
    return (
      <section className="detail-map detail-map--fallback">
        <h2>위치 지도 준비 중</h2>
        <p>지도 연결 전입니다. 상세 주소를 먼저 확인해 주세요.</p>
      </section>
    );
  }

  return (
    <section className="detail-map">
      <div className="detail-map__header">
        <p className="eyebrow">위치</p>
        <h2>방문 위치 확인</h2>
        <p>{store.roadAddress}</p>
      </div>
      {errorMessage ? <p className="detail-map__error">{errorMessage}</p> : null}
      <div
        aria-label={`${store.name} 위치 지도`}
        className="detail-map__canvas"
        data-location-map-state={mapState}
        ref={mapRef}
      />
    </section>
  );
}
```

- [ ] **Step 4: Add detail view test with map mock**

Create `web/src/components/corkage/StoreDetailView.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { StoreDetailView } from './StoreDetailView';
import { getStoreById } from '../../lib/repo/corkage-repo';

vi.mock('./StoreLocationMap', () => ({
  StoreLocationMap: ({ store }: { store: { name: string } }) => (
    <section aria-label="상세 위치 지도">{store.name} 지도</section>
  ),
}));

describe('StoreDetailView', () => {
  it('shows corkage details, visit warning, and location map', () => {
    const store = getStoreById('seoul-vin-table');

    expect(store).toBeDefined();

    render(<StoreDetailView store={store!} />);

    expect(screen.getByRole('heading', { name: '빈테이블 청담' })).toBeInTheDocument();
    expect(screen.getByText('가능')).toBeInTheDocument();
    expect(screen.getByText('30,000원 / 병')).toBeInTheDocument();
    expect(
      screen.getByText('콜키지 정책은 방문 전 매장에 다시 확인하세요.'),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('상세 위치 지도')).toHaveTextContent('빈테이블 청담 지도');
  });
});
```

- [ ] **Step 5: Modify `StoreDetailView.tsx` to render the map and warning**

Add this import:

```tsx
import { StoreLocationMap } from './StoreLocationMap';
```

Add this JSX after the existing `TrustBadge`:

```tsx
      <p className="detail-warning">
        콜키지 정책은 방문 전 매장에 다시 확인하세요.
      </p>
      <StoreLocationMap store={store} />
```

- [ ] **Step 6: Add detail map styles**

Append this to `web/src/app/globals.css`:

```css
.detail-warning {
  background: rgba(123, 63, 0, 0.08);
  border-radius: 18px;
  color: #5e2f00;
  font-weight: 700;
  padding: 14px 16px;
}

.detail-map {
  background: #fffaf3;
  border: 1px solid rgba(123, 63, 0, 0.14);
  border-radius: 28px;
  display: grid;
  gap: 16px;
  margin-top: 24px;
  padding: 20px;
}

.detail-map__header h2 {
  margin: 0;
}

.detail-map__canvas {
  background: rgba(123, 63, 0, 0.08);
  border-radius: 22px;
  min-height: 320px;
  overflow: hidden;
}

.detail-map__error {
  color: #9a3412;
  font-weight: 700;
}
```

- [ ] **Step 7: Run detail tests**

Run:

```bash
cd web && npm test -- --run src/components/corkage/StoreLocationMap.test.tsx src/components/corkage/StoreDetailView.test.tsx
```

Expected: PASS.

- [ ] **Step 8: Commit the detail map slice**

```bash
git add web/src/components/corkage/StoreLocationMap.tsx web/src/components/corkage/StoreLocationMap.test.tsx web/src/components/corkage/StoreDetailView.tsx web/src/components/corkage/StoreDetailView.test.tsx web/src/app/globals.css
git commit -m "상세 화면에서 식당 위치 지도를 확인하게 한다"
```

---

## Task 5: Retarget live browser QA to the detail map

**Files:**
- Modify: `web/scripts/run-store-live-marker-qa.mjs`

- [ ] **Step 1: Update the console message**

Replace:

```js
  console.log(`Running store live marker QA at http://${HOST}:${PORT}/store`);
```

with:

```js
  console.log(`Running store detail location map QA at http://${HOST}:${PORT}`);
```

- [ ] **Step 2: Replace the generated Playwright spec**

Replace the full string returned by `buildSpec()` with:

```js
  return `import { expect, test } from '@playwright/test';

test.describe('store detail location map QA harness', () => {
  test('renders a NAVER marker on a real store detail page', async ({ page }) => {
    test.slow();

    const response = await page.request.get('/api/stores?status=available');
    expect(response.ok()).toBeTruthy();
    const payload = await response.json();
    const store = payload.stores.find((item) =>
      Number.isFinite(item.lat) && Number.isFinite(item.lng)
    );

    expect(store, 'expected at least one available store with coordinates').toBeTruthy();

    await page.goto(\`/store/\${store.placeId}\`);

    await expect(page.getByRole('heading', { name: store.name })).toBeVisible();
    await expect(page.getByText('콜키지 정책은 방문 전 매장에 다시 확인하세요.')).toBeVisible();
    await expect(page.getByLabel(\`\${store.name} 위치 지도\`)).toHaveAttribute(
      'data-location-map-state',
      'ready',
      { timeout: 20_000 },
    );
  });
});
`;
```

- [ ] **Step 3: Run the live QA script when `.env.local` exists**

Run:

```bash
cd web && npm run qa:store-live-markers
```

Expected with `NEXT_PUBLIC_NAVER_MAPS_CLIENT_ID`: PASS, desktop/mobile Chromium 2 tests.

Expected without `NEXT_PUBLIC_NAVER_MAPS_CLIENT_ID`: fail fast with the existing exact message:

```text
NEXT_PUBLIC_NAVER_MAPS_CLIENT_ID is missing. Set it in web/.env.local before running qa:store-live-markers.
```

- [ ] **Step 4: Commit the QA retarget**

```bash
git add web/scripts/run-store-live-marker-qa.mjs
git commit -m "실브라우저 QA가 상세 위치 지도를 확인하게 한다"
```

---

## Task 6: Final verification and task update note

**Files:**
- Create: `docs/task-updates/2026-05-28-store-guest-ui-simplification.md`

- [ ] **Step 1: Run focused tests**

Run:

```bash
cd web && npm test -- --run src/components/corkage/StoreExplorer.test.tsx src/components/corkage/StoreCard.test.tsx src/components/corkage/StoreLocationMap.test.tsx src/components/corkage/StoreDetailView.test.tsx
```

Expected: PASS.

- [ ] **Step 2: Run full test suite**

Run:

```bash
cd web && npm test
```

Expected: PASS.

- [ ] **Step 3: Run typecheck, lint, and build**

Run:

```bash
cd web && npm run typecheck && npm run lint && npm run build
```

Expected: PASS.

- [ ] **Step 4: Run live QA if local NAVER key is present**

Run:

```bash
cd web && npm run qa:store-live-markers
```

Expected with local key: PASS.

If blocked, capture the exact missing-key error in the task update note.

- [ ] **Step 5: Write task update note**

Create `docs/task-updates/2026-05-28-store-guest-ui-simplification.md`:

```markdown
# Task Update - 2026-05-28

## 작업명

`/store` 손님용 지역 선택 + 리스트 우선 UI 단순화

## 결론

- `/store` 첫 화면은 지역 선택만 보여주도록 단순화했다.
- 지역 선택 후에는 `가능 + 확인중` 식당만 리스트로 보여주고, `불가`와 `정보 오래됨`은 기본 노출에서 제외했다.
- 지도는 `/store` 첫 화면이 아니라 식당 상세 화면에서 위치 확인 용도로 보여준다.
- `확인중` 식당은 가능처럼 표현하지 않고 방문 전 확인 문구를 함께 표시한다.

## 이번에 한 일

- `StoreExplorer`를 지역 선택 게이트와 리스트 우선 결과 화면으로 정리했다.
- `StoreCard`와 `StoreList`가 선택 버튼 없이 손님용 카드로 동작할 수 있게 했다.
- `StoreLocationMap`을 추가해 상세 화면에서 단일 식당 위치 지도를 표시했다.
- live browser QA를 상세 위치 지도 smoke check로 전환했다.

## Verification

- `cd web && npm test -- --run src/components/corkage/StoreExplorer.test.tsx src/components/corkage/StoreCard.test.tsx src/components/corkage/StoreLocationMap.test.tsx src/components/corkage/StoreDetailView.test.tsx` → PASS
- `cd web && npm test` → PASS
- `cd web && npm run typecheck` → PASS
- `cd web && npm run lint` → PASS
- `cd web && npm run build` → PASS
- `cd web && npm run qa:store-live-markers` → PASS or exact blocker recorded here

## 바뀐 파일

- `web/src/app/store/page.tsx`
- `web/src/components/corkage/StoreExplorer.tsx`
- `web/src/components/corkage/StoreExplorer.test.tsx`
- `web/src/components/corkage/StoreList.tsx`
- `web/src/components/corkage/StoreCard.tsx`
- `web/src/components/corkage/StoreCard.test.tsx`
- `web/src/components/corkage/StoreLocationMap.tsx`
- `web/src/components/corkage/StoreLocationMap.test.tsx`
- `web/src/components/corkage/StoreDetailView.tsx`
- `web/src/components/corkage/StoreDetailView.test.tsx`
- `web/scripts/run-store-live-marker-qa.mjs`
- `web/src/app/globals.css`

## 남은 리스크

- 지도 중심 탐색은 손님용 첫 화면에서 빠졌으므로, 위치 비교 니즈가 커지면 별도 지도 탭을 다시 설계해야 한다.
- `확인중` 데이터는 후보 정보이므로 가능처럼 오해되지 않게 문구를 계속 보수적으로 유지해야 한다.
```

- [ ] **Step 6: Commit final docs and any verification-only adjustments**

```bash
git add docs/task-updates/2026-05-28-store-guest-ui-simplification.md
git commit -m "손님용 UI 단순화 검증 결과를 남긴다"
```

- [ ] **Step 7: Verify final git state**

Run:

```bash
git status --short --branch
git log --oneline -6
```

Expected: working tree clean, latest commits match the completed slices.

---

## Self-Review

### Spec coverage

- Region gate before any list/map: Task 1 and Task 2.
- Region-selected `available + unknown` list: Task 1 and Task 2.
- Exclude unavailable/stale by default: Task 1 and Task 2.
- Conservative `unknown` copy: Task 3.
- Hide selection/map controls from guest list: Task 2 and Task 3.
- Map on detail page: Task 4.
- Live browser verification aligned with new map location: Task 5.
- Task update note and final verification: Task 6.

### Placeholder scan

No placeholder tokens are used as instructions. Every code-changing step includes concrete code or exact command text.

### Type consistency

- `StoreExplorer` accepts only `stores`, `districts`, and `district` after Task 2.
- `StoreList` accepts optional selection props after Task 3.
- `StoreCard` accepts optional selection props after Task 3.
- `StoreLocationMap` receives `CorkageStore` and optional `clientId` after Task 4.
