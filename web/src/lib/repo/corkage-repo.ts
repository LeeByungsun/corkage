import type { CorkageStore, StoreDisplayState } from "@/types/corkage";
import { seedStores } from "@/data/corkage-seed";

export function getAllStores(): CorkageStore[] {
  return seedStores;
}

export function getStoreById(placeId: string): CorkageStore | undefined {
  return seedStores.find((store) => store.placeId === placeId);
}

export function deriveDisplayState(store: CorkageStore): StoreDisplayState {
  if (store.corkageStatus === "unknown") {
    return {
      statusLabel: "확인중",
      note: "정보가 충분하지 않습니다. 매장 확인이 필요할 수 있습니다.",
    };
  }

  if (store.freshnessState === "stale") {
    return {
      statusLabel: "정보오래됨",
      note: `${store.verifiedAt} 기준입니다. 최신성이 오래되어 내용이 달라질 수 있습니다.`,
    };
  }

  return store.corkageStatus === "available"
    ? {
        statusLabel: "가능",
        note: `${store.verifiedAt} 기준 확인 · ${displaySourceType(store.sourceType)} 출처`,
      }
    : {
        statusLabel: "불가",
        note: `${store.verifiedAt} 기준 확인 · ${displaySourceType(store.sourceType)} 출처`,
      };
}

function displaySourceType(sourceType: CorkageStore["sourceType"]): string {
  const map: Record<CorkageStore["sourceType"], string> = {
    operator_verified: "운영자 검수",
    store_direct: "매장 직접",
    user_report_reviewed: "제보 검수 반영",
    public_web_reference: "공개 자료 참고",
    partner_data: "제휴 데이터",
  };

  return map[sourceType];
}
