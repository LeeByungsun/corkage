import type { CorkageStore } from '../types/corkage';

export type StoreMapPoint = {
  placeId: string;
  name: string;
  district: string;
  lat: number;
  lng: number;
};

export function toStoreMapPoints(stores: CorkageStore[]): StoreMapPoint[] {
  return stores
    .filter(
      (store) =>
        Number.isFinite(store.lat) &&
        Number.isFinite(store.lng) &&
        Math.abs(store.lat) > 0 &&
        Math.abs(store.lng) > 0,
    )
    .map((store) => ({
      placeId: store.placeId,
      name: store.name,
      district: store.district,
      lat: store.lat,
      lng: store.lng,
    }));
}

export function getStoreMapCenter(points: StoreMapPoint[]) {
  if (points.length === 0) {
    return null;
  }

  const totals = points.reduce(
    (acc, point) => ({
      lat: acc.lat + point.lat,
      lng: acc.lng + point.lng,
    }),
    { lat: 0, lng: 0 },
  );

  return {
    lat: totals.lat / points.length,
    lng: totals.lng / points.length,
  };
}
