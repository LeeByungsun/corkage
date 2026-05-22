import { StoreExplorer } from '../../components/corkage/StoreExplorer';

type StorePageProps = {
  searchParams?: {
    status?: string;
    district?: string;
    maxFee?: string;
  };
};

export default function StorePage({ searchParams }: StorePageProps) {
  const status = searchParams?.status ?? 'all';
  const district = searchParams?.district ?? 'all';
  const maxFeeInput = searchParams?.maxFee ?? '';

  return (
    <section className="page-stack">
      <header className="section-header">
        <p className="eyebrow">정적 seed 지도 + 리스트</p>
        <h1>콜키지 식당 리스트</h1>
        <p>
          최신성, 신뢰도, 비용 공개 가능 여부를 지도와 함께 보여주는 첫
          마일스톤입니다.
        </p>
      </header>

      <StoreExplorer
        district={district}
        maxFeeInput={maxFeeInput}
        status={status}
      />
    </section>
  );
}
