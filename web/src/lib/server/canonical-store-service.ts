import { filterStoreList, getStoreByIdFromStores, mergeStores } from '../repo/corkage-repo';
import type { CorkageStore, StoreFilterInput } from '../types/corkage';
import { readServerMvpState } from './mvp-state-store';
import {
  listDistrictsFromDatabase,
  readStoresFromDatabase,
} from './store-database';

export async function readCanonicalStores(
  filters: StoreFilterInput = {},
): Promise<CorkageStore[]> {
  const baseStores = readStoresFromDatabase();
  const { canonicalOverrides } = await readServerMvpState();
  const mergedStores = mergeStores(baseStores, canonicalOverrides);

  return filterStoreList(mergedStores, filters);
}

export async function readCanonicalStoreById(
  placeId: string,
): Promise<CorkageStore | undefined> {
  const stores = await readCanonicalStores();

  return getStoreByIdFromStores(stores, placeId);
}

export function listCanonicalDistricts(): string[] {
  return listDistrictsFromDatabase();
}
