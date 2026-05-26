import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { StoreExplorer } from './StoreExplorer';

const mockUseCanonicalStores = vi.hoisted(() => vi.fn());
const replaceMock = vi.fn();

vi.mock('next/navigation', () => ({
  usePathname: () => '/store',
  useRouter: () => ({ replace: replaceMock }),
  useSearchParams: () => new URLSearchParams('status=all&district=all'),
}));

vi.mock('../../lib/repo/use-canonical-stores', () => ({
  useCanonicalStores: mockUseCanonicalStores,
}));

vi.mock('./StoreMap', () => ({
  StoreMap: (props: {
    currentLocation: { lat: number; lng: number } | null;
    onBoundsChange: (bounds: { north: number; south: number; east: number; west: number } | null) => void;
    onRequestCurrentLocation: () => void;
    onSelectPlaceId: (placeId: string) => void;
    selectedPlaceId: string | null;
    stores: Array<{ placeId: string; name: string }>;
  }) => (
    <div>
      <button type="button" onClick={props.onRequestCurrentLocation}>
        현재 위치 가져오기
      </button>
      {props.currentLocation ? <p>현재 위치 기준 정렬</p> : null}
      <button type="button" onClick={() => props.onBoundsChange({ north: 37.53, south: 37.52, east: 127.06, west: 127.04 })}>
        지도 bounds 좁히기
      </button>
      {props.stores.map((store) => (
        <button
          key={store.placeId}
          aria-label={`${store.name} 마커 선택`}
          aria-pressed={props.selectedPlaceId === store.placeId}
          onClick={() => props.onSelectPlaceId(store.placeId)}
          type="button"
        >
          {store.name} 선택
        </button>
      ))}
    </div>
  ),
}));

describe('StoreExplorer', () => {
  beforeEach(() => {
    replaceMock.mockReset();
    mockUseCanonicalStores.mockReturnValue([
      {
        placeId: 'near-store',
        name: '가까운 식당',
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
        sourceNote: '테스트',
        conditionNote: '테스트',
      },
      {
        placeId: 'far-store',
        name: '먼 식당',
        address: '서울시 성수구 2',
        roadAddress: '서울시 성수구 2',
        lat: 37.5602,
        lng: 127.1502,
        category: '비스트로',
        district: '성수',
        corkageStatus: 'available',
        freshnessState: 'fresh',
        confidenceLabel: 'medium',
        verifiedAt: '2026-05-22',
        sourceType: 'operator_verified',
        sourceNote: '테스트',
        conditionNote: '테스트',
      },
    ]);

    vi.stubGlobal('navigator', {
      geolocation: {
        getCurrentPosition: vi.fn((success: PositionCallback) =>
          success({
            coords: {
              latitude: 37.5252,
              longitude: 127.0482,
              accuracy: 30,
            },
          } as GeolocationPosition),
        ),
      },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it('gets current location and sorts stores by nearest first', async () => {
    render(<StoreExplorer initialRadius="all" initialSelectedPlaceId="" initialSort="default" status="all" district="all" maxFeeInput="" />);

    fireEvent.click(screen.getByRole('button', { name: '현재 위치 가져오기' }));

    await waitFor(() =>
      expect(screen.getByText(/현재 위치 기준 정렬/)).toBeInTheDocument(),
    );

    expect(
      screen.getByRole('heading', { level: 2, name: '가까운 식당' }),
    ).toBeInTheDocument();
    expect(screen.getAllByText('0m').length).toBeGreaterThan(0);
    expect(
      screen.getByLabelText('현재 위치 기준 가장 가까운 식당'),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 2, name: '가까운 식당' }).closest('article'),
    ).toHaveClass('card--nearest');
  });

  it('applies radius filter after current location is available', async () => {
    render(<StoreExplorer initialRadius="all" initialSelectedPlaceId="" initialSort="default" status="all" district="all" maxFeeInput="" />);

    fireEvent.click(screen.getByRole('button', { name: '현재 위치 가져오기' }));

    await waitFor(() =>
      expect(screen.getByText(/현재 위치 기준 정렬/)).toBeInTheDocument(),
    );

    fireEvent.change(screen.getByLabelText('반경'), {
      target: { value: '1000' },
    });

    expect(screen.getByText('1개 결과')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '가까운 식당' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: '먼 식당' })).not.toBeInTheDocument();
  });

  it('syncs marker selection and card selection in both directions', () => {
    render(<StoreExplorer initialRadius="all" initialSelectedPlaceId="" initialSort="default" status="all" district="all" maxFeeInput="" />);

    fireEvent.click(screen.getByRole('button', { name: '먼 식당 마커 선택' }));

    expect(screen.getByRole('button', { name: '먼 식당 카드 선택' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: '먼 식당 마커 선택' })).toHaveAttribute('aria-pressed', 'true');

    const farCard = screen.getByRole('heading', { name: '먼 식당' }).closest('article');
    expect(farCard).not.toBeNull();
    expect(farCard).toHaveClass('card--selected');
    expect(within(farCard as HTMLElement).getByRole('button', { name: '먼 식당 카드 선택' })).toHaveAttribute('aria-pressed', 'true');

    fireEvent.click(screen.getByRole('button', { name: '가까운 식당 카드 선택' }));

    expect(screen.getByRole('button', { name: '가까운 식당 카드 선택' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: '가까운 식당 마커 선택' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('limits the list to stores inside the current map bounds', () => {
    render(<StoreExplorer initialRadius="all" initialSelectedPlaceId="" initialSort="default" status="all" district="all" maxFeeInput="" />);

    fireEvent.click(screen.getByRole('button', { name: '지도 bounds 좁히기' }));

    expect(screen.getByText('1개 결과')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '가까운 식당' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: '먼 식당' })).not.toBeInTheDocument();
  });

  it('writes selected/sort/radius state back to the URL query', async () => {
    render(<StoreExplorer initialRadius="all" initialSelectedPlaceId="" initialSort="default" status="all" district="all" maxFeeInput="" />);

    fireEvent.click(screen.getByRole('button', { name: '현재 위치 가져오기' }));
    await waitFor(() => expect(replaceMock).toHaveBeenCalled());

    fireEvent.click(screen.getByRole('button', { name: '먼 식당 마커 선택' }));
    fireEvent.change(screen.getByLabelText('반경'), {
      target: { value: '3000' },
    });

    const calls = replaceMock.mock.calls.map((call) => String(call[0]));
    expect(calls.some((value) => value.includes('sort=distance'))).toBe(true);
    expect(calls.some((value) => value.includes('radius=3000'))).toBe(true);
    expect(calls.some((value) => value.includes('selected=far-store'))).toBe(true);
  });
});
