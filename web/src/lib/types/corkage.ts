export type CorkageStatus = 'available' | 'unavailable' | 'unknown';

export type FreshnessState = 'fresh' | 'stale';

export type ConfidenceLabel = 'high' | 'medium' | 'low';

export type SourceType =
  | 'operator_verified'
  | 'store_direct'
  | 'user_report_reviewed'
  | 'public_web_reference'
  | 'partner_data';

export type FeeUnit = 'per_bottle' | 'per_table' | 'free';

export type StoreFilterStatus = 'all' | CorkageStatus | 'stale';

export type CorkageStore = {
  placeId: string;
  name: string;
  address: string;
  roadAddress: string;
  lat: number;
  lng: number;
  category: string;
  district: string;
  phone?: string;
  websiteUrl?: string;
  externalReferenceUrl?: string;
  memo?: string;
  corkageStatus: CorkageStatus;
  freshnessState: FreshnessState;
  confidenceLabel: ConfidenceLabel;
  verifiedAt: string;
  sourceType: SourceType;
  sourceNote: string;
  conditionNote: string;
  corkageFee?: number;
  feeUnit?: FeeUnit;
  bottleLimit?: number;
  alcoholTypeLimit?: string;
  glassServiceAvailable?: boolean;
};

export type StoreFilterInput = {
  status?: StoreFilterStatus;
  district?: string;
  maxFee?: number;
};
