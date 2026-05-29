import { StoreExplorer } from '../../components/corkage/StoreExplorer';
import {
  listCanonicalDistricts,
  readCanonicalStores,
} from '../../lib/server/canonical-store-service';

export const dynamic = 'force-dynamic';

type StorePageProps = {
  searchParams?: {
    district?: string;
  };
};

export default async function StorePage({ searchParams }: StorePageProps) {
  const district = searchParams?.district || 'all';
  const stores = await readCanonicalStores({
    status: 'available',
  });
  const districts = listCanonicalDistricts();

  return (
    <section className="page-stack">
      <header className="section-header">
        <p className="eyebrow">콜키지 식당 찾기</p>
        <h1>지역별 콜키지 식당</h1>
        <p>
          동탄구 지역을 먼저 선택하면 콜키지 가능으로 등록된 매장만 보여드립니다.
        </p>
      </header>

      <StoreExplorer stores={stores} districts={districts} district={district} />
    </section>
  );
}
