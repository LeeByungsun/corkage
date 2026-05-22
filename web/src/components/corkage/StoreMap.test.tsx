import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { StoreMap } from './StoreMap';
import { getStoreById } from '../../lib/repo/corkage-repo';
import {
  getNaverMapsScriptUrl,
  loadNaverMaps,
} from '../../lib/map/naver-maps-loader';

vi.mock('../../lib/map/naver-maps-loader', async () => {
  const actual = await vi.importActual<
    typeof import('../../lib/map/naver-maps-loader')
  >('../../lib/map/naver-maps-loader');

  return {
    ...actual,
    loadNaverMaps: vi.fn(),
  };
});

describe('StoreMap', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders an env guidance fallback when the client id is missing', () => {
    const store = getStoreById('seoul-vin-table');

    expect(store).toBeDefined();

    render(<StoreMap stores={[store!]} />);

    expect(
      screen.getByText('지도 키를 아직 연결하지 않았습니다.'),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/NEXT_PUBLIC_NAVER_MAPS_CLIENT_ID/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/빈테이블 청담 · 강남 · 37.5252, 127.0482/),
    ).toBeInTheDocument();
  });

  it('shows an empty-state message when there are no map points', () => {
    render(<StoreMap stores={[]} clientId="test-client-id" />);

    expect(
      screen.getByText('지도에 표시할 좌표가 아직 없습니다.'),
    ).toBeInTheDocument();
  });

  it('loads the NAVER Maps SDK when a client id exists', async () => {
    const mapConstructor = vi.fn(function MapMock() {
      return {
        fitBounds: vi.fn(),
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
    const latLngConstructor = vi.fn(function LatLngMock(
      lat: number,
      lng: number,
    ) {
      return { lat, lng };
    });
    vi.mocked(loadNaverMaps).mockResolvedValue({
      maps: {
        Map: mapConstructor,
        Marker: markerConstructor,
        LatLng: latLngConstructor,
      },
    } as any);

    const store = getStoreById('seoul-vin-table');

    expect(store).toBeDefined();

    render(<StoreMap stores={[store!]} clientId="test-client-id" />);

    await waitFor(() =>
      expect(loadNaverMaps).toHaveBeenCalledWith('test-client-id'),
    );
    expect(mapConstructor).toHaveBeenCalled();
    expect(markerConstructor).toHaveBeenCalled();
    expect(latLngConstructor).toHaveBeenCalled();
  });

  it('builds the official NAVER Maps SDK URL with ncpKeyId', () => {
    expect(getNaverMapsScriptUrl('abc-123')).toBe(
      'https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=abc-123',
    );
  });
});
