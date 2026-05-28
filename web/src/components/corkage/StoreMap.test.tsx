import { act, render, screen, waitFor, within } from '@testing-library/react';
import { useState } from 'react';
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
type MockMapInstance = {
  destroy: ReturnType<typeof vi.fn>;
  fitBounds: ReturnType<typeof vi.fn>;
  getBounds: ReturnType<typeof vi.fn>;
  setCenter: ReturnType<typeof vi.fn>;
  setZoom: ReturnType<typeof vi.fn>;
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
  const mapInstances: MockMapInstance[] = [];
  const mapConstructor = vi.fn(function MapMock() {
    const mapInstance = {
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

    mapInstances.push(mapInstance);

    return mapInstance;
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
    mapInstances,
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
    const mapInstance = mapConstructor.mock.results[0]?.value as
      | { setCenter: ReturnType<typeof vi.fn>; setZoom: ReturnType<typeof vi.fn> }
      | undefined;
    expect(mapInstance).toBeDefined();
    expect(mapInstance?.setCenter).not.toHaveBeenCalled();
    expect(mapInstance?.setZoom).not.toHaveBeenCalled();
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
    expect(mapInstance?.setCenter).not.toHaveBeenCalled();
    expect(mapInstance?.setZoom).not.toHaveBeenCalled();

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

  it('selects a live marker without changing the current map viewport', async () => {
    markerClickHandlers.length = 0;

    const {
      mapConstructor,
      mapInstances,
      markerConstructor,
      markerInstances,
    } = setupLiveMapMocks({ captureClickHandlers: true });

    const stores: StoreWithDistance[] = [
      {
        placeId: 'selected-store',
        name: '선택 식당',
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
        placeId: 'other-store',
        name: '다른 식당',
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
    const onSelectPlaceId = vi.fn();
    function StoreMapSelectionHarness() {
      const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);

      return (
        <StoreMap
          clientId="test-client-id"
          stores={stores}
          currentLocation={null}
          locationError=""
          locationLoading={false}
          nearestPlaceId={null}
          onRequestCurrentLocation={() => {}}
          onMoveToCurrentLocation={() => {}}
          onSelectPlaceId={(placeId) => {
            onSelectPlaceId(placeId);
            setSelectedPlaceId(placeId);
          }}
          onBoundsChange={() => {}}
          selectedPlaceId={selectedPlaceId}
        />
      );
    }

    render(<StoreMapSelectionHarness />);

    await waitFor(() => expect(markerConstructor).toHaveBeenCalledTimes(2));

    const firstMarkerOptions = markerConstructor.mock.calls[0]?.[0] as
      | MockMarkerOptions
      | undefined;
    const mapInstance = mapInstances[0]!;

    expect(firstMarkerOptions?.icon?.content).toContain('data-marker-state="default"');

    mapInstance.fitBounds.mockClear();
    mapInstance.setCenter.mockClear();
    mapInstance.setZoom.mockClear();

    markerInstances.forEach((marker) => {
      marker.setIcon.mockClear();
      marker.setZIndex.mockClear();
    });

    await act(async () => {
      markerClickHandlers[0]!();
    });
    expect(onSelectPlaceId).toHaveBeenCalledWith('selected-store');

    expect(await screen.findByText('선택한 식당')).toBeInTheDocument();
    await waitFor(() => expect(markerInstances[0]?.setIcon).toHaveBeenCalled());
    await new Promise((resolve) => setTimeout(resolve, 0));

    const selectedMarkerContent =
      markerInstances[0]?.setIcon.mock.lastCall?.[0].content ?? '';

    expect(selectedMarkerContent).toContain('data-marker-state="selected"');
    expect(markerInstances[0]?.setZIndex).toHaveBeenLastCalledWith(30);
    expect(mapConstructor).toHaveBeenCalledTimes(1);
    expect(markerConstructor).toHaveBeenCalledTimes(2);
    expect(mapInstance.fitBounds).not.toHaveBeenCalled();
    expect(mapInstance.setCenter).not.toHaveBeenCalled();
    expect(mapInstance.setZoom).not.toHaveBeenCalled();
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
            conditionNote: '750ml 와인 기준, 사전 예약 시 반입 가능',
            corkageFee: 15000,
            feeUnit: 'per_bottle',
            rawFacilities: ['콜키지 가능', '예약', '룸'],
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
    expect(within(selectedSummary as HTMLElement).getByText('가능')).toBeInTheDocument();
    expect(within(selectedSummary as HTMLElement).getByText('15,000원 / 병')).toBeInTheDocument();
    expect(
      within(selectedSummary as HTMLElement).getByText(
        '750ml 와인 기준, 사전 예약 시 반입 가능',
      ),
    ).toBeInTheDocument();
    expect(within(selectedSummary as HTMLElement).getByText('높은 신뢰')).toBeInTheDocument();
    expect(within(selectedSummary as HTMLElement).getByText('최신 기준 안')).toBeInTheDocument();
    expect(
      within(selectedSummary as HTMLElement).getByText(
        '운영 정책상 canonical 정보만 보수적으로 표시합니다.',
      ),
    ).toBeInTheDocument();
    expect(
      within(selectedSummary as HTMLElement).getByLabelText(
        '네이버 편의정보 콜키지 태그',
      ),
    ).toHaveTextContent('콜키지 가능');
    expect(selectedButton).toHaveClass('map-point-button--selected');
    expect(selectedButton).toHaveAttribute('aria-pressed', 'true');
    expect(selectedButton.closest('li')).toHaveClass('map-point-item--nearest');
  });

  it('shows reviewable corkage details in the selected live map summary', async () => {
    setupLiveMapMocks();

    const selectedStore: StoreWithDistance = {
      placeId: 'reviewable-store',
      name: '검수 식당',
      address: '서울시 강남구 3',
      roadAddress: '서울시 강남구 3',
      lat: 37.5272,
      lng: 127.0502,
      category: '다이닝',
      district: '강남',
      rawFacilities: ['콜키지 가능', '발렛'],
      corkageStatus: 'available',
      freshnessState: 'fresh',
      confidenceLabel: 'high',
      verifiedAt: '2026-05-22',
      sourceType: 'store_direct',
      sourceNote: '매장 유선 확인',
      conditionNote: '와인 1병까지 반입 가능',
      corkageFee: 25000,
      feeUnit: 'per_bottle',
    };

    render(
      <StoreMap
        clientId="test-client-id"
        stores={[selectedStore]}
        currentLocation={null}
        locationError=""
        locationLoading={false}
        nearestPlaceId={null}
        onRequestCurrentLocation={() => {}}
        onMoveToCurrentLocation={() => {}}
        onSelectPlaceId={() => {}}
        onBoundsChange={() => {}}
        selectedPlaceId="reviewable-store"
      />,
    );

    await waitFor(() => expect(loadNaverMaps).toHaveBeenCalledWith('test-client-id'));

    const selectedSummary = screen.getByText('선택한 식당').closest('.map-selection-card');

    expect(selectedSummary).not.toBeNull();
    expect(within(selectedSummary as HTMLElement).getByText('검수 식당')).toBeInTheDocument();
    expect(within(selectedSummary as HTMLElement).getByText('가능')).toBeInTheDocument();
    expect(within(selectedSummary as HTMLElement).getByText('25,000원 / 병')).toBeInTheDocument();
    expect(
      within(selectedSummary as HTMLElement).getByText('와인 1병까지 반입 가능'),
    ).toBeInTheDocument();
    expect(
      within(selectedSummary as HTMLElement).getByText(
        '운영 정책상 canonical 정보만 보수적으로 표시합니다.',
      ),
    ).toBeInTheDocument();
    expect(
      within(selectedSummary as HTMLElement).getByLabelText('네이버 편의정보 콜키지 태그'),
    ).toHaveTextContent('콜키지 가능');
  });

  it('builds the official NAVER Maps SDK URL with ncpKeyId', () => {
    expect(getNaverMapsScriptUrl('abc-123')).toBe(
      'https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=abc-123',
    );
  });
});
