import Link from 'next/link';
import {
  getDistinctCorkageFacilityLabels,
  getDisplayStatus,
  getDistrictDisplayLabel,
  getStoreCardAddressLabel,
  getStoreCardSourceSummary,
  getVisitDecisionFeeLabel,
  getVisibilityNote,
} from '../../lib/repo/corkage-repo';
import { getDistanceKmLabel } from '../../lib/map/store-map';
import type { CorkageStore } from '../../lib/types/corkage';

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
  const feeLabel = getVisitDecisionFeeLabel(store);
  const districtLabel = getDistrictDisplayLabel(store.district);
  const addressLabel = getStoreCardAddressLabel(store);
  const sourceSummary = getStoreCardSourceSummary(store);
  const distanceLabel = getDistanceKmLabel(store.distanceMeters);
  const corkageFacilities = getDistinctCorkageFacilityLabels(store);
  const feeHighlightClassName = [
    'card__fee-highlight',
    getFeeHighlightToneClassName(store),
  ]
    .filter(Boolean)
    .join(' ');
  const visibilityNote =
    store.corkageStatus === 'unknown'
      ? '콜키지 정보 확인 필요 · 방문 전 매장 확인 권장'
      : getVisibilityNote(store);
  const cardClassName = [
    'card',
    selected ? 'card--selected' : '',
    isNearest ? 'card--nearest' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <article className={`${cardClassName} card--visit-decision`}>
      <div className="card__topline">
        <p className="eyebrow">
          {districtLabel} · {store.category}
        </p>
        <span className="status-pill status-pill--strong">
          {getDisplayStatus(store)}
        </span>
      </div>

      <div className="card__title-row">
        <h2>{store.name}</h2>
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
        </div>
      </div>

      <section
        className="card__decision"
        aria-label={`${store.name} 콜키지 방문 판단`}
      >
        <p className={feeHighlightClassName}>{feeLabel}</p>
        <p className="card__condition">{store.conditionNote}</p>
      </section>

      <p className="card__address">{addressLabel}</p>
      <p className="card__source-summary">{sourceSummary}</p>

      {distanceLabel ? (
        <p className="card__distance">현재 위치 기준 {distanceLabel}</p>
      ) : null}

      {store.corkageStatus !== 'available' ? (
        <p className="card__notice">{visibilityNote}</p>
      ) : null}

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
          className="card__link card__link--primary"
          href={`/store/${store.placeId}`}
        >
          상세 보기
        </Link>
      </div>
    </article>
  );
}

function getFeeHighlightToneClassName(store: CorkageStore): string {
  if (store.corkageStatus !== 'available') {
    return '';
  }

  if (store.feeUnit === 'free') {
    return 'card__fee-highlight--free';
  }

  const corkageText = [
    store.conditionNote,
    ...(store.rawFacilities ?? []),
  ].join(' ');

  if (typeof store.corkageFee === 'number' || corkageText.includes('유료')) {
    return 'card__fee-highlight--paid';
  }

  return '';
}
