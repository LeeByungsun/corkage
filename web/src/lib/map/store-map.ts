import type { CorkageStore } from '../types/corkage';

export type GeoPoint = {
  lat: number;
  lng: number;
};

export type MapBounds = {
  north: number;
  south: number;
  east: number;
  west: number;
};

export type StoreMapPoint = {
  placeId: string;
  name: string;
  district: string;
  lat: number;
  lng: number;
};

export type StoreWithDistance = CorkageStore & {
  distanceMeters?: number;
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

export function getGeoDistanceMeters(from: GeoPoint, to: GeoPoint) {
  const earthRadiusMeters = 6371000;
  const latDelta = toRadians(to.lat - from.lat);
  const lngDelta = toRadians(to.lng - from.lng);
  const fromLat = toRadians(from.lat);
  const toLat = toRadians(to.lat);

  const haversine =
    Math.sin(latDelta / 2) ** 2 +
    Math.cos(fromLat) * Math.cos(toLat) * Math.sin(lngDelta / 2) ** 2;

  return 2 * earthRadiusMeters * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
}

export function attachDistanceToStores(
  stores: CorkageStore[],
  currentLocation: GeoPoint | null,
): StoreWithDistance[] {
  if (!currentLocation) {
    return stores;
  }

  return stores.map((store) => ({
    ...store,
    distanceMeters: getGeoDistanceMeters(currentLocation, {
      lat: store.lat,
      lng: store.lng,
    }),
  }));
}

export function sortStoresByDistance(stores: StoreWithDistance[]) {
  return [...stores].sort((left, right) => {
    if (left.distanceMeters === undefined && right.distanceMeters === undefined) {
      return left.name.localeCompare(right.name, 'ko-KR');
    }

    if (left.distanceMeters === undefined) {
      return 1;
    }

    if (right.distanceMeters === undefined) {
      return -1;
    }

    return left.distanceMeters - right.distanceMeters;
  });
}

export function filterStoresByRadius(
  stores: StoreWithDistance[],
  radiusMeters?: number,
) {
  if (!radiusMeters || !Number.isFinite(radiusMeters) || radiusMeters <= 0) {
    return stores;
  }

  return stores.filter(
    (store) =>
      store.distanceMeters !== undefined && store.distanceMeters <= radiusMeters,
  );
}

export function filterStoresByMapBounds(
  stores: StoreWithDistance[],
  bounds: MapBounds | null,
) {
  if (!bounds) {
    return stores;
  }

  return stores.filter(
    (store) =>
      store.lat >= bounds.south &&
      store.lat <= bounds.north &&
      isLngWithinBounds(store.lng, bounds),
  );
}

export function getDistanceKmLabel(distanceMeters?: number) {
  if (distanceMeters === undefined) {
    return null;
  }

  if (distanceMeters < 1000) {
    return `${Math.round(distanceMeters)}m`;
  }

  return `${(distanceMeters / 1000).toFixed(1)}km`;
}

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

function isLngWithinBounds(lng: number, bounds: MapBounds) {
  if (bounds.west <= bounds.east) {
    return lng >= bounds.west && lng <= bounds.east;
  }

  return lng >= bounds.west || lng <= bounds.east;
}
