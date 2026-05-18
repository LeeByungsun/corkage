import Link from 'next/link';
import {
  getDisplayStatus,
  getFeeLabel,
  getVisibilityNote,
} from '../../lib/repo/corkage-repo';
import type { CorkageStore } from '../../lib/types/corkage';
import { TrustBadge } from './TrustBadge';

type StoreCardProps = {
  store: CorkageStore;
};

export function StoreCard({ store }: StoreCardProps) {
  const feeLabel = getFeeLabel(store);

  return (
    <article className="card">
      <div className="card__header">
        <div>
          <p className="eyebrow">
            {store.district} · {store.category}
          </p>
          <h2>{store.name}</h2>
        </div>
        <span className="status-pill">{getDisplayStatus(store)}</span>
      </div>

      <p className="card__address">{store.roadAddress}</p>

      <TrustBadge
        confidenceLabel={store.confidenceLabel}
        freshnessState={store.freshnessState}
      />

      <dl className="card__meta">
        <div>
          <dt>비용</dt>
          <dd>{feeLabel ?? '비용 공개 전'}</dd>
        </div>
        <div>
          <dt>최신 확인</dt>
          <dd>{store.verifiedAt}</dd>
        </div>
      </dl>

      <p className="card__notice">{getVisibilityNote(store)}</p>

      <Link className="card__link" href={`/store/${store.placeId}`}>
        상세 보기
      </Link>
    </article>
  );
}
