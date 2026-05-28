import { render, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { StoreMap } from './StoreMap';
import { getStoreById } from '../../lib/repo/corkage-repo';
import type { StoreWithDistance } from '../../lib/map/store-map';
import {
  getNaverMapsScriptUrl,
  loadNaverMaps,
} from '../../lib/map/naver-maps-loader';

const mockLoadNaverMaps = vi.hoisted(() => vi.fn());
const markerClickHandlers: Array<() => void> = [];
type MockMarkerInstance = {
  setIcon: ReturnType<typeof vi.fn>;
  setMap: ReturnType<typeof vi.fn>;
  setPosition: ReturnType<typeof vi.fn>;
  setZIndex: ReturnType<typeof vi.fn>;
};
type MockMarkerOptions = {
  icon?: { content: string };
  zIndex?: number;
};

vi.mock('../../lib/map/naver-maps-loader', () => ({
  getNaverMapsScriptUrl: vi.fn((clientId: string) => `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${clientId}`),
  loadNaverMaps: mockLoadNaverMaps,
}));

function setupLiveMapMocks({
  captureClickHandlers = false,
}: {
  captureClickHandlers?: boolean;
} = {}) {
  const addListener = vi.fn((target: unknown, eventName: string, handler: () => void) => {
    if (captureClickHandlers && eventName === 'click') {
      markerClickHandlers.push(handler);
    }

    return { remove: vi.fn() };
  });
  const mapConstructor = vi.fn(function MapMock() {
    return {
      fitBounds: vi.fn(),
      getBounds: vi.fn(() => ({
        north: () => 37.54,
        south: () => 37.52,
        east: () => 127.06,
        west: () => 127.04,
      })),
      setCenter: vi.fn(),
      setZoom: vi.fn(),
      destroy: vi.fn(),
    };
  });
  const markerInstances: MockMarkerInstance[] = [];
  const markerConstructor = vi.fn(function MarkerMock(_options?: MockMarkerOptions) {
    const marker = {
      setIcon: vi.fn(),
      setMap: vi.fn(),
      setPosition: vi.fn(),
      setZIndex: vi.fn(),
    };
    markerInstances.push(marker);
    return marker;
  });
  const latLngConstructor = vi.fn(function LatLngMock(lat: number, lng: number) {
    return { lat, lng };
  });

  vi.mocked(loadNaverMaps).mockResolvedValue({
    maps: {
      Event: { addListener, removeListener: vi.fn() },
      Map: mapConstructor,
      Marker: markerConstructor,
      LatLng: latLngConstructor,
    },
  } as any);

  return {
    addListener,
    latLngConstructor,
    mapConstructor,
    markerConstructor,
    markerInstances,
  };
}

describe('StoreMap', () => {
  it('renders an env guidance fallback when the client id is missing', () => {
    const store = getStoreById('seoul-vin-table');

    expect(store).toBeDefined();

    render(
      <StoreMap
        stores={[store!]}
        currentLocation={null}
        locationError=""
        locationLoading={false}
        nearestPlaceId={null}
        onRequestCurrentLocation={() => {}}
        onMoveToCurrentLocation={() => {}}
        onSelectPlaceId={() => {}}
        onBoundsChange={() => {}}
        selectedPlaceId={null}
      />,
    );

    expect(screen.getByText('지도 키를 아직 연결하지 않았습니다.')).toBeInTheDocument();
    expect(screen.getByText(/NEXT_PUBLIC_NAVER_MAPS_CLIENT_ID/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '빈테이블 청담 마커 선택' })).toBeInTheDocument();
  });

  it('keeps the selected fallback marker visually synced and shows nearest state when a place is preselected', () => {
    const store = getStoreById('seoul-vin-table');

    expect(store).toBeDefined();

    render(
      <StoreMap
        stores={[
          {
            ...store!,
            distanceMeters: 250,
          },
        ]}
        currentLocation={null}
        locationError=""
        locationLoading={false}
        nearestPlaceId="seoul-vin-table"
        onRequestCurrentLocation={() => {}}
        onMoveToCurrentLocation={() => {}}
        onSelectPlaceId={() => {}}
        onBoundsChange={() => {}}
        selectedPlaceId="seoul-vin-table"
      />,
    );

    expect(screen.getByText('선택한 식당')).toBeInTheDocument();
    expect(screen.getByText('현재 위치 기준 250m')).toBeInTheDocument();

    const markerButton = screen.getByRole('button', { name: '빈테이블 청담 마커 선택' });
    expect(markerButton).toHaveAttribute('aria-pressed', 'true');
    expect(markerButton.closest('li')).toHaveClass(
      'map-point-item',
      'map-point-item--nearest',
      'map-point-item--selected',
    );
    expect(screen.getByText('선택됨')).toBeInTheDocument();
    expect(screen.getAllByText('가장 가까움').length).toBeGreaterThan(0);
  });

  it('shows an empty-state message when there are no map points', () => {
    render(
      <StoreMap
        stores={[]}
        clientId="test-client-id"
        currentLocation={null}
        locationError=""
        locationLoading={false}
        nearestPlaceId={null}
        onRequestCurrentLocation={() => {}}
        onMoveToCurrentLocation={() => {}}
        onSelectPlaceId={() => {}}
        onBoundsChange={() => {}}
        selectedPlaceId={null}
      />,
    );

    expect(screen.getByText('지도에 표시할 좌표가 아직 없습니다.')).toBeInTheDocument();
  });

  it('loads the NAVER Maps SDK and connects marker clicks to store selection', async () => {
    markerClickHandlers.length = 0;

    const {
      addListener,
      latLngConstructor,
      mapConstructor,
      markerConstructor,
    } = setupLiveMapMocks({ captureClickHandlers: true });

    const onSelectPlaceId = vi.fn();
    const onBoundsChange = vi.fn();

    render(
      <StoreMap
        clientId="test-client-id"
        stores={[
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
        ]}
        currentLocation={null}
        locationError=""
        locationLoading={false}
        nearestPlaceId={null}
        onRequestCurrentLocation={() => {}}
        onMoveToCurrentLocation={() => {}}
        onSelectPlaceId={onSelectPlaceId}
        onBoundsChange={onBoundsChange}
        selectedPlaceId={null}
      />,
    );

    await waitFor(() => expect(loadNaverMaps).toHaveBeenCalledWith('test-client-id'));
    expect(mapConstructor).toHaveBeenCalled();
    expect(markerConstructor).toHaveBeenCalled();
    expect(latLngConstructor).toHaveBeenCalled();
    expect(addListener).toHaveBeenCalled();
    expect(onBoundsChange).toHaveBeenCalled();

    markerClickHandlers[0]!();
    expect(onSelectPlaceId).toHaveBeenCalledWith('near-store');
  });

  it('updates live marker icons for selected and nearest states without remounting the map', async () => {
    const {
      mapConstructor,
      markerConstructor,
      markerInstances,
    } = setupLiveMapMocks();

    const stores: StoreWithDistance[] = [
      {
        placeId: 'selected-store',
        name: '기준 식당',
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
        placeId: 'near-store',
        name: '가까운 식당',
        address: '서울시 강남구 2',
        roadAddress: '서울시 강남구 2',
        lat: 37.5262,
        lng: 127.0492,
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
    ];

    const { rerender } = render(
      <StoreMap
        clientId="test-client-id"
        stores={stores}
        currentLocation={null}
        locationError=""
        locationLoading={false}
        nearestPlaceId="near-store"
        onRequestCurrentLocation={() => {}}
        onMoveToCurrentLocation={() => {}}
        onSelectPlaceId={() => {}}
        onBoundsChange={() => {}}
        selectedPlaceId="selected-store"
      />,
    );

    await waitFor(() => expect(markerConstructor).toHaveBeenCalledTimes(2));

    expect(mapConstructor).toHaveBeenCalledTimes(1);
    const firstMarkerOptions = markerConstructor.mock.calls[0]?.[0] as
      | MockMarkerOptions
      | undefined;
    const secondMarkerOptions = markerConstructor.mock.calls[1]?.[0] as
      | MockMarkerOptions
      | undefined;

    expect(firstMarkerOptions).toEqual(
      expect.objectContaining({
        zIndex: 30,
        icon: expect.objectContaining({
          content: expect.stringContaining('data-marker-state="selected"'),
        }),
      }),
    );
    expect(secondMarkerOptions).toEqual(
      expect.objectContaining({
        zIndex: 20,
        icon: expect.objectContaining({
          content: expect.stringContaining('data-marker-state="nearest"'),
        }),
      }),
    );

    markerInstances.forEach((marker) => {
      marker.setIcon.mockClear();
      marker.setZIndex.mockClear();
    });

    rerender(
      <StoreMap
        clientId="test-client-id"
        stores={stores}
        currentLocation={null}
        locationError=""
        locationLoading={false}
        nearestPlaceId="near-store"
        onRequestCurrentLocation={() => {}}
        onMoveToCurrentLocation={() => {}}
        onSelectPlaceId={() => {}}
        onBoundsChange={() => {}}
        selectedPlaceId="near-store"
      />,
    );

    await waitFor(() => {
      expect(markerInstances[0]?.setIcon).toHaveBeenCalledTimes(1);
      expect(markerInstances[1]?.setIcon).toHaveBeenCalledTimes(1);
    });

    expect(mapConstructor).toHaveBeenCalledTimes(1);
    expect(markerConstructor).toHaveBeenCalledTimes(2);

    const deselectedMarkerContent =
      markerInstances[0]?.setIcon.mock.lastCall?.[0].content ?? '';
    const selectedNearestMarkerContent =
      markerInstances[1]?.setIcon.mock.lastCall?.[0].content ?? '';

    expect(deselectedMarkerContent).not.toContain('선택');
    expect(deselectedMarkerContent).not.toContain('가장 가까움');
    expect(selectedNearestMarkerContent).toContain('data-marker-state="selected-nearest"');
    expect(markerInstances[0]?.setZIndex).toHaveBeenLastCalledWith(10);
    expect(markerInstances[1]?.setZIndex).toHaveBeenLastCalledWith(30);
  });

  it('keeps the live map mounted when equivalent store arrays or current location updates arrive', async () => {
    const {
      mapConstructor,
      markerConstructor,
      markerInstances,
    } = setupLiveMapMocks();

    const store: StoreWithDistance = {
      placeId: 'stable-store',
      name: '안정 식당',
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
    };

    const { rerender } = render(
      <StoreMap
        clientId="test-client-id"
        stores={[store]}
        currentLocation={null}
        locationError=""
        locationLoading={false}
        nearestPlaceId={null}
        onRequestCurrentLocation={() => {}}
        onMoveToCurrentLocation={() => {}}
        onSelectPlaceId={() => {}}
        onBoundsChange={() => {}}
        selectedPlaceId={null}
      />,
    );

    await waitFor(() => expect(markerConstructor).toHaveBeenCalledTimes(1));

    rerender(
      <StoreMap
        clientId="test-client-id"
        stores={[{ ...store }]}
        currentLocation={null}
        locationError=""
        locationLoading={false}
        nearestPlaceId={null}
        onRequestCurrentLocation={() => {}}
        onMoveToCurrentLocation={() => {}}
        onSelectPlaceId={() => {}}
        onBoundsChange={() => {}}
        selectedPlaceId={null}
      />,
    );

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(mapConstructor).toHaveBeenCalledTimes(1);
    expect(markerConstructor).toHaveBeenCalledTimes(1);
    expect(markerInstances[0]?.setMap).not.toHaveBeenCalled();

    rerender(
      <StoreMap
        clientId="test-client-id"
        stores={[{ ...store }]}
        currentLocation={{ lat: 37.5262, lng: 127.0492 }}
        locationError=""
        locationLoading={false}
        nearestPlaceId="stable-store"
        onRequestCurrentLocation={() => {}}
        onMoveToCurrentLocation={() => {}}
        onSelectPlaceId={() => {}}
        onBoundsChange={() => {}}
        selectedPlaceId={null}
      />,
    );

    await waitFor(() => expect(markerConstructor).toHaveBeenCalledTimes(2));

    expect(mapConstructor).toHaveBeenCalledTimes(1);
    expect(markerInstances[0]?.setMap).not.toHaveBeenCalled();
  });

  it('shows the selected point summary in the live map sidebar', async () => {
    markerClickHandlers.length = 0;

    setupLiveMapMocks();

    render(
      <StoreMap
        clientId="test-client-id"
        stores={[
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
        ]}
        currentLocation={null}
        locationError=""
        locationLoading={false}
        nearestPlaceId="near-store"
        onRequestCurrentLocation={() => {}}
        onMoveToCurrentLocation={() => {}}
        onSelectPlaceId={() => {}}
        onBoundsChange={() => {}}
        selectedPlaceId="near-store"
      />,
    );

    await waitFor(() => expect(loadNaverMaps).toHaveBeenCalledWith('test-client-id'));

    const selectedButton = screen.getByRole('button', { name: '가까운 식당 마커 선택' });
    const selectedSummary = screen.getByText('선택한 식당').closest('.map-selection-card');

    expect(screen.getByText('선택한 식당')).toBeInTheDocument();
    expect(selectedSummary).not.toBeNull();
    expect(within(selectedSummary as HTMLElement).getByText('가까운 식당')).toBeInTheDocument();
    expect(
      within(selectedSummary as HTMLElement).getByLabelText(
        '현재 위치 기준 가장 가까운 선택 식당',
      ),
    ).toBeInTheDocument();
    expect(selectedButton).toHaveClass('map-point-button--selected');
    expect(selectedButton).toHaveAttribute('aria-pressed', 'true');
    expect(selectedButton.closest('li')).toHaveClass('map-point-item--nearest');
  });

  it('builds the official NAVER Maps SDK URL with ncpKeyId', () => {
    expect(getNaverMapsScriptUrl('abc-123')).toBe(
      'https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=abc-123',
    );
  });
});
