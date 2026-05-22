'use client';

const NAVER_MAP_SCRIPT_ID = 'corkage-naver-maps-sdk';

let naverMapsPromise: Promise<NaverMapsSdk> | null = null;

export type NaverMapsSdk = {
  maps: {
    Event: {
      addListener: (
        target: object,
        eventName: string,
        listener: (...args: unknown[]) => void,
      ) => { remove?: () => void };
      removeListener: (listener: { remove?: () => void }) => void;
    };
    Map: new (
      element: HTMLElement | string,
      options?: Record<string, unknown>,
    ) => NaverMapInstance;
    Marker: new (options: Record<string, unknown>) => NaverMarkerInstance;
    LatLng: new (lat: number, lng: number) => unknown;
  };
};

type NaverMapInstance = {
  fitBounds: (coords: unknown[], options?: Record<string, unknown>) => void;
  getBounds: () => {
    north: () => number;
    south: () => number;
    east: () => number;
    west: () => number;
  };
  setCenter: (coord: unknown) => void;
  setZoom: (zoom: number) => void;
  destroy?: () => void;
};

type NaverMarkerInstance = {
  setMap: (map: NaverMapInstance | null) => void;
};

declare global {
  interface Window {
    naver?: NaverMapsSdk;
  }
}

export function getNaverMapsScriptUrl(clientId: string) {
  return `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${encodeURIComponent(
    clientId,
  )}`;
}

export async function loadNaverMaps(clientId: string): Promise<NaverMapsSdk> {
  if (window.naver?.maps) {
    return window.naver;
  }

  if (naverMapsPromise) {
    return naverMapsPromise;
  }

  naverMapsPromise = new Promise<NaverMapsSdk>((resolve, reject) => {
    const existing = document.getElementById(
      NAVER_MAP_SCRIPT_ID,
    ) as HTMLScriptElement | null;

    if (existing) {
      attachScriptListeners(existing, resolve, reject);
      return;
    }

    const script = document.createElement('script');
    script.id = NAVER_MAP_SCRIPT_ID;
    script.src = getNaverMapsScriptUrl(clientId);
    script.async = true;
    script.defer = true;

    attachScriptListeners(script, resolve, reject);
    document.head.appendChild(script);
  }).catch((error) => {
    naverMapsPromise = null;
    throw error;
  });

  return naverMapsPromise;
}

function attachScriptListeners(
  script: HTMLScriptElement,
  resolve: (value: NaverMapsSdk) => void,
  reject: (reason?: unknown) => void,
) {
  const handleLoad = () => {
    if (window.naver?.maps) {
      resolve(window.naver);
      return;
    }

    reject(new Error('NAVER Maps SDK loaded without window.naver.maps'));
  };

  const handleError = () => {
    reject(new Error('Failed to load NAVER Maps SDK'));
  };

  script.addEventListener('load', handleLoad, { once: true });
  script.addEventListener('error', handleError, { once: true });
}
