'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { loadNaverMaps } from '../../lib/map/naver-maps-loader';
import type { CorkageStore } from '../../lib/types/corkage';

type StoreLocationMapProps = {
  clientId?: string;
  store: CorkageStore;
};

type MapInstance = {
  destroy?: () => void;
};

type MarkerInstance = {
  setMap?: (map: null) => void;
};

export function StoreLocationMap({
  clientId = process.env.NEXT_PUBLIC_NAVER_MAPS_CLIENT_ID || '',
  store,
}: StoreLocationMapProps) {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [mapState, setMapState] = useState<'loading' | 'ready'>('loading');
  const hasCoordinates = useMemo(
    () => Number.isFinite(store.lat) && Number.isFinite(store.lng),
    [store.lat, store.lng],
  );

  useEffect(() => {
    if (!clientId || !hasCoordinates || !mapRef.current) {
      return;
    }

    let cancelled = false;
    let marker: MarkerInstance | null = null;
    let mapInstance: MapInstance | null = null;

    setErrorMessage('');
    setMapState('loading');

    loadNaverMaps(clientId)
      .then(({ maps }) => {
        if (cancelled || !mapRef.current) {
          return;
        }

        const position = new maps.LatLng(store.lat, store.lng);
        mapInstance = new maps.Map(mapRef.current, {
          center: position,
          zoom: 15,
        });
        marker = new maps.Marker({
          map: mapInstance,
          position,
          title: store.name,
        });
        setMapState('ready');
      })
      .catch(() => {
        if (!cancelled) {
          setErrorMessage('지도를 불러오지 못했습니다. 주소를 먼저 확인해 주세요.');
        }
      });

    return () => {
      cancelled = true;
      marker?.setMap?.(null);
      mapInstance?.destroy?.();
    };
  }, [clientId, hasCoordinates, store.lat, store.lng, store.name]);

  if (!hasCoordinates) {
    return (
      <section className="detail-map detail-map--fallback">
        <h2>위치 지도 준비 중</h2>
        <p>이 식당은 지도에 표시할 좌표가 아직 없습니다. 상세 주소를 먼저 확인해 주세요.</p>
      </section>
    );
  }

  if (!clientId) {
    return (
      <section className="detail-map detail-map--fallback">
        <h2>위치 지도 준비 중</h2>
        <p>지도 연결 전입니다. 상세 주소를 먼저 확인해 주세요.</p>
      </section>
    );
  }

  return (
    <section className="detail-map">
      <div className="detail-map__header">
        <p className="eyebrow">위치</p>
        <h2>방문 위치 확인</h2>
        <p>{store.roadAddress}</p>
      </div>
      {errorMessage ? <p className="detail-map__error">{errorMessage}</p> : null}
      <div
        aria-label={`${store.name} 위치 지도`}
        className="detail-map__canvas"
        data-location-map-state={mapState}
        ref={mapRef}
      />
    </section>
  );
}
