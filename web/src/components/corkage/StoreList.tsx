import { StoreCard } from "./StoreCard";
import type { CorkageStore } from "@/types/corkage";

export function StoreList({ stores }: { stores: CorkageStore[] }) {
  return (
    <section className="store-grid">
      {stores.length === 0 ? (
        <p>조건에 맞는 결과가 없습니다.</p>
      ) : (
        stores.map((store) => <StoreCard key={store.placeId} store={store} />)
      )}
    </section>
  );
}
