import { notFound } from 'next/navigation';
import { StoreDetailView } from '../../../components/corkage/StoreDetailView';
import { getStoreById } from '../../../lib/repo/corkage-repo';

export default function StoreDetailPage({ params }: { params: { id: string } }) {
  const store = getStoreById(params.id);
  if (!store) notFound();

  return <StoreDetailView placeId={params.id} />;
}
