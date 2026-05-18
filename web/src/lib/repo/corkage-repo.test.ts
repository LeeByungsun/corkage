import {
  buildCanonicalPreviewFromAcceptedReport,
  filterStores,
  getDisplayStatus,
  getFeeLabel,
  getReportById,
  getStoreById,
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
});
