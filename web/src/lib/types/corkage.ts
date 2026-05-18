export type CorkageStatus = "available" | "unavailable" | "unknown";
export type FreshnessState = "fresh" | "stale";
export type ConfidenceLabel = "high" | "medium" | "low";
export type SourceType =
  | "operator_verified"
  | "store_direct"
  | "user_report_reviewed"
  | "public_web_reference"
  | "partner_data";

export type StoreVisibility = "가능" | "불가" | "확인중" | "정보오래됨";

export interface BaseStore {
  placeId: string;
  name: string;
  address: string;
  roadAddress: string;
  lat: number;
  lng: number;
  category: string;
  phone?: string;
  websiteUrl?: string;
  externalReferenceUrl?: string;
  memo?: string;
}

export interface CorkageCanonical {
  corkageStatus: CorkageStatus;
  freshnessState: FreshnessState;
  confidenceLabel: ConfidenceLabel;
  verifiedAt: string;
  sourceType: SourceType;
  sourceNote?: string;
  conditionNote?: string;
  corkageFee?: string;
  feeUnit?: string;
  bottleLimit?: string;
  alcoholTypeLimit?: string;
  glassServiceAvailable?: boolean;
}

export interface CorkageStore extends BaseStore, CorkageCanonical {}

export interface StoreListFilter {
  region?: string;
  status?: CorkageStatus;
}

export interface StoreDisplayState {
  statusLabel: StoreVisibility;
  note: string;
}
