import Link from "next/link";
import type { CorkageStore } from "@/types/corkage";
import { deriveDisplayState } from "@/repo/corkage-repo";
import { TrustBadge } from "./TrustBadge";

export function StoreCard({ store }: { store: CorkageStore }) {
  const state = deriveDisplayState(store);

  return (
    <article className="store-card">
      <h3>
        <Link href={`/store/${store.placeId}`}>{store.name}</Link>
      </h3>
      <p>
        {store.category} · {store.address}
      </p>
      <TrustBadge state={state} />
      <p className="notice">{store.conditionNote ?? "특이 조건 미등록"}</p>
    </article>
  );
}
