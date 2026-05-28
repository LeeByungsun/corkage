import Link from 'next/link';
import {
  getCorkageFacilityLabels,
  getDisplayStatus,
  getFeeLabel,
  getVisibilityNote,
} from '../../lib/repo/corkage-repo';
import { getDistanceKmLabel } from '../../lib/map/store-map';
import type { CorkageStore } from '../../lib/types/corkage';
import { TrustBadge } from './TrustBadge';

type StoreCardProps = {
  isNearest?: boolean;
  onSelect?: () => void;
  selected?: boolean;
  store: CorkageStore & {
    distanceMeters?: number;
  };
};

export function StoreCard({
  isNearest = false,
  onSelect,
  selected = false,
  store,
}: StoreCardProps) {
  const feeLabel = getFeeLabel(store);
  const distanceLabel = getDistanceKmLabel(store.distanceMeters);
  const corkageFacilities = getCorkageFacilityLabels(store);
  const visibilityNote =
    store.corkageStatus === 'unknown'
      ? '콜키지 정보 확인 필요 · 방문 전 매장 확인 권장'
      : getVisibilityNote(store);
  const cardClassName = ['card', selected ? 'card--selected' : '', isNearest ? 'card--nearest' : '']
    .filter(Boolean)
    .join(' ');

  return (
    <article className={cardClassName}>
      <div className="card__header">
        <div>
          <p className="eyebrow">
            {store.district} · {store.category}
          </p>
          <h2>{store.name}</h2>
        </div>
        <div className="card__badges">
          {selected ? <span className="selection-badge">선택됨</span> : null}
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

      <p className="card__notice">{visibilityNote}</p>
      <p className="card__condition">{store.conditionNote}</p>

      {corkageFacilities.length > 0 ? (
        <div className="facility-tags" aria-label="네이버 편의정보 콜키지 태그">
          {corkageFacilities.map((facility) => (
            <span key={facility}>{facility}</span>
          ))}
        </div>
      ) : null}

      <div className="card__actions">
        {onSelect ? (
          <button
            aria-label={`${store.name} 카드 선택`}
            aria-pressed={selected}
            className={
              selected
                ? 'primary-button card__select-button card__select-button--selected'
                : 'secondary-button card__select-button'
            }
            onClick={onSelect}
            type="button"
          >
            카드 선택
          </button>
        ) : null}
        <Link
          aria-label={`${store.name} 상세 보기`}
          className="card__link"
          href={`/store/${store.placeId}`}
        >
          상세 보기
        </Link>
      </div>
    </article>
  );
}
