import { notFound } from 'next/navigation';
import { StoreDetailView } from '../../../components/corkage/StoreDetailView';
import { readCanonicalStoreById } from '../../../lib/server/canonical-store-service';

export const dynamic = 'force-dynamic';

export default async function StoreDetailPage({ params }: { params: { id: string } }) {
  const store = await readCanonicalStoreById(params.id);
  if (!store) notFound();

  return <StoreDetailView store={store} />;
}
