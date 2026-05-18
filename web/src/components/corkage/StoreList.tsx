import type { CorkageStore } from '../../lib/types/corkage';
import { StoreCard } from './StoreCard';

type StoreListProps = {
  stores: CorkageStore[];
};

export function StoreList({ stores }: StoreListProps) {
  if (stores.length === 0) {
    return (
      <section className="empty-state">
        <h2>조건에 맞는 식당이 없습니다.</h2>
        <p>필터를 완화하거나 제보 페이지에서 신규 식당을 남겨주세요.</p>
      </section>
    );
  }

  return (
    <section className="store-grid">
      {stores.map((store) => (
        <StoreCard key={store.placeId} store={store} />
      ))}
    </section>
  );
}
