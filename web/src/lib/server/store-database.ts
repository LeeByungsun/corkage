import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { corkageSeed } from '../data/corkage-seed';
import type {
  ConfidenceLabel,
  CorkageStatus,
  CorkageStore,
  CorkageInfoUpdate,
  FeeUnit,
  FreshnessState,
  SourceType,
  StoreFilterInput,
} from '../types/corkage';

const STORE_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS stores (
  place_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  road_address TEXT NOT NULL,
  lat REAL NOT NULL,
  lng REAL NOT NULL,
  category TEXT NOT NULL,
  category_raw TEXT,
  district TEXT NOT NULL,
  phone TEXT,
  website_url TEXT,
  external_reference_url TEXT,
  memo TEXT,
  corkage_status TEXT NOT NULL,
  freshness_state TEXT NOT NULL,
  confidence_label TEXT NOT NULL,
  verified_at TEXT NOT NULL,
  source_type TEXT NOT NULL,
  source_note TEXT NOT NULL,
  condition_note TEXT NOT NULL,
  corkage_fee INTEGER,
  fee_unit TEXT,
  bottle_limit INTEGER,
  alcohol_type_limit TEXT,
  glass_service_available INTEGER,
  imported_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
`;

type StoreRow = {
  place_id: string;
  name: string;
  address: string;
  road_address: string;
  lat: number;
  lng: number;
  category: string;
  category_raw?: string | null;
  district: string;
  phone?: string | null;
  website_url?: string | null;
  external_reference_url?: string | null;
  memo?: string | null;
  corkage_status: CorkageStatus;
  freshness_state: FreshnessState;
  confidence_label: ConfidenceLabel;
  verified_at: string;
  source_type: SourceType;
  source_note: string;
  condition_note: string;
  corkage_fee?: number | null;
  fee_unit?: FeeUnit | null;
  bottle_limit?: number | null;
  alcohol_type_limit?: string | null;
  glass_service_available?: number | null;
};

export function getStoreDatabasePath() {
  return (
    process.env.CORKAGE_STORE_DB_FILE ??
    path.join(process.cwd(), 'data', 'corkage.sqlite')
  );
}

export function openStoreDatabase() {
  const filePath = getStoreDatabasePath();
  mkdirSync(path.dirname(filePath), { recursive: true });

  const database = new DatabaseSync(filePath);
  database.exec('PRAGMA journal_mode = WAL');
  database.exec('PRAGMA foreign_keys = ON');
  database.exec(STORE_TABLE_SQL);
  seedDatabaseIfEmpty(database);

  return database;
}

export function readStoresFromDatabase({
  status = 'all',
  district,
  maxFee,
}: StoreFilterInput = {}): CorkageStore[] {
  const database = openStoreDatabase();

  try {
    const filters: string[] = [];
    const params: Record<string, string | number> = {};

    if (status === 'stale') {
      filters.push('freshness_state = :freshnessState');
      params.freshnessState = 'stale';
    } else if (status !== 'all') {
      filters.push('corkage_status = :status');
      params.status = status;
    }

    if (district && district !== 'all') {
      filters.push('district = :district');
      params.district = district;
    }

    if (typeof maxFee === 'number' && Number.isFinite(maxFee) && maxFee > 0) {
      filters.push('(corkage_fee IS NOT NULL AND corkage_fee <= :maxFee)');
      params.maxFee = maxFee;
    }

    const where = filters.length ? `WHERE ${filters.join(' AND ')}` : '';
    const rows = database
      .prepare(
        `SELECT * FROM stores ${where} ORDER BY district ASC, name ASC`,
      )
      .all(params) as StoreRow[];

    return rows.map(mapStoreRow);
  } finally {
    database.close();
  }
}

export function readStoreFromDatabase(placeId: string): CorkageStore | undefined {
  const database = openStoreDatabase();

  try {
    const row = database
      .prepare('SELECT * FROM stores WHERE place_id = ?')
      .get(placeId) as StoreRow | undefined;

    return row ? mapStoreRow(row) : undefined;
  } finally {
    database.close();
  }
}

export function listDistrictsFromDatabase(): string[] {
  const database = openStoreDatabase();

  try {
    const rows = database
      .prepare('SELECT DISTINCT district FROM stores ORDER BY district ASC')
      .all() as Array<{ district: string }>;

    return rows.map((row) => row.district);
  } finally {
    database.close();
  }
}

export function replaceStoresInDatabase(stores: CorkageStore[]) {
  const database = openStoreDatabase();

  try {
    database.exec('BEGIN');
    database.prepare('DELETE FROM stores').run();
    upsertStores(database, stores);
    database.exec('COMMIT');
  } catch (error) {
    database.exec('ROLLBACK');
    throw error;
  } finally {
    database.close();
  }
}

export function updateCorkageInfoInDatabase(updates: CorkageInfoUpdate[]) {
  const database = openStoreDatabase();

  try {
    database.exec('BEGIN');
    const statement = database.prepare(`
      UPDATE stores
      SET
        corkage_status = :corkageStatus,
        freshness_state = :freshnessState,
        confidence_label = :confidenceLabel,
        verified_at = :verifiedAt,
        source_type = :sourceType,
        source_note = :sourceNote,
        condition_note = :conditionNote,
        corkage_fee = :corkageFee,
        fee_unit = :feeUnit,
        bottle_limit = :bottleLimit,
        alcohol_type_limit = :alcoholTypeLimit,
        glass_service_available = :glassServiceAvailable,
        memo = :memo,
        updated_at = CURRENT_TIMESTAMP
      WHERE place_id = :placeId
    `);
    const results = updates.map((update) => {
      const current = database
        .prepare('SELECT * FROM stores WHERE place_id = ?')
        .get(update.placeId) as StoreRow | undefined;

      if (!current) {
        return {
          placeId: update.placeId,
          updated: false,
        };
      }

      statement.run({
        placeId: update.placeId,
        corkageStatus: update.corkageStatus,
        freshnessState: update.freshnessState ?? 'fresh',
        confidenceLabel:
          update.confidenceLabel ?? getDefaultConfidenceLabel(update.sourceType),
        verifiedAt: update.verifiedAt,
        sourceType: update.sourceType,
        sourceNote: update.sourceNote,
        conditionNote: update.conditionNote ?? current.condition_note,
        corkageFee: update.corkageFee ?? current.corkage_fee ?? null,
        feeUnit: update.feeUnit ?? current.fee_unit ?? null,
        bottleLimit: update.bottleLimit ?? current.bottle_limit ?? null,
        alcoholTypeLimit:
          update.alcoholTypeLimit ?? current.alcohol_type_limit ?? null,
        glassServiceAvailable:
          update.glassServiceAvailable === undefined
            ? current.glass_service_available ?? null
            : update.glassServiceAvailable
              ? 1
              : 0,
        memo: update.memo ?? current.memo ?? null,
      });

      return {
        placeId: update.placeId,
        updated: true,
      };
    });

    database.exec('COMMIT');
    return results;
  } catch (error) {
    database.exec('ROLLBACK');
    throw error;
  } finally {
    database.close();
  }
}

function seedDatabaseIfEmpty(database: DatabaseSync) {
  const row = database.prepare('SELECT COUNT(*) AS count FROM stores').get() as {
    count: number;
  };

  if (row.count > 0) {
    return;
  }

  upsertStores(database, corkageSeed);
}

function getDefaultConfidenceLabel(sourceType: SourceType): ConfidenceLabel {
  switch (sourceType) {
    case 'operator_verified':
    case 'store_direct':
      return 'high';
    case 'partner_data':
    case 'user_report_reviewed':
      return 'medium';
    case 'public_web_reference':
      return 'low';
  }
}

function upsertStores(database: DatabaseSync, stores: CorkageStore[]) {
  const statement = database.prepare(`
    INSERT INTO stores (
      place_id,
      name,
      address,
      road_address,
      lat,
      lng,
      category,
      category_raw,
      district,
      phone,
      website_url,
      external_reference_url,
      memo,
      corkage_status,
      freshness_state,
      confidence_label,
      verified_at,
      source_type,
      source_note,
      condition_note,
      corkage_fee,
      fee_unit,
      bottle_limit,
      alcohol_type_limit,
      glass_service_available,
      updated_at
    ) VALUES (
      :placeId,
      :name,
      :address,
      :roadAddress,
      :lat,
      :lng,
      :category,
      :categoryRaw,
      :district,
      :phone,
      :websiteUrl,
      :externalReferenceUrl,
      :memo,
      :corkageStatus,
      :freshnessState,
      :confidenceLabel,
      :verifiedAt,
      :sourceType,
      :sourceNote,
      :conditionNote,
      :corkageFee,
      :feeUnit,
      :bottleLimit,
      :alcoholTypeLimit,
      :glassServiceAvailable,
      CURRENT_TIMESTAMP
    )
    ON CONFLICT(place_id) DO UPDATE SET
      name = excluded.name,
      address = excluded.address,
      road_address = excluded.road_address,
      lat = excluded.lat,
      lng = excluded.lng,
      category = excluded.category,
      category_raw = excluded.category_raw,
      district = excluded.district,
      phone = excluded.phone,
      website_url = excluded.website_url,
      external_reference_url = excluded.external_reference_url,
      memo = excluded.memo,
      corkage_status = excluded.corkage_status,
      freshness_state = excluded.freshness_state,
      confidence_label = excluded.confidence_label,
      verified_at = excluded.verified_at,
      source_type = excluded.source_type,
      source_note = excluded.source_note,
      condition_note = excluded.condition_note,
      corkage_fee = excluded.corkage_fee,
      fee_unit = excluded.fee_unit,
      bottle_limit = excluded.bottle_limit,
      alcohol_type_limit = excluded.alcohol_type_limit,
      glass_service_available = excluded.glass_service_available,
      updated_at = CURRENT_TIMESTAMP
  `);

  for (const store of stores) {
    statement.run({
      placeId: store.placeId,
      name: store.name,
      address: store.address,
      roadAddress: store.roadAddress,
      lat: store.lat,
      lng: store.lng,
      category: store.category,
      categoryRaw: store.categoryRaw ?? null,
      district: store.district,
      phone: store.phone ?? null,
      websiteUrl: store.websiteUrl ?? null,
      externalReferenceUrl: store.externalReferenceUrl ?? null,
      memo: store.memo ?? null,
      corkageStatus: store.corkageStatus,
      freshnessState: store.freshnessState,
      confidenceLabel: store.confidenceLabel,
      verifiedAt: store.verifiedAt,
      sourceType: store.sourceType,
      sourceNote: store.sourceNote,
      conditionNote: store.conditionNote,
      corkageFee: store.corkageFee ?? null,
      feeUnit: store.feeUnit ?? null,
      bottleLimit: store.bottleLimit ?? null,
      alcoholTypeLimit: store.alcoholTypeLimit ?? null,
      glassServiceAvailable:
        store.glassServiceAvailable === undefined
          ? null
          : store.glassServiceAvailable
            ? 1
            : 0,
    });
  }
}

function mapStoreRow(row: StoreRow): CorkageStore {
  return {
    placeId: row.place_id,
    name: row.name,
    address: row.address,
    roadAddress: row.road_address,
    lat: row.lat,
    lng: row.lng,
    category: row.category,
    categoryRaw: row.category_raw ?? undefined,
    district: row.district,
    phone: row.phone ?? undefined,
    websiteUrl: row.website_url ?? undefined,
    externalReferenceUrl: row.external_reference_url ?? undefined,
    memo: row.memo ?? undefined,
    corkageStatus: row.corkage_status,
    freshnessState: row.freshness_state,
    confidenceLabel: row.confidence_label,
    verifiedAt: row.verified_at,
    sourceType: row.source_type,
    sourceNote: row.source_note,
    conditionNote: row.condition_note,
    corkageFee: row.corkage_fee ?? undefined,
    feeUnit: row.fee_unit ?? undefined,
    bottleLimit: row.bottle_limit ?? undefined,
    alcoholTypeLimit: row.alcohol_type_limit ?? undefined,
    glassServiceAvailable:
      row.glass_service_available === null || row.glass_service_available === undefined
        ? undefined
        : Boolean(row.glass_service_available),
  };
}
