export default function HomePage() {
  return (
    <section>
      <h2>콜키지 가능한 식당 MVP</h2>
      <p>
        지도 연동 없이, 검수 기반 seed 데이터로 현재 기준 상태를 먼저 제공합니다.
      </p>
      <a href="/store" className="primary-link">
        식당 리스트 보기
      </a>
      <p className="muted">
        상태, 최신 확인일, 신뢰도 정보를 우선하고, 외부 제보는 검수 후에 반영합니다.
      </p>
    </section>
  );
}
