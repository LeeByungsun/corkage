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
