import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { StoreMap } from './StoreMap';
import { getStoreById } from '../../lib/repo/corkage-repo';
import {
  getNaverMapsScriptUrl,
  loadNaverMaps,
} from '../../lib/map/naver-maps-loader';

const mockLoadNaverMaps = vi.hoisted(() => vi.fn());
const markerClickHandlers: Array<() => void> = [];

vi.mock('../../lib/map/naver-maps-loader', () => ({
  getNaverMapsScriptUrl: vi.fn((clientId: string) => `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${clientId}`),
  loadNaverMaps: mockLoadNaverMaps,
}));

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

  it('shows an empty-state message when there are no map points', () => {
    render(
      <StoreMap
        stores={[]}
        clientId="test-client-id"
        currentLocation={null}
        locationError=""
        locationLoading={false}
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

    const addListener = vi.fn((target: unknown, eventName: string, handler: () => void) => {
      if (eventName === 'click') {
        markerClickHandlers.push(handler);
      }
      return { remove: vi.fn() };
    });
    const removeListener = vi.fn();
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
    const markerConstructor = vi.fn(function MarkerMock() {
      return {
        setMap: vi.fn(),
      };
    });
    const latLngConstructor = vi.fn(function LatLngMock(lat: number, lng: number) {
      return { lat, lng };
    });

    vi.mocked(loadNaverMaps).mockResolvedValue({
      maps: {
        Event: { addListener, removeListener },
        Map: mapConstructor,
        Marker: markerConstructor,
        LatLng: latLngConstructor,
      },
    } as any);

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

  it('builds the official NAVER Maps SDK URL with ncpKeyId', () => {
    expect(getNaverMapsScriptUrl('abc-123')).toBe(
      'https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=abc-123',
    );
  });
});
