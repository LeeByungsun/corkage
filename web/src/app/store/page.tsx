import Link from "next/link";
import type { CorkageStatus, StoreListFilter } from "@/types/corkage";
import { StoreList } from "@/components/corkage/StoreList";
import { getAllStores } from "@/repo/corkage-repo";

const statusOptions = [
  { value: "all", label: "전체" },
  { value: "available", label: "가능" },
  { value: "unavailable", label: "불가" },
  { value: "unknown", label: "확인중" },
];

export default function StorePage({ searchParams }: { searchParams?: Record<string, string> }) {
  const params: StoreListFilter = {
    region: searchParams?.region,
    status: (searchParams?.status as CorkageStatus | undefined) || undefined,
  };

  const all = getAllStores();
  const filtered = all.filter((store) => {
    const region = params.region?.trim();
    if (region && !store.address.includes(region)) return false;

    if (params.status && params.status !== "all" && store.corkageStatus !== params.status) {
      return false;
    }

    return true;
  });

  return (
    <section>
      <h2>식당 목록</h2>
      <form className="store-filters">
        <label>
          지역
          <input name="region" defaultValue={params.region ?? ""} placeholder="예: 강남" />
        </label>
        <label>
          상태
          <select name="status" defaultValue={params.status ?? "all"}>
            {statusOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>
        <button type="submit">필터 적용</button>
      </form>
      <StoreList stores={filtered} />
      <p className="muted">원하면 제보 페이지에서 최신 상태를 제보해 주세요.</p>
      <Link href="/report">제보하기</Link>
    </section>
  );
}
