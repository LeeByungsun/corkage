import type { StoreWithDistance } from '../../lib/map/store-map';
import { StoreCard } from './StoreCard';

type StoreListProps = {
  stores: StoreWithDistance[];
  nearestStorePlaceId: string | null;
  onSelectPlaceId: (placeId: string) => void;
  selectedPlaceId: string | null;
};

export function StoreList({
  stores,
  nearestStorePlaceId,
  onSelectPlaceId,
  selectedPlaceId,
}: StoreListProps) {
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
        <StoreCard
          key={store.placeId}
          isNearest={store.placeId === nearestStorePlaceId}
          onSelect={() => onSelectPlaceId(store.placeId)}
          selected={store.placeId === selectedPlaceId}
          store={store}
        />
      ))}
    </section>
  );
}
