import { getConfidenceText } from '../../lib/repo/corkage-repo';
import type {
  ConfidenceLabel,
  FreshnessState,
} from '../../lib/types/corkage';

type TrustBadgeProps = {
  confidenceLabel: ConfidenceLabel;
  freshnessState: FreshnessState;
};

export function TrustBadge({
  confidenceLabel,
  freshnessState,
}: TrustBadgeProps) {
  const freshnessText =
    freshnessState === 'fresh' ? '최신 기준 안' : '정보 오래됨';

  return (
    <div className="trust-badge" aria-label={`신뢰도 ${getConfidenceText(confidenceLabel)}`}>
      <span>{getConfidenceText(confidenceLabel)}</span>
      <span className="trust-badge__dot" aria-hidden="true">
        •
      </span>
      <span>{freshnessText}</span>
    </div>
  );
}
