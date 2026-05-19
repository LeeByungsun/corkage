import {
  applyAcceptedReportToCanonical,
  buildCanonicalPreviewFromAcceptedReport,
  filterStores,
  getStoreCountsFromStores,
  getDisplayStatus,
  getFeeLabel,
  getReportById,
  getStoreById,
  mergeStores,
  transitionReportReviewState,
  shouldShowFeeDetails,
} from './corkage-repo';

describe('corkage-repo', () => {
  it('filters by district and max fee together', () => {
    const stores = filterStores({
      district: '강남',
      maxFee: 30000,
      status: 'available',
    });

    expect(stores).toHaveLength(1);
    expect(stores[0]?.placeId).toBe('seoul-vin-table');
  });

  it('marks stale data with the user-facing stale status', () => {
    const store = getStoreById('old-cellar-bistro');

    expect(store).toBeDefined();
    expect(getDisplayStatus(store!)).toBe('정보 오래됨');
  });

  it('hides fee details for unknown stores', () => {
    const store = getStoreById('seasonal-noodle-lab');

    expect(store).toBeDefined();
    expect(shouldShowFeeDetails(store!)).toBe(false);
    expect(getFeeLabel(store!)).toBeNull();
  });

  it('builds an accepted report preview for canonical reflection', () => {
    const report = getReportById('report-accepted-001');

    expect(report).toBeDefined();

    const preview = buildCanonicalPreviewFromAcceptedReport(report!);

    expect(preview).not.toBeNull();
    expect(preview?.nextStore.corkageStatus).toBe('available');
    expect(preview?.nextStore.sourceType).toBe('user_report_reviewed');
    expect(preview?.changes.length).toBeGreaterThan(0);
  });

  it('transitions review state while preserving report content', () => {
    const report = getReportById('report-followup-001');

    expect(report).toBeDefined();

    const nextReport = transitionReportReviewState(report!, 'accepted', {
      reviewNote: '운영자 확인 완료',
      reviewedAt: '2026-05-18',
    });

    expect(nextReport.reportId).toBe(report?.reportId);
    expect(nextReport.reviewState).toBe('accepted');
    expect(nextReport.reviewNote).toBe('운영자 확인 완료');
    expect(nextReport.reviewedAt).toBe('2026-05-18');
    expect(nextReport.memo).toBe(report?.memo);
  });

  it('applies an accepted report to canonical store state', () => {
    const report = getReportById('report-accepted-001');

    expect(report).toBeDefined();

    const nextStore = applyAcceptedReportToCanonical(report!);

    expect(nextStore).not.toBeNull();
    expect(nextStore?.placeId).toBe('seasonal-noodle-lab');
    expect(nextStore?.corkageStatus).toBe('available');
    expect(nextStore?.corkageFee).toBe(15000);
    expect(nextStore?.sourceType).toBe('user_report_reviewed');
    expect(nextStore?.sourceNote).toBe('운영자 유선 확인 후 canonical 반영 가능');
    expect(nextStore?.verifiedAt).toBe('2026-05-14');
  });

  it('does not apply non-accepted reports to canonical store state', () => {
    const report = getReportById('report-followup-001');

    expect(report).toBeDefined();
    expect(applyAcceptedReportToCanonical(report!)).toBeNull();
  });

  it('keeps accepted new-candidate reports out of canonical state', () => {
    const candidateReport = {
      reportId: 'draft-candidate-001',
      storeName: '새 식당 후보',
      reportType: 'new' as const,
      reportedStatus: 'available' as const,
      memo: '신규 후보 제보',
      submittedAt: '2026-05-18',
      reviewState: 'accepted' as const,
      reviewedAt: '2026-05-19',
    };

    expect(buildCanonicalPreviewFromAcceptedReport(candidateReport)).toBeNull();
    expect(applyAcceptedReportToCanonical(candidateReport)).toBeNull();
  });

  it('merges accepted canonical overrides into user-facing counts', () => {
    const report = getReportById('report-accepted-001');

    expect(report).toBeDefined();

    const nextStore = applyAcceptedReportToCanonical(report!);
    const mergedStores = mergeStores(
      [
        getStoreById('seoul-vin-table')!,
        getStoreById('old-cellar-bistro')!,
        getStoreById('seasonal-noodle-lab')!,
      ],
      nextStore ? [nextStore] : [],
    );

    const counts = getStoreCountsFromStores(mergedStores);

    expect(counts.total).toBe(3);
    expect(counts.available).toBe(2);
    expect(counts.stale).toBe(1);
  });
});
