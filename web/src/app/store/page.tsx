import { StoreExplorer } from '../../components/corkage/StoreExplorer';
import {
  listCanonicalDistricts,
  readCanonicalStores,
} from '../../lib/server/canonical-store-service';
import type { StoreFilterStatus } from '../../lib/types/corkage';

export const dynamic = 'force-dynamic';

type StorePageProps = {
  searchParams?: {
    status?: string;
    district?: string;
    maxFee?: string;
    sort?: string;
    radius?: string;
    selected?: string;
  };
};

export default async function StorePage({ searchParams }: StorePageProps) {
  const status = searchParams?.status ?? 'all';
  const district = searchParams?.district ?? 'all';
  const maxFeeInput = searchParams?.maxFee ?? '';
  const sort = searchParams?.sort ?? 'default';
  const radius = searchParams?.radius ?? 'all';
  const selected = searchParams?.selected ?? '';
  const parsedMaxFee = Number(maxFeeInput);
  const maxFee = Number.isFinite(parsedMaxFee) && parsedMaxFee > 0 ? parsedMaxFee : undefined;
  const stores = await readCanonicalStores({
    status: status as StoreFilterStatus,
    district,
    maxFee,
  });
  const districts = listCanonicalDistricts();

  return (
    <section className="page-stack">
      <header className="section-header">
        <p className="eyebrow">DB 기반 지도 + 리스트</p>
        <h1>콜키지 식당 리스트</h1>
        <p>
          지역을 선택하면 서버 DB에 적재된 음식점 후보를 지도와 리스트로
          보여줍니다.
        </p>
      </header>

      <StoreExplorer
        stores={stores}
        districts={districts}
        district={district}
        initialRadius={radius}
        initialSelectedPlaceId={selected}
        initialSort={sort}
        maxFeeInput={maxFeeInput}
        status={status}
      />
    </section>
  );
}
