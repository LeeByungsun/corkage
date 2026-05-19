import Link from 'next/link';
import { StoreCountsCard } from '../components/corkage/StoreCountsCard';

export default function HomePage() {
  return (
    <section className="hero">
      <div className="hero__copy">
        <p className="eyebrow">데이터 검증 우선 MVP</p>
        <h1>지도보다 먼저, 신뢰 가능한 콜키지 정보를 보여줍니다.</h1>
        <p className="hero__lead">
          현재 버전은 정적 seed 데이터로 리스트, 상세, 제보 흐름을 검증합니다.
          실시간처럼 보이는 기능과 외부 수집 연동은 제외했습니다.
        </p>
        <div className="hero__actions">
          <Link className="primary-button" href="/store">
            식당 리스트 보기
          </Link>
          <Link className="secondary-button" href="/report">
            제보 화면 보기
          </Link>
        </div>
      </div>

      <StoreCountsCard />
    </section>
  );
}
