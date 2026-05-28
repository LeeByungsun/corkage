import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { getStoreById } from '../repo/corkage-repo';
import {
  listDistrictsFromDatabase,
  readStoreFromDatabase,
  readStoresFromDatabase,
  replaceStoresInDatabase,
  updateCorkageInfoInDatabase,
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
      buildStore({
        placeId: 'db-dongtan',
        district: '경기 화성시 동탄구 청계동',
        rawFacilities: ['콜키지 가능 (무료)', '예약'],
      }),
    ]);

    expect(listDistrictsFromDatabase()).toEqual([
      '강남',
      '경기 화성시 동탄구 청계동',
    ]);
    expect(readStoresFromDatabase({ district: '경기 화성시 동탄구 청계동' })).toEqual([
      expect.objectContaining({
        placeId: 'db-dongtan',
        rawFacilities: ['콜키지 가능 (무료)', '예약'],
      }),
    ]);
  });

  it('updates corkage facts for preloaded stores by placeId', () => {
    replaceStoresInDatabase([
      buildStore({
        placeId: 'db-dongtan',
        district: '경기 화성시 동탄구 청계동',
        corkageStatus: 'unknown',
        conditionNote: '검수 전',
      }),
    ]);

    const results = updateCorkageInfoInDatabase([
      {
        placeId: 'db-dongtan',
        corkageStatus: 'available',
        verifiedAt: '2026-05-28',
        sourceType: 'store_direct',
        sourceNote: '매장 통화 확인',
        conditionNote: '병당 15,000원',
        corkageFee: 15000,
        feeUnit: 'per_bottle',
        bottleLimit: 2,
        glassServiceAvailable: true,
      },
      {
        placeId: 'missing-place',
        corkageStatus: 'unavailable',
        verifiedAt: '2026-05-28',
        sourceType: 'operator_verified',
        sourceNote: '운영자 확인',
      },
    ]);

    expect(results).toEqual([
      { placeId: 'db-dongtan', updated: true },
      { placeId: 'missing-place', updated: false },
    ]);
    expect(readStoreFromDatabase('db-dongtan')).toMatchObject({
      corkageStatus: 'available',
      confidenceLabel: 'high',
      sourceType: 'store_direct',
      sourceNote: '매장 통화 확인',
      conditionNote: '병당 15,000원',
      corkageFee: 15000,
      feeUnit: 'per_bottle',
      bottleLimit: 2,
      glassServiceAvailable: true,
    });
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
