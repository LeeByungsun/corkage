/* eslint-env node */

import { mkdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';

const WEB_DIR = process.cwd();
const SOURCE_PATH = path.resolve(WEB_DIR, process.argv[2] ?? 'list_apollo_state.json');
const DB_PATH = path.resolve(
  WEB_DIR,
  process.env.CORKAGE_STORE_DB_FILE ?? path.join('data', 'corkage.sqlite'),
);

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

await mkdir(path.dirname(DB_PATH), { recursive: true });
const raw = await readFile(SOURCE_PATH, 'utf8');
const apolloState = JSON.parse(raw);
const stores = normalizeNaverPlaceList(apolloState);

if (stores.length === 0) {
  throw new Error(`No PlaceListBusinessesItem restaurant rows found in ${SOURCE_PATH}`);
}

const database = new DatabaseSync(DB_PATH);
database.exec(STORE_TABLE_SQL);
database.exec('BEGIN');
try {
  database.prepare('DELETE FROM stores').run();
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
      external_reference_url,
      corkage_status,
      freshness_state,
      confidence_label,
      verified_at,
      source_type,
      source_note,
      condition_note,
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
      :externalReferenceUrl,
      :corkageStatus,
      :freshnessState,
      :confidenceLabel,
      :verifiedAt,
      :sourceType,
      :sourceNote,
      :conditionNote,
      CURRENT_TIMESTAMP
    )
  `);

  for (const store of stores) {
    statement.run(store);
  }

  database.exec('COMMIT');
} catch (error) {
  database.exec('ROLLBACK');
  throw error;
} finally {
  database.close();
}

const districts = [...new Set(stores.map((store) => store.district))].sort();
console.log(`Imported ${stores.length} stores into ${DB_PATH}`);
console.log(`Districts: ${districts.join(', ')}`);

function normalizeNaverPlaceList(state) {
  const deduped = new Map();
  const today = new Date().toISOString().slice(0, 10);

  for (const node of Object.values(state)) {
    if (!node || typeof node !== 'object') {
      continue;
    }

    if (node.__typename !== 'PlaceListBusinessesItem') {
      continue;
    }

    if (node.businessCategory && node.businessCategory !== 'restaurant') {
      continue;
    }

    const placeId = normalizeText(node.id);
    const name = normalizeText(node.name);
    const lat = Number(node.y);
    const lng = Number(node.x);

    if (!placeId || !name || !Number.isFinite(lat) || !Number.isFinite(lng)) {
      continue;
    }

    const categoryRaw = normalizeText(node.category) || '음식점';
    const fullAddress = normalizeText(node.fullAddress);
    const roadAddress = normalizeText(node.roadAddress) || fullAddress || normalizeText(node.address);
    const address = fullAddress || normalizeText(node.address) || roadAddress;

    deduped.set(placeId, {
      placeId,
      name,
      address,
      roadAddress,
      lat,
      lng,
      category: mapServiceCategory(categoryRaw),
      categoryRaw,
      district: normalizeText(node.commonAddress) || inferDistrict(address),
      phone: normalizeText(node.phone) || normalizeText(node.virtualPhone) || null,
      externalReferenceUrl: `https://m.place.naver.com/restaurant/${placeId}/home`,
      corkageStatus: 'unknown',
      freshnessState: 'fresh',
      confidenceLabel: 'low',
      verifiedAt: today,
      sourceType: 'public_web_reference',
      sourceNote: '사전 수집된 NAVER place 후보. 콜키지 사실은 미검수',
      conditionNote: '콜키지 가능 여부는 운영자 검수 전입니다.',
    });
  }

  return [...deduped.values()].sort((left, right) =>
    `${left.district} ${left.name}`.localeCompare(`${right.district} ${right.name}`, 'ko'),
  );
}

function normalizeText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function inferDistrict(address) {
  const parts = address.split(/\s+/).filter(Boolean);

  return parts.slice(0, 4).join(' ') || '지역 미분류';
}

function mapServiceCategory(categoryRaw) {
  if (categoryRaw.includes('와인바')) return '와인바';
  if (categoryRaw.includes('이탈리아') || categoryRaw.includes('프랑스')) return '이탈리안/양식';
  if (categoryRaw.includes('소고기') || categoryRaw.includes('고기') || categoryRaw.includes('장어')) return '한식 고기집';
  if (categoryRaw.includes('이자카야') || categoryRaw.includes('주점')) return '이자카야/주점';
  if (categoryRaw.includes('중식')) return '중식';
  if (categoryRaw.includes('일식') || categoryRaw.includes('스시') || categoryRaw.includes('초밥')) return '일식';

  return categoryRaw || '일반 음식점';
}
