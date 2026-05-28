'use client';

import { useMemo } from 'react';
import { filterStoreList } from '../../lib/repo/corkage-repo';
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
  const isRegionSelected = district !== 'all';
  const regionalStores = useMemo(
    () =>
      isRegionSelected
        ? filterStoreList(stores, {
            status: 'all',
            district,
          })
        : [],
    [district, isRegionSelected, stores],
  );

  if (!isRegionSelected) {
    return <StoreRegionGate districts={districts} />;
  }

  return (
    <>
      <section className="guest-result-header" aria-label="선택한 지역 결과">
        <div>
          <p className="eyebrow">선택한 지역</p>
          <h2>{district}</h2>
          <p>콜키지 여부와 관계없이 이 지역에 등록된 모든 식당을 보여드립니다.</p>
        </div>
        <a className="secondary-button" href="/store">
          지역 다시 선택
        </a>
      </section>

      <p className="helper-text">{regionalStores.length}개 식당</p>

      {regionalStores.length === 0 ? (
        <section className="empty-state">
          <h2>아직 이 지역에는 등록된 식당 정보가 없습니다.</h2>
          <p>다른 지역을 선택하거나 제보 페이지에서 식당을 알려주세요.</p>
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
      <p className="eyebrow">콜키지 식당 찾기</p>
      <h2>어느 지역에서 찾으세요?</h2>
      <p>지역을 고르면 등록된 식당을 콜키지 상태와 함께 보여드립니다.</p>
      <form className="region-gate__form">
        <label>
          <span>지역</span>
          <select aria-label="지역" defaultValue="" name="district" required>
            <option disabled value="">
              지역 선택
            </option>
            {districts.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
        <button className="primary-button" type="submit">
          지역 선택하기
        </button>
      </form>
    </section>
  );
}
