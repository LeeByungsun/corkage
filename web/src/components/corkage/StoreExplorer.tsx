'use client';

import { useMemo } from 'react';
import {
  filterStoreList,
  getDistrictDisplayLabel,
  getDistrictOptionLabel,
  listDistrictsFromStores,
  normalizeDongtanDistrict,
} from '../../lib/repo/corkage-repo';
import type { CorkageStore } from '../../lib/types/corkage';
import { StoreList } from './StoreList';

type StoreExplorerProps = {
  stores: CorkageStore[];
  districts: string[];
  district: string;
};

export function StoreExplorer({
  stores,
  districts,
  district,
}: StoreExplorerProps) {
  const normalizedDistrict = normalizeDongtanDistrict(district);
  const isRegionSelected = normalizedDistrict !== 'all';
  const availableStores = useMemo(
    () => filterStoreList(stores, { status: 'available' }),
    [stores],
  );
  const regionOptions = useMemo(
    () => listDongtanDistrictOptions(districts, availableStores),
    [availableStores, districts],
  );
  const regionalStores = useMemo(
    () =>
      isRegionSelected
        ? filterStoreList(availableStores, {
            status: 'available',
            district: normalizedDistrict,
          })
        : [],
    [availableStores, isRegionSelected, normalizedDistrict],
  );

  if (!isRegionSelected) {
    return <StoreRegionGate districts={regionOptions} />;
  }

  return (
    <>
      <section className="guest-result-header" aria-label="선택한 지역 결과">
        <div>
          <p className="eyebrow">선택한 동탄구 지역</p>
          <h2>{getDistrictDisplayLabel(normalizedDistrict)}</h2>
          <p>동탄구 안에서 콜키지 가능으로 등록된 매장만 보여드립니다.</p>
        </div>
        <a className="secondary-button" href="/store">
          지역 다시 선택
        </a>
      </section>

      <p className="helper-text">{regionalStores.length}개 가능 매장</p>

      {regionalStores.length === 0 ? (
        <section className="empty-state">
          <h2>아직 이 지역에는 콜키지 가능 매장이 없습니다.</h2>
          <p>다른 동탄구 지역을 선택하거나 제보 페이지에서 식당을 알려주세요.</p>
        </section>
      ) : (
        <StoreList stores={regionalStores} />
      )}
    </>
  );
}

function StoreRegionGate({ districts }: { districts: string[] }) {
  return (
    <section className="region-gate" aria-label="지역 선택">
      <p className="eyebrow">콜키지 가능 매장 찾기</p>
      <h2>동탄구 어느 동에서 찾으세요?</h2>
      <p>경기 화성시 동탄구 안에서 콜키지 가능으로 등록된 매장만 보여드립니다.</p>
      <form className="region-gate__form">
        <label>
          <span>동탄구 세부 지역</span>
          <select aria-label="동탄구 세부 지역" defaultValue="" name="district" required>
            <option disabled value="">
              동 선택
            </option>
            <optgroup label="경기 화성시 동탄구">
              {districts.map((item) => (
                <option key={item} value={item}>
                  {getDistrictOptionLabel(item)}
                </option>
              ))}
            </optgroup>
          </select>
        </label>
        <button className="primary-button" type="submit">
          가능 매장 보기
        </button>
      </form>
    </section>
  );
}

function listDongtanDistrictOptions(
  districts: string[],
  availableStores: CorkageStore[],
) {
  const canonicalDistricts = districts
    .map(normalizeDongtanDistrict)
    .filter(isDongtanDistrictOption);
  const fallbackDistricts = listDistrictsFromStores(availableStores).filter(
    isDongtanDistrictOption,
  );
  const values =
    canonicalDistricts.length > 0 ? canonicalDistricts : fallbackDistricts;

  return [...new Set(values)].sort((left, right) =>
    getDistrictOptionLabel(left).localeCompare(getDistrictOptionLabel(right), 'ko'),
  );
}

function isDongtanDistrictOption(district: string): boolean {
  const displayLabel = getDistrictDisplayLabel(district);

  return displayLabel === '동탄구 기타' || displayLabel.startsWith('동탄구 ');
}
