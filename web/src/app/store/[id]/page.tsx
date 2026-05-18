import { notFound } from 'next/navigation';
import {
  getDisplayStatus,
  getFeeLabel,
  getSourceTypeLabel,
  getStoreById,
  getVisibilityNote,
} from '../../../lib/repo/corkage-repo';
import { TrustBadge } from '../../../components/corkage/TrustBadge';

export default function StoreDetailPage({ params }: { params: { id: string } }) {
  const store = getStoreById(params.id);
  if (!store) notFound();
  const currentStore = store;
  return (
    <section>
      <h1>{currentStore.name}</h1>
      <dl>
        <dt>상태</dt>
        <dd>{getDisplayStatus(currentStore)}</dd>
        <dt>최신 확인일</dt>
        <dd>{currentStore.verifiedAt}</dd>
        <dt>출처</dt>
        <dd>{getSourceTypeLabel(currentStore.sourceType)}</dd>
        <dt>비용</dt>
        <dd>{getFeeLabel(currentStore) ?? '비용 공개 전'}</dd>
        <dt>주의</dt>
        <dd>{getVisibilityNote(currentStore)}</dd>
      </dl>
      <TrustBadge
        confidenceLabel={currentStore.confidenceLabel}
        freshnessState={currentStore.freshnessState}
      />
    </section>
  );
}
