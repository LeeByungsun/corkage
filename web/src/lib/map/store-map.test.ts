import {
  attachDistanceToStores,
  filterStoresByRadius,
  getDistanceKmLabel,
  getGeoDistanceMeters,
  getStoreMapCenter,
  sortStoresByDistance,
  toStoreMapPoints,
} from './store-map';
import { getStoreById } from '../repo/corkage-repo';

describe('store-map helpers', () => {
  it('keeps only stores with valid coordinates and exposes point data', () => {
    const store = getStoreById('seoul-vin-table');

    expect(store).toBeDefined();

    const points = toStoreMapPoints([
      store!,
      {
        ...store!,
        placeId: 'invalid-store',
        lat: 0,
      },
    ]);

    expect(points).toEqual([
      {
        placeId: 'seoul-vin-table',
        name: '빈테이블 청담',
        district: '강남',
        lat: 37.5252,
        lng: 127.0482,
      },
    ]);
  });

  it('calculates the average center for visible map points', () => {
    const points = [
      { placeId: 'a', name: 'A', district: '강남', lat: 37.5, lng: 127.0 },
      { placeId: 'b', name: 'B', district: '성수', lat: 37.6, lng: 127.1 },
    ];

    expect(getStoreMapCenter(points)).toEqual({
      lat: 37.55,
      lng: 127.05,
    });
  });

  it('calculates geo distance in meters', () => {
    const distance = getGeoDistanceMeters(
      { lat: 37.5252, lng: 127.0482 },
      { lat: 37.5665, lng: 126.978 },
    );

    expect(Math.round(distance / 100) * 100).toBe(7700);
  });

  it('formats short and long distance labels', () => {
    expect(getDistanceKmLabel(420)).toBe('420m');
    expect(getDistanceKmLabel(1820)).toBe('1.8km');
  });

  it('attaches distance metadata and sorts by nearest first', () => {
    const first = getStoreById('seoul-vin-table');
    const second = getStoreById('han-river-grill');

    expect(first).toBeDefined();
    expect(second).toBeDefined();

    const withDistance = attachDistanceToStores([first!, second!], {
      lat: 37.5252,
      lng: 127.0482,
    });
    const sorted = sortStoresByDistance(withDistance);

    expect(withDistance[0]?.distanceMeters).toBe(0);
    expect(sorted[0]?.placeId).toBe('seoul-vin-table');
    expect(sorted[1]?.distanceMeters).toBeGreaterThan(0);
  });

  it('filters stores by radius when current location exists', () => {
    const first = getStoreById('seoul-vin-table');
    const second = getStoreById('han-river-grill');

    expect(first).toBeDefined();
    expect(second).toBeDefined();

    const filtered = filterStoresByRadius(
      attachDistanceToStores([first!, second!], {
        lat: 37.5252,
        lng: 127.0482,
      }),
      1000,
    );

    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.placeId).toBe('seoul-vin-table');
  });
});
