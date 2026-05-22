'use client';

'use client';

import { useMemo, useState } from 'react';
import {
  filterStoreList,
  listDistrictsFromStores,
} from '../../lib/repo/corkage-repo';
import { useCanonicalStores } from '../../lib/repo/use-canonical-stores';
import type { StoreFilterStatus } from '../../lib/types/corkage';
import { StoreMap } from './StoreMap';
import { StoreList } from './StoreList';
import {
  attachDistanceToStores,
  filterStoresByRadius,
  sortStoresByDistance,
  type GeoPoint,
} from '../../lib/map/store-map';

const STATUS_OPTIONS: Array<{ value: StoreFilterStatus; label: string }> = [
  { value: 'all', label: '전체' },
  { value: 'available', label: '가능' },
  { value: 'unavailable', label: '불가' },
  { value: 'unknown', label: '확인중' },
  { value: 'stale', label: '정보 오래됨' },
];

const SORT_OPTIONS = [
  { value: 'default', label: '기본순' },
  { value: 'distance', label: '현재 위치 기준' },
] as const;

const RADIUS_OPTIONS = [
  { value: 'all', label: '전체' },
  { value: '1000', label: '1km' },
  { value: '3000', label: '3km' },
  { value: '5000', label: '5km' },
  { value: '10000', label: '10km' },
] as const;

type StoreExplorerProps = {
  status: string;
  district: string;
  maxFeeInput: string;
};

export function StoreExplorer({
  status,
  district,
  maxFeeInput,
}: StoreExplorerProps) {
  const stores = useCanonicalStores();
  const [currentLocation, setCurrentLocation] = useState<GeoPoint | null>(null);
  const [locationError, setLocationError] = useState('');
  const [locationLoading, setLocationLoading] = useState(false);
  const [sortMode, setSortMode] =
    useState<(typeof SORT_OPTIONS)[number]['value']>('default');
  const [radiusFilter, setRadiusFilter] =
    useState<(typeof RADIUS_OPTIONS)[number]['value']>('all');
  const maxFee = Number(maxFeeInput);
  const districts = listDistrictsFromStores(stores);
  const baseFilteredStores = filterStoreList(stores, {
    status: status as StoreFilterStatus,
    district,
    maxFee: Number.isFinite(maxFee) && maxFee > 0 ? maxFee : undefined,
  });
  const storesWithDistance = useMemo(
    () => attachDistanceToStores(baseFilteredStores, currentLocation),
    [baseFilteredStores, currentLocation],
  );
  const radiusMeters =
    radiusFilter === 'all' ? undefined : Number(radiusFilter);
  const radiusFilteredStores = useMemo(
    () => filterStoresByRadius(storesWithDistance, radiusMeters),
    [radiusMeters, storesWithDistance],
  );
  const visibleStores = useMemo(() => {
    if (sortMode === 'distance' && currentLocation) {
      return sortStoresByDistance(radiusFilteredStores);
    }

    return radiusFilteredStores;
  }, [currentLocation, radiusFilteredStores, sortMode]);

  function handleRequestCurrentLocation() {
    if (!navigator.geolocation) {
      setLocationError('이 브라우저에서는 현재 위치를 지원하지 않습니다.');
      return;
    }

    setLocationLoading(true);
    setLocationError('');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCurrentLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setSortMode('distance');
        setLocationLoading(false);
      },
      (error) => {
        setLocationError(getLocationErrorMessage(error));
        setLocationLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      },
    );
  }

  function handleMoveToCurrentLocation() {
    if (!currentLocation) {
      return;
    }

    setCurrentLocation({ ...currentLocation });
  }

  return (
    <>
      <form className="filter-bar">
        <label>
          <span>상태</span>
          <select defaultValue={status} name="status">
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span>지역</span>
          <select defaultValue={district} name="district">
            <option value="all">전체</option>
            {districts.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span>최대 비용</span>
          <input
            defaultValue={maxFeeInput}
            inputMode="numeric"
            name="maxFee"
            placeholder="예: 30000"
          />
        </label>

        <label>
          <span>정렬</span>
          <select
            aria-label="정렬"
            value={sortMode}
            onChange={(event) =>
              setSortMode(
                event.target.value as (typeof SORT_OPTIONS)[number]['value'],
              )
            }
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span>반경</span>
          <select
            aria-label="반경"
            value={radiusFilter}
            onChange={(event) =>
              setRadiusFilter(
                event.target.value as (typeof RADIUS_OPTIONS)[number]['value'],
              )
            }
            disabled={!currentLocation}
          >
            {RADIUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <button className="primary-button" type="submit">
          필터 적용
        </button>
      </form>

      <p className="helper-text">{visibleStores.length}개 결과</p>

      <StoreMap
        stores={visibleStores}
        currentLocation={currentLocation}
        locationError={locationError}
        locationLoading={locationLoading}
        onRequestCurrentLocation={handleRequestCurrentLocation}
        onMoveToCurrentLocation={handleMoveToCurrentLocation}
      />

      <StoreList stores={visibleStores} />
    </>
  );
}

function getLocationErrorMessage(error: GeolocationPositionError) {
  switch (error.code) {
    case error.PERMISSION_DENIED:
      return '현재 위치 권한이 거부되었습니다.';
    case error.POSITION_UNAVAILABLE:
      return '현재 위치를 확인할 수 없습니다.';
    case error.TIMEOUT:
      return '현재 위치 확인 시간이 초과되었습니다.';
    default:
      return '현재 위치 확인에 실패했습니다.';
  }
}
