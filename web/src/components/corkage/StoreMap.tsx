'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  getDistanceKmLabel,
  getStoreMapCenter,
  toStoreMapPoints,
  type GeoPoint,
  type MapBounds,
  type StoreWithDistance,
} from '../../lib/map/store-map';
import { loadNaverMaps } from '../../lib/map/naver-maps-loader';

type MarkerInstance = {
  setMap: (map: null) => void;
  setIcon?: (icon: MarkerIcon) => void;
  setZIndex?: (zIndex: number) => void;
};

type MarkerIcon = {
  content: string;
  size: { width: number; height: number };
  anchor: { x: number; y: number };
};

type StoreMapProps = {
  stores: StoreWithDistance[];
  currentLocation: GeoPoint | null;
  locationError: string;
  locationLoading: boolean;
  nearestPlaceId?: string | null;
  onRequestCurrentLocation: () => void;
  onMoveToCurrentLocation: () => void;
  selectedPlaceId: string | null;
  onSelectPlaceId: (placeId: string) => void;
  onBoundsChange: (bounds: MapBounds | null) => void;
  clientId?: string;
};

export function StoreMap({
  stores,
  currentLocation,
  locationError,
  locationLoading,
  nearestPlaceId = null,
  onRequestCurrentLocation,
  onMoveToCurrentLocation,
  selectedPlaceId,
  onSelectPlaceId,
  onBoundsChange,
  clientId = process.env.NEXT_PUBLIC_NAVER_MAPS_CLIENT_ID,
}: StoreMapProps) {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const points = useMemo(() => toStoreMapPoints(stores), [stores]);
  const storeMap = useMemo(
    () => new Map(stores.map((store) => [store.placeId, store] as const)),
    [stores],
  );
  const center = useMemo(() => getStoreMapCenter(points), [points]);
  const selectedPoint = useMemo(
    () =>
      selectedPlaceId
        ? points.find((point) => point.placeId === selectedPlaceId) ?? null
        : null,
    [points, selectedPlaceId],
  );
  const selectedStore = useMemo(
    () =>
      selectedPlaceId
        ? storeMap.get(selectedPlaceId) ?? null
        : null,
    [selectedPlaceId, storeMap],
  );
  const [loadError, setLoadError] = useState('');
  const mapInstanceRef = useRef<{
    fitBounds: (coords: unknown[], options?: Record<string, unknown>) => void;
    getBounds: () => { north: () => number; south: () => number; east: () => number; west: () => number };
    setCenter: (coord: unknown) => void;
    setZoom: (zoom: number) => void;
    destroy?: () => void;
  } | null>(null);
  const naverRef = useRef<Awaited<ReturnType<typeof loadNaverMaps>> | null>(null);
  const markerInstancesRef = useRef<Map<string, MarkerInstance>>(new Map());
  const onBoundsChangeRef = useRef(onBoundsChange);
  const onSelectPlaceIdRef = useRef(onSelectPlaceId);
  const selectedPlaceIdRef = useRef(selectedPlaceId);
  const nearestPlaceIdRef = useRef(nearestPlaceId);

  useEffect(() => {
    onBoundsChangeRef.current = onBoundsChange;
  }, [onBoundsChange]);

  useEffect(() => {
    onSelectPlaceIdRef.current = onSelectPlaceId;
  }, [onSelectPlaceId]);

  useEffect(() => {
    selectedPlaceIdRef.current = selectedPlaceId;
    nearestPlaceIdRef.current = nearestPlaceId;
  }, [nearestPlaceId, selectedPlaceId]);

  useEffect(() => {
    if (!clientId || !mapRef.current || points.length === 0) {
      markerInstancesRef.current = new Map();
      onBoundsChangeRef.current(null);
      return;
    }

    const safeClientId: string = clientId;

    let destroyed = false;
    const markerListeners: Array<{ remove?: () => void }> = [];
    const markerInstances: MarkerInstance[] = [];
    const markerInstanceMap = new Map<string, MarkerInstance>();
    let currentLocationMarker: MarkerInstance | null = null;
    let boundsListener: { remove?: () => void } | null = null;

    async function mountMap() {
      try {
        const naver = await loadNaverMaps(safeClientId);

        if (destroyed || !mapRef.current) {
          return;
        }

        setLoadError('');
        naverRef.current = naver;

        const fallbackCenter = center ?? { lat: 37.5665, lng: 126.978 };
        const mapInstance = new naver.maps.Map(mapRef.current, {
          center: new naver.maps.LatLng(fallbackCenter.lat, fallbackCenter.lng),
          zoom: points.length === 1 ? 15 : 12,
          zoomControl: true,
          mapDataControl: false,
        });
        mapInstanceRef.current = mapInstance;

        for (const point of points) {
          const marker = new naver.maps.Marker({
            position: new naver.maps.LatLng(point.lat, point.lng),
            map: mapInstance,
            icon: createMarkerIcon(point.name, {
              selected: selectedPlaceIdRef.current === point.placeId,
              nearest: nearestPlaceIdRef.current === point.placeId,
            }),
            title: point.name,
            zIndex: getMarkerZIndex({
              selected: selectedPlaceIdRef.current === point.placeId,
              nearest: nearestPlaceIdRef.current === point.placeId,
            }),
          });
          markerInstanceMap.set(point.placeId, marker);
          markerInstances.push(marker);
          markerListeners.push(
            naver.maps.Event.addListener(marker, 'click', () => {
              onSelectPlaceIdRef.current(point.placeId);
            }),
          );
        }
        markerInstancesRef.current = markerInstanceMap;

        if (currentLocation) {
          currentLocationMarker = new naver.maps.Marker({
            position: new naver.maps.LatLng(currentLocation.lat, currentLocation.lng),
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
          mapInstance.fitBounds(boundsTargets, {
            top: 60,
            right: 60,
            bottom: 60,
            left: 60,
            maxZoom: 15,
          });
        } else if (currentLocation) {
          mapInstance.setCenter(
            new naver.maps.LatLng(currentLocation.lat, currentLocation.lng),
          );
          mapInstance.setZoom(15);
        } else if (points.length === 1) {
          mapInstance.setCenter(new naver.maps.LatLng(points[0]!.lat, points[0]!.lng));
          mapInstance.setZoom(15);
        }

        const emitBounds = () => {
          if (destroyed) {
            return;
          }
          onBoundsChangeRef.current(toPlainMapBounds(mapInstance.getBounds()));
        };

        emitBounds();
        boundsListener = naver.maps.Event.addListener(
          mapInstance,
          'bounds_changed',
          emitBounds,
        );
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
      boundsListener?.remove?.();
      markerListeners.forEach((listener) => listener.remove?.());
      markerInstances.forEach((marker) => marker.setMap(null));
      currentLocationMarker?.setMap(null);
      markerInstancesRef.current = new Map();
      mapInstanceRef.current?.destroy?.();
      mapInstanceRef.current = null;
      naverRef.current = null;
    };
  }, [center, clientId, currentLocation, points]);

  useEffect(() => {
    for (const point of points) {
      const marker = markerInstancesRef.current.get(point.placeId);

      if (!marker) {
        continue;
      }

      const selected = selectedPlaceId === point.placeId;
      const nearest = nearestPlaceId === point.placeId;

      marker.setIcon?.(createMarkerIcon(point.name, { selected, nearest }));
      marker.setZIndex?.(getMarkerZIndex({ selected, nearest }));
    }
  }, [nearestPlaceId, points, selectedPlaceId]);

  useEffect(() => {
    if (!currentLocation || !mapInstanceRef.current || !naverRef.current) {
      return;
    }

    mapInstanceRef.current.setCenter(
      new naverRef.current.maps.LatLng(currentLocation.lat, currentLocation.lng),
    );
    mapInstanceRef.current.setZoom(15);
  }, [currentLocation]);

  useEffect(() => {
    if (!selectedPlaceId || !mapInstanceRef.current || !naverRef.current) {
      return;
    }

    const point = points.find((item) => item.placeId === selectedPlaceId);

    if (!point) {
      return;
    }

    mapInstanceRef.current.setCenter(
      new naverRef.current.maps.LatLng(point.lat, point.lng),
    );
    mapInstanceRef.current.setZoom(15);
  }, [points, selectedPlaceId]);

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
          <button className="primary-button" type="button" onClick={onRequestCurrentLocation}>
            {locationLoading ? '현재 위치 확인 중...' : '현재 위치 가져오기'}
          </button>
          <button
            className="secondary-button"
            disabled={!currentLocation}
            onClick={onMoveToCurrentLocation}
            type="button"
          >
            내 위치로 지도 이동
          </button>
        </div>
        {currentLocation ? (
          <p className="muted">
            현재 위치 기준 정렬 · {currentLocation.lat.toFixed(4)}, {currentLocation.lng.toFixed(4)}
          </p>
        ) : null}
        {locationError ? <p role="alert">{locationError}</p> : null}
      </div>

      {!clientId ? (
        <div className="map-fallback" role="status">
          <p className="map-fallback__title">지도 키를 아직 연결하지 않았습니다.</p>
          <p className="muted">
            `NEXT_PUBLIC_NAVER_MAPS_CLIENT_ID`를 설정하면 NAVER 동적 지도를 바로 띄울 수 있습니다.
          </p>
          {currentLocation ? (
            <p className="muted">
              현재 위치 · {currentLocation.lat.toFixed(4)}, {currentLocation.lng.toFixed(4)}
            </p>
          ) : null}
          {selectedPoint && selectedStore ? (
            <SelectedStoreCard
              nearestPlaceId={nearestPlaceId}
              point={selectedPoint}
              showCoordinates
              store={selectedStore}
            />
          ) : null}
          <PointList
            nearestPlaceId={nearestPlaceId}
            points={points}
            selectedPlaceId={selectedPlaceId}
            onSelectPlaceId={onSelectPlaceId}
            showCoordinates
            storeMap={storeMap}
          />
        </div>
      ) : (
        <div className="map-panel__content">
          <div aria-label="식당 지도" className="store-map" ref={mapRef} />
          <aside className="map-sidebar">
            <h3>지도 마커 목록</h3>
            {currentLocation ? (
              <div className="map-selection-card">
                <strong>현재 위치</strong>
                <span className="muted">
                  {currentLocation.lat.toFixed(4)}, {currentLocation.lng.toFixed(4)}
                </span>
              </div>
            ) : null}
            {selectedPoint && selectedStore ? (
              <SelectedStoreCard
                nearestPlaceId={nearestPlaceId}
                point={selectedPoint}
                store={selectedStore}
              />
            ) : null}
            <PointList
              nearestPlaceId={nearestPlaceId}
              points={points}
              selectedPlaceId={selectedPlaceId}
              onSelectPlaceId={onSelectPlaceId}
              storeMap={storeMap}
            />
            {loadError ? <p role="alert">{loadError}</p> : null}
          </aside>
        </div>
      )}
    </section>
  );
}

type PointListProps = {
  nearestPlaceId?: string | null;
  points: ReturnType<typeof toStoreMapPoints>;
  selectedPlaceId: string | null;
  onSelectPlaceId: (placeId: string) => void;
  showCoordinates?: boolean;
  storeMap: Map<string, StoreWithDistance>;
};

function PointList({
  nearestPlaceId = null,
  points,
  selectedPlaceId,
  onSelectPlaceId,
  showCoordinates = false,
  storeMap,
}: PointListProps) {
  return (
    <ul className="map-point-list">
      {points.map((point) => {
        const distanceLabel = getDistanceKmLabel(
          storeMap.get(point.placeId)?.distanceMeters,
        );
        const isNearest = nearestPlaceId === point.placeId;
        const selected = selectedPlaceId === point.placeId;
        const itemClassName = [
          'map-point-item',
          selected ? 'map-point-item--selected' : '',
          isNearest ? 'map-point-item--nearest' : '',
        ]
          .filter(Boolean)
          .join(' ');

        return (
          <li key={point.placeId} className={itemClassName}>
            <button
              aria-label={`${point.name} 마커 선택`}
              aria-pressed={selected}
              className={
                selected
                  ? 'map-point-button map-point-button--selected'
                  : 'map-point-button'
              }
              onClick={() => onSelectPlaceId(point.placeId)}
              type="button"
            >
              <strong>{point.name}</strong>
              <span>{point.district}</span>
              {selected || isNearest || distanceLabel ? (
                <div className="map-point-button__meta">
                  {selected ? (
                    <span className="map-point-button__state">선택됨</span>
                  ) : null}
                  {isNearest ? (
                    <span
                      aria-label="현재 위치 기준 가장 가까운 지도 마커"
                      className="nearest-badge"
                    >
                      가장 가까움
                    </span>
                  ) : null}
                  {distanceLabel ? (
                    <span className="map-point-button__hint">{distanceLabel}</span>
                  ) : null}
                </div>
              ) : null}
              {showCoordinates ? (
                <span>{point.lat.toFixed(4)}, {point.lng.toFixed(4)}</span>
              ) : null}
            </button>
          </li>
        );
      })}
    </ul>
  );
}

type SelectedStoreCardProps = {
  nearestPlaceId?: string | null;
  point: ReturnType<typeof toStoreMapPoints>[number];
  showCoordinates?: boolean;
  store: StoreWithDistance;
};

function SelectedStoreCard({
  nearestPlaceId = null,
  point,
  showCoordinates = false,
  store,
}: SelectedStoreCardProps) {
  const distanceLabel = getDistanceKmLabel(store.distanceMeters);
  const isNearest = nearestPlaceId === point.placeId;

  return (
    <div className="map-selection-card map-selection-card--selected">
      <span className="map-selection-card__eyebrow">선택한 식당</span>
      <strong>{point.name}</strong>
      {isNearest ? (
        <div className="map-selection-card__badges">
          <span
            aria-label="현재 위치 기준 가장 가까운 선택 식당"
            className="nearest-badge"
          >
            가장 가까움
          </span>
        </div>
      ) : null}
      <span className="muted">{store.roadAddress}</span>
      {distanceLabel ? (
        <span className="map-selection-card__distance">
          현재 위치 기준 {distanceLabel}
        </span>
      ) : null}
      {showCoordinates ? (
        <span className="muted">
          {point.lat.toFixed(4)}, {point.lng.toFixed(4)}
        </span>
      ) : null}
    </div>
  );
}

function toPlainMapBounds(bounds: {
  north: () => number;
  south: () => number;
  east: () => number;
  west: () => number;
}): MapBounds {
  return {
    north: bounds.north(),
    south: bounds.south(),
    east: bounds.east(),
    west: bounds.west(),
  };
}

function createMarkerIcon(
  name: string,
  {
    selected,
    nearest,
  }: {
    selected: boolean;
    nearest: boolean;
  },
): MarkerIcon {
  const markerState = selected && nearest
    ? 'selected-nearest'
    : selected
      ? 'selected'
      : nearest
        ? 'nearest'
        : 'default';
  const badgeLabel = selected && nearest
    ? '선택 · 가장 가까움'
    : selected
      ? '선택'
      : nearest
        ? '가장 가까움'
        : '';
  const badgeMarkup = badgeLabel
    ? `<span style="${[
        'display:inline-flex',
        'align-items:center',
        'justify-content:center',
        'max-width:92px',
        'padding:4px 8px',
        'border-radius:999px',
        `background:${selected ? '#7b3f00' : 'rgba(123, 63, 0, 0.12)'}`,
        `color:${selected ? '#fffaf3' : '#5e2f00'}`,
        `border:1px solid ${selected ? '#7b3f00' : 'rgba(123, 63, 0, 0.28)'}`,
        'font-size:11px',
        'font-weight:700',
        'line-height:1',
        'box-shadow:0 6px 16px rgba(94, 47, 0, 0.16)',
        'white-space:nowrap',
      ].join(';')}">${badgeLabel}</span>`
    : '';
  const markerFill = selected ? '#7b3f00' : '#fffaf3';
  const markerBorder = selected
    ? '#7b3f00'
    : nearest
      ? '#c06135'
      : 'rgba(123, 63, 0, 0.28)';
  const markerText = selected ? '#fffaf3' : '#5e2f00';
  const halo = selected || nearest
    ? `box-shadow:0 0 0 4px ${selected ? 'rgba(192, 97, 53, 0.18)' : 'rgba(123, 63, 0, 0.12)'},0 10px 24px rgba(94, 47, 0, 0.18);`
    : 'box-shadow:0 8px 18px rgba(94, 47, 0, 0.12);';

  return {
    content: `
      <div aria-label="${escapeHtml(name)} 지도 마커" data-marker-state="${markerState}" style="transform:translate(-50%, -100%);display:flex;flex-direction:column;align-items:center;gap:6px;">
        ${badgeMarkup}
        <div style="position:relative;width:36px;height:36px;border-radius:999px 999px 999px 0;background:${markerFill};border:2px solid ${markerBorder};transform:rotate(-45deg);${halo}">
          <div style="position:absolute;inset:7px;border-radius:999px;background:${selected ? 'rgba(255, 250, 243, 0.22)' : 'rgba(123, 63, 0, 0.08)'};"></div>
          <div style="position:absolute;left:50%;top:50%;transform:translate(-50%, -50%) rotate(45deg);width:10px;height:10px;border-radius:999px;background:${markerText};"></div>
        </div>
      </div>
    `.trim(),
    size: { width: 92, height: badgeLabel ? 64 : 44 },
    anchor: { x: 18, y: 36 },
  };
}

function getMarkerZIndex({
  selected,
  nearest,
}: {
  selected: boolean;
  nearest: boolean;
}) {
  if (selected) {
    return 30;
  }

  if (nearest) {
    return 20;
  }

  return 10;
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}
