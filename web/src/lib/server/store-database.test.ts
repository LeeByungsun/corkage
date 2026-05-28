import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { getStoreById } from '../repo/corkage-repo';
import {
  listDistrictsFromDatabase,
  readStoreFromDatabase,
  readStoresFromDatabase,
  replaceStoresInDatabase,
} from './store-database';
import type { CorkageStore } from '../types/corkage';

describe('store-database', () => {
  let tempDir: string;
  let previousDbFile: string | undefined;

  beforeEach(async () => {
    tempDir = await mkdtemp(path.join(tmpdir(), 'corkage-store-db-'));
    previousDbFile = process.env.CORKAGE_STORE_DB_FILE;
    process.env.CORKAGE_STORE_DB_FILE = path.join(tempDir, 'stores.sqlite');
  });

  afterEach(async () => {
    if (previousDbFile === undefined) {
      delete process.env.CORKAGE_STORE_DB_FILE;
    } else {
      process.env.CORKAGE_STORE_DB_FILE = previousDbFile;
    }

    await rm(tempDir, { force: true, recursive: true });
  });

  it('bootstraps a local sqlite store database from the existing seed', () => {
    expect(readStoresFromDatabase().length).toBeGreaterThan(0);
    expect(readStoreFromDatabase('seoul-vin-table')?.name).toBe('빈테이블 청담');
  });

  it('filters imported DB stores by selected district', () => {
    replaceStoresInDatabase([
      buildStore({ placeId: 'db-gangnam', district: '강남' }),
      buildStore({ placeId: 'db-dongtan', district: '경기 화성시 동탄구 청계동' }),
    ]);

    expect(listDistrictsFromDatabase()).toEqual([
      '강남',
      '경기 화성시 동탄구 청계동',
    ]);
    expect(readStoresFromDatabase({ district: '경기 화성시 동탄구 청계동' })).toEqual([
      expect.objectContaining({ placeId: 'db-dongtan' }),
    ]);
  });
});

function buildStore(overrides: Partial<CorkageStore>): CorkageStore {
  const baseStore = getStoreById('seoul-vin-table');

  if (!baseStore) {
    throw new Error('Missing test base store');
  }

  return {
    ...baseStore,
    ...overrides,
  };
}
