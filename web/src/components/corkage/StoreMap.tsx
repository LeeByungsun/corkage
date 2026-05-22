'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  getDistanceKmLabel,
  getStoreMapCenter,
  toStoreMapPoints,
  type GeoPoint,
  type StoreWithDistance,
} from '../../lib/map/store-map';
import { loadNaverMaps } from '../../lib/map/naver-maps-loader';

type StoreMapProps = {
  stores: StoreWithDistance[];
  currentLocation: GeoPoint | null;
  locationError: string;
  locationLoading: boolean;
  onRequestCurrentLocation: () => void;
  onMoveToCurrentLocation: () => void;
  clientId?: string;
};

export function StoreMap({
  stores,
  currentLocation,
  locationError,
  locationLoading,
  onRequestCurrentLocation,
  onMoveToCurrentLocation,
  clientId = process.env.NEXT_PUBLIC_NAVER_MAPS_CLIENT_ID,
}: StoreMapProps) {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const points = useMemo(() => toStoreMapPoints(stores), [stores]);
  const storeMap = useMemo(
    () => new Map(stores.map((store) => [store.placeId, store] as const)),
    [stores],
  );
  const center = useMemo(() => getStoreMapCenter(points), [points]);
  const [loadError, setLoadError] = useState('');
  const mapInstanceRef = useRef<
    | {
        fitBounds: (coords: unknown[], options?: Record<string, unknown>) => void;
        setCenter: (coord: unknown) => void;
        setZoom: (zoom: number) => void;
        destroy?: () => void;
      }
    | null
  >(null);
  const naverRef = useRef<Awaited<ReturnType<typeof loadNaverMaps>> | null>(null);

  useEffect(() => {
    if (!clientId || !mapRef.current || points.length === 0) {
      return;
    }

    const safeClientId: string = clientId;

    let destroyed = false;
    let markers: Array<{ setMap: (map: null) => void }> = [];
    let currentLocationMarker: { setMap: (map: null) => void } | null = null;

    async function mountMap() {
      try {
        const naver = await loadNaverMaps(safeClientId);

        if (destroyed || !mapRef.current) {
          return;
        }

        setLoadError('');
        naverRef.current = naver;

        const fallbackCenter = center ?? {
          lat: 37.5665,
          lng: 126.978,
        };

        const mapInstance = new naver.maps.Map(mapRef.current, {
          center: new naver.maps.LatLng(fallbackCenter.lat, fallbackCenter.lng),
          zoom: points.length === 1 ? 15 : 12,
          zoomControl: true,
          mapDataControl: false,
        });
        mapInstanceRef.current = mapInstance;

        markers = points.map((point) => {
          const marker = new naver.maps.Marker({
            position: new naver.maps.LatLng(point.lat, point.lng),
            map: mapInstance,
            title: point.name,
          });

          return marker;
        });

        if (currentLocation) {
          currentLocationMarker = new naver.maps.Marker({
            position: new naver.maps.LatLng(
              currentLocation.lat,
              currentLocation.lng,
            ),
            map: mapInstance,
            title: '현재 위치',
          });
        }

        const boundsTargets = [
          ...points.map((point) => new naver.maps.LatLng(point.lat, point.lng)),
          ...(currentLocation
            ? [new naver.maps.LatLng(currentLocation.lat, currentLocation.lng)]
            : []),
        ];

        if (boundsTargets.length > 1) {
          mapInstance.fitBounds(
            boundsTargets,
            {
              top: 60,
              right: 60,
              bottom: 60,
              left: 60,
              maxZoom: 15,
            },
          );
        } else if (currentLocation) {
          mapInstance.setCenter(
            new naver.maps.LatLng(currentLocation.lat, currentLocation.lng),
          );
          mapInstance.setZoom(15);
        } else if (points.length === 1) {
          mapInstance.setCenter(
            new naver.maps.LatLng(points[0]!.lat, points[0]!.lng),
          );
          mapInstance.setZoom(15);
        }
      } catch (error) {
        if (!destroyed) {
          setLoadError(
            error instanceof Error
              ? error.message
              : 'NAVER 지도 로딩에 실패했습니다.',
          );
        }
      }
    }

    void mountMap();

    return () => {
      destroyed = true;
      markers.forEach((marker) => marker.setMap(null));
      currentLocationMarker?.setMap(null);
      mapInstanceRef.current?.destroy?.();
      markers = [];
      currentLocationMarker = null;
      mapInstanceRef.current = null;
      naverRef.current = null;
    };
  }, [center, clientId, currentLocation, points]);

  useEffect(() => {
    if (!currentLocation || !mapInstanceRef.current || !naverRef.current) {
      return;
    }

    mapInstanceRef.current.setCenter(
      new naverRef.current.maps.LatLng(currentLocation.lat, currentLocation.lng),
    );
    mapInstanceRef.current.setZoom(15);
  }, [currentLocation]);

  if (points.length === 0) {
    return (
      <section className="map-panel">
        <div className="map-panel__copy">
          <p className="eyebrow">지도 준비 전</p>
          <h2>지도에 표시할 좌표가 아직 없습니다.</h2>
          <p className="muted">
            현재 필터 조건에서는 좌표가 있는 식당이 없어 리스트만 표시합니다.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="map-panel">
      <div className="map-panel__copy">
        <p className="eyebrow">식당 지도</p>
        <h2>현재 필터 결과를 지도에 먼저 표시합니다.</h2>
        <p className="muted">
          seed / canonical 기준 좌표로 마커를 올립니다. 지도 표시는 NAVER Maps
          JavaScript API v3 기준입니다.
        </p>
        <div className="map-actions">
          <button
            className="primary-button"
            type="button"
            onClick={onRequestCurrentLocation}
          >
            {locationLoading ? '현재 위치 확인 중...' : '현재 위치 가져오기'}
          </button>
          <button
            className="secondary-button"
            type="button"
            disabled={!currentLocation}
            onClick={onMoveToCurrentLocation}
          >
            내 위치로 지도 이동
          </button>
        </div>
        {currentLocation ? (
          <p className="muted">
            현재 위치 기준 정렬 · {currentLocation.lat.toFixed(4)},{' '}
            {currentLocation.lng.toFixed(4)}
          </p>
        ) : null}
        {locationError ? <p role="alert">{locationError}</p> : null}
      </div>

      {!clientId ? (
        <div className="map-fallback" role="status">
          <p className="map-fallback__title">지도 키를 아직 연결하지 않았습니다.</p>
          <p className="muted">
            `NEXT_PUBLIC_NAVER_MAPS_CLIENT_ID`를 설정하면 NAVER 동적 지도를
            바로 띄울 수 있습니다.
          </p>
          {currentLocation ? (
            <p className="muted">
              현재 위치 · {currentLocation.lat.toFixed(4)},{' '}
              {currentLocation.lng.toFixed(4)}
            </p>
          ) : null}
          <ul className="map-point-list">
            {points.map((point) => (
              <li key={point.placeId}>
                {point.name} · {point.district} · {point.lat.toFixed(4)},{' '}
                {point.lng.toFixed(4)}
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="map-panel__content">
          <div
            ref={mapRef}
            aria-label="식당 지도"
            className="store-map"
          />
          <aside className="map-sidebar">
            <h3>지도 마커 목록</h3>
            <ul className="map-point-list">
              {currentLocation ? (
                <li>
                  <strong>현재 위치</strong>
                  <span>
                    {currentLocation.lat.toFixed(4)},{' '}
                    {currentLocation.lng.toFixed(4)}
                  </span>
                </li>
              ) : null}
              {points.map((point) => (
                <li key={point.placeId}>
                  <strong>{point.name}</strong>
                  <span>{storeMap.get(point.placeId)?.district}</span>
                  {getDistanceKmLabel(storeMap.get(point.placeId)?.distanceMeters) ? (
                    <span>
                      {getDistanceKmLabel(
                        storeMap.get(point.placeId)?.distanceMeters,
                      )}
                    </span>
                  ) : null}
                </li>
              ))}
            </ul>
            {loadError ? <p role="alert">{loadError}</p> : null}
          </aside>
        </div>
      )}
    </section>
  );
}
