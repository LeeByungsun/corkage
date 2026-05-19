'use client';

import { getStoreCountsFromStores } from '../../lib/repo/corkage-repo';
import { useCanonicalStores } from '../../lib/repo/use-canonical-stores';

export function StoreCountsCard() {
  const stores = useCanonicalStores();
  const counts = getStoreCountsFromStores(stores);

  return (
    <div className="stats-card">
      <h2>현재 seed + 로컬 canonical 현황</h2>
      <dl>
        <div>
          <dt>전체 식당</dt>
          <dd>{counts.total}</dd>
        </div>
        <div>
          <dt>신선한 가능 정보</dt>
          <dd>{counts.available}</dd>
        </div>
        <div>
          <dt>오래된 정보</dt>
          <dd>{counts.stale}</dd>
        </div>
      </dl>
    </div>
  );
}
