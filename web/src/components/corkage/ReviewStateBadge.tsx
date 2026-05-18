import type { ReviewState } from '../../lib/types/corkage';

const REVIEW_STATE_LABELS: Record<ReviewState, string> = {
  pending: '검수 대기',
  accepted: '반영 가능',
  rejected: '반려',
  needs_follow_up: '추가 확인 필요',
};

type ReviewStateBadgeProps = {
  reviewState: ReviewState;
};

export function ReviewStateBadge({ reviewState }: ReviewStateBadgeProps) {
  return (
    <span className={`review-state review-state--${reviewState}`}>
      {REVIEW_STATE_LABELS[reviewState]}
    </span>
  );
}
