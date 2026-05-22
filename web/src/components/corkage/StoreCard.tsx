import Link from 'next/link';
import {
  getDisplayStatus,
  getFeeLabel,
  getVisibilityNote,
} from '../../lib/repo/corkage-repo';
import { getDistanceKmLabel } from '../../lib/map/store-map';
import type { CorkageStore } from '../../lib/types/corkage';
import { TrustBadge } from './TrustBadge';

type StoreCardProps = {
  isNearest: boolean;
  onSelect: () => void;
  selected: boolean;
  store: CorkageStore & {
    distanceMeters?: number;
  };
};

export function StoreCard({
  isNearest,
  onSelect,
  selected,
  store,
}: StoreCardProps) {
  const feeLabel = getFeeLabel(store);
  const distanceLabel = getDistanceKmLabel(store.distanceMeters);

  return (
    <article className={selected ? 'card card--selected' : isNearest ? 'card card--nearest' : 'card'}>
      <div className="card__header">
        <div>
          <p className="eyebrow">
            {store.district} · {store.category}
          </p>
          <h2>{store.name}</h2>
        </div>
        <div className="card__badges">
          {isNearest ? (
            <span
              aria-label="현재 위치 기준 가장 가까운 식당"
              className="nearest-badge"
            >
              가장 가까움
            </span>
          ) : null}
          <span className="status-pill">{getDisplayStatus(store)}</span>
        </div>
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
        {distanceLabel ? (
          <div>
            <dt>현재 위치 기준</dt>
            <dd>{distanceLabel}</dd>
          </div>
        ) : null}
      </dl>

      <p className="card__notice">{getVisibilityNote(store)}</p>

      <div className="card__actions">
        <button
          aria-label={`${store.name} 카드 선택`}
          aria-pressed={selected}
          className={selected ? 'primary-button' : 'secondary-button'}
          onClick={onSelect}
          type="button"
        >
          카드 선택
        </button>
        <Link aria-label={`${store.name} 상세 보기`} className="card__link" href={`/store/${store.placeId}`}>
          상세 보기
        </Link>
      </div>
    </article>
  );
}
