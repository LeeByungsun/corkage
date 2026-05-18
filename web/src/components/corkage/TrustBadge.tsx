import type { StoreDisplayState } from "@/types/corkage";

export function TrustBadge({ state }: { state: StoreDisplayState }) {
  const className = state.statusLabel.includes("가능")
    ? "badge available"
    : state.statusLabel.includes("불가")
      ? "badge unavailable"
      : state.statusLabel.includes("오래")
        ? "badge stale"
        : "badge unknown";

  return (
    <div className="badge-row">
      <span className={className}>{state.statusLabel}</span>
      <span className="badge stale">신뢰도: {state.statusLabel}</span>
      <span className="muted">{state.note}</span>
    </div>
  );
}
