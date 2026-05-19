'use client';

import {
  filterStoreList,
  listDistrictsFromStores,
} from '../../lib/repo/corkage-repo';
import { useCanonicalStores } from '../../lib/repo/use-canonical-stores';
import type { StoreFilterStatus } from '../../lib/types/corkage';
import { StoreList } from './StoreList';

const STATUS_OPTIONS: Array<{ value: StoreFilterStatus; label: string }> = [
  { value: 'all', label: '전체' },
  { value: 'available', label: '가능' },
  { value: 'unavailable', label: '불가' },
  { value: 'unknown', label: '확인중' },
  { value: 'stale', label: '정보 오래됨' },
];

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
  const maxFee = Number(maxFeeInput);
  const districts = listDistrictsFromStores(stores);
  const filteredStores = filterStoreList(stores, {
    status: status as StoreFilterStatus,
    district,
    maxFee:
      Number.isFinite(maxFee) && maxFee > 0 ? maxFee : undefined,
  });

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

        <button className="primary-button" type="submit">
          필터 적용
        </button>
      </form>

      <p className="helper-text">{filteredStores.length}개 결과</p>

      <StoreList stores={filteredStores} />
    </>
  );
}
