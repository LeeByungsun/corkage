import { getStoreById, deriveDisplayState } from "@/repo/corkage-repo";
import { TrustBadge } from "@/components/corkage/TrustBadge";

export default function StoreDetailPage({ params }: { params: { id: string } }) {
  const store = getStoreById(params.id);

  if (!store) {
    return <p>요청한 식당을 찾을 수 없습니다.</p>;
  }

  const state = deriveDisplayState(store);

  const shouldShowFee = store.confidenceLabel !== "low" && store.freshnessState === "fresh";

  return (
    <section>
      <h2>{store.name}</h2>
      <p>{store.category}</p>
      <p>{store.roadAddress}</p>
      <TrustBadge state={state} />
      <p>
        최신 확인일: <strong>{store.verifiedAt}</strong>
      </p>
      {store.phone ? <p>전화: {store.phone}</p> : null}
      {store.websiteUrl ? <p>홈페이지: {store.websiteUrl}</p> : null}
      {store.conditionNote ? <p>조건: {store.conditionNote}</p> : null}
      {shouldShowFee && store.corkageFee ? <p>콜키지 요금: {store.corkageFee}</p> : <p>요금 정보는 보수적으로 비공개 처리</p>}
      <p className="notice">{store.sourceNote ?? "출처 메모 없음"}</p>
    </section>
  );
}
