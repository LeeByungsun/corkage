import {
  filterStores,
  getDisplayStatus,
  getFeeLabel,
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
});
