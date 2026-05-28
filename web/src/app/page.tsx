import Link from 'next/link';
import { StoreCountsCard } from '../components/corkage/StoreCountsCard';
import { readCanonicalStores } from '../lib/server/canonical-store-service';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const stores = await readCanonicalStores();
  return (
    <section className="hero">
      <div className="hero__copy">
        <p className="eyebrow">데이터 검증 우선 MVP</p>
        <h1>지도보다 먼저, 신뢰 가능한 콜키지 정보를 보여줍니다.</h1>
        <p className="hero__lead">
          현재 버전은 서버 DB에 적재한 음식점 후보를 기준으로 리스트, 지도,
          상세, 제보 흐름을 검증합니다. 콜키지 사실은 검수 상태로 구분합니다.
        </p>
        <div className="hero__actions">
          <Link className="primary-button" href="/store">
            지도 + 리스트 보기
          </Link>
          <Link className="secondary-button" href="/report">
            제보 화면 보기
          </Link>
        </div>
      </div>

      <StoreCountsCard stores={stores} />
    </section>
  );
}
