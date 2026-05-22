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

export type ReportType = 'new' | 'status' | 'fee' | 'stale';

export type ReviewState = 'pending' | 'accepted' | 'rejected' | 'needs_follow_up';

export type ReportStoreMatchType = 'existing' | 'candidate';

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

export type CorkageReport = {
  reportId: string;
  storeMatchType: ReportStoreMatchType;
  placeId?: string;
  storeName: string;
  reportType: ReportType;
  reportedStatus?: CorkageStatus;
  reportedFee?: number;
  memo: string;
  evidenceUrl?: string;
  submittedAt: string;
  reviewState: ReviewState;
  reviewNote?: string;
  reviewedAt?: string;
  appliedAt?: string;
  reviewerId?: string;
};

export type CanonicalFieldChange = {
  field: string;
  before: string;
  after: string;
};

export type CanonicalPreview = {
  placeId: string;
  storeName: string;
  nextStore: CorkageStore;
  changes: CanonicalFieldChange[];
};

export type DraftReportReviewUpdate = {
  reviewState?: ReviewState;
  reviewNote?: string;
  reviewedAt?: string;
};

export type ReviewLogEntry = {
  logId: string;
  reportId: string;
  reviewState: ReviewState;
  reviewNote?: string;
  reviewedAt?: string;
  appliedAt?: string;
  createdAt: string;
  storeMatchType: ReportStoreMatchType;
  placeId?: string;
  storeName: string;
};

export type ServerMvpState = {
  draftReports: CorkageReport[];
  canonicalOverrides: CorkageStore[];
  reviewLogs: ReviewLogEntry[];
};
