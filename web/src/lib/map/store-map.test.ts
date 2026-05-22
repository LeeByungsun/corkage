import { getStoreMapCenter, toStoreMapPoints } from './store-map';
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
});
