import {
  getDisplayStatus,
  getFeeLabel,
  getSourceTypeLabel,
  getVisibilityNote,
} from '../../lib/repo/corkage-repo';
import type { CorkageStore } from '../../lib/types/corkage';
import { TrustBadge } from './TrustBadge';

type StoreDetailViewProps = {
  store: CorkageStore;
};

export function StoreDetailView({ store }: StoreDetailViewProps) {

  return (
    <section>
      <h1>{store.name}</h1>
      <dl>
        <dt>상태</dt>
        <dd>{getDisplayStatus(store)}</dd>
        <dt>최신 확인일</dt>
        <dd>{store.verifiedAt}</dd>
        <dt>출처</dt>
        <dd>{getSourceTypeLabel(store.sourceType)}</dd>
        <dt>비용</dt>
        <dd>{getFeeLabel(store) ?? '비용 공개 전'}</dd>
        <dt>주의</dt>
        <dd>{getVisibilityNote(store)}</dd>
      </dl>
      <TrustBadge
        confidenceLabel={store.confidenceLabel}
        freshnessState={store.freshnessState}
      />
    </section>
  );
}
