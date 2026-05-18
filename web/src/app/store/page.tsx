import { StoreList } from '../../components/corkage/StoreList';
import {
  filterStores,
  listDistricts,
} from '../../lib/repo/corkage-repo';
import type { StoreFilterStatus } from '../../lib/types/corkage';

const STATUS_OPTIONS: Array<{ value: StoreFilterStatus; label: string }> = [
  { value: 'all', label: '전체' },
  { value: 'available', label: '가능' },
  { value: 'unavailable', label: '불가' },
  { value: 'unknown', label: '확인중' },
  { value: 'stale', label: '정보 오래됨' },
];

type StorePageProps = {
  searchParams?: {
    status?: string;
    district?: string;
    maxFee?: string;
  };
};

export default function StorePage({ searchParams }: StorePageProps) {
  const status = (searchParams?.status ?? 'all') as StoreFilterStatus;
  const district = searchParams?.district ?? 'all';
  const maxFeeInput = searchParams?.maxFee ?? '';
  const maxFee = Number(maxFeeInput);

  const stores = filterStores({
    status,
    district,
    maxFee:
      Number.isFinite(maxFee) && maxFee > 0 ? maxFee : undefined,
  });

  const districts = listDistricts();

  return (
    <section className="page-stack">
      <header className="section-header">
        <p className="eyebrow">정적 seed 리스트</p>
        <h1>콜키지 식당 리스트</h1>
        <p>
          최신성, 신뢰도, 비용 공개 가능 여부를 함께 보여주는 첫 마일스톤입니다.
        </p>
      </header>

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

      <p className="helper-text">{stores.length}개 결과</p>

      <StoreList stores={stores} />
    </section>
  );
}
