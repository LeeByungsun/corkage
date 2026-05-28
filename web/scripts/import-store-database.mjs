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
  raw_facilities_json TEXT,
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
const source = JSON.parse(raw);
const stores = normalizeSource(source);

if (stores.length === 0) {
  throw new Error(`No PlaceListBusinessesItem restaurant rows found in ${SOURCE_PATH}`);
}

const database = new DatabaseSync(DB_PATH);
database.exec(STORE_TABLE_SQL);
ensureStoreSchema(database);
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
      memo,
      raw_facilities_json,
      corkage_status,
      freshness_state,
      confidence_label,
      verified_at,
      source_type,
      source_note,
      condition_note,
      corkage_fee,
      fee_unit,
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
      :memo,
      :rawFacilitiesJson,
      :corkageStatus,
      :freshnessState,
      :confidenceLabel,
      :verifiedAt,
      :sourceType,
      :sourceNote,
      :conditionNote,
      :corkageFee,
      :feeUnit,
      CURRENT_TIMESTAMP
    )
  `);

  for (const store of stores) {
    statement.run({
      phone: null,
      memo: null,
      rawFacilitiesJson: null,
      corkageFee: null,
      feeUnit: null,
      ...store,
    });
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

function normalizeSource(source) {
  if (Array.isArray(source)) {
    return normalizeNaverFacilityResults(source);
  }

  return normalizeNaverPlaceList(source);
}

function normalizeNaverFacilityResults(rows) {
  const today = process.env.CORKAGE_IMPORT_VERIFIED_AT ?? new Date().toISOString().slice(0, 10);
  const deduped = new Map();

  for (const row of rows) {
    const placeId = normalizeText(row.id ?? row.placeId);
    const name = normalizeText(row.name);
    const lat = Number(row.y ?? row.lat);
    const lng = Number(row.x ?? row.lng);

    if (!placeId || !name || !Number.isFinite(lat) || !Number.isFinite(lng)) {
      continue;
    }

    const categories = Array.isArray(row.category)
      ? row.category.map(normalizeText).filter(Boolean)
      : [normalizeText(row.category)].filter(Boolean);
    const categoryRaw = categories.join(' > ') || '음식점';
    const fullAddress = normalizeText(row.fullAddress);
    const roadAddress = normalizeText(row.roadAddress) || fullAddress;
    const address = fullAddress || roadAddress;
    const facilities = Array.isArray(row.facilities)
      ? row.facilities.map(normalizeText).filter(Boolean)
      : [];
    const corkageFacts = mapCorkageFacts(row, facilities);

    deduped.set(placeId, {
      placeId,
      name,
      address,
      roadAddress,
      lat,
      lng,
      category: mapServiceCategory(categoryRaw),
      categoryRaw,
      district: inferDistrict(address),
      externalReferenceUrl: `https://m.place.naver.com/restaurant/${placeId}/home`,
      rawFacilitiesJson: JSON.stringify(facilities),
      corkageStatus: corkageFacts.status,
      freshnessState: 'fresh',
      confidenceLabel: 'low',
      verifiedAt: today,
      sourceType: 'public_web_reference',
      sourceNote: 'NAVER InformationFacilities 자동 추출',
      conditionNote: corkageFacts.conditionNote,
      corkageFee: corkageFacts.corkageFee,
      feeUnit: corkageFacts.feeUnit,
      memo: corkageFacts.memo,
    });
  }

  return [...deduped.values()].sort((left, right) =>
    `${left.district} ${left.name}`.localeCompare(`${right.district} ${right.name}`, 'ko'),
  );
}

function mapCorkageFacts(row, facilities) {
  const feeText = normalizeText(row.corkageFee);
  const corkageFacilities = facilities.filter((facility) => facility.includes('콜키지'));
  const hasCorkageFacility = corkageFacilities.length > 0;
  const allowed =
    row.corkageAllowed === true ||
    hasCorkageFacility ||
    feeText === '무료' ||
    feeText === '유료';

  if (allowed) {
    return {
      status: 'available',
      corkageFee: feeText === '무료' ? 0 : null,
      feeUnit: feeText === '무료' ? 'free' : null,
      conditionNote:
        corkageFacilities.length > 0
          ? corkageFacilities.join(', ')
          : `콜키지 가능 (${feeText || '세부 비용 확인 필요'})`,
      memo: `NAVER 편의정보 원본: ${facilities.join(', ') || '없음'}`,
    };
  }

  if (row.corkageAllowed === false || feeText === '정보없음') {
    return {
      status: 'unavailable',
      corkageFee: null,
      feeUnit: null,
      conditionNote: 'NAVER 편의정보에서 콜키지 태그 미검출',
      memo: `NAVER 편의정보 원본: ${facilities.join(', ') || '없음'}`,
    };
  }

  return {
    status: 'unknown',
    corkageFee: null,
    feeUnit: null,
    conditionNote: '콜키지 가능 여부 추가 확인 필요',
    memo: `NAVER 편의정보 원본: ${facilities.join(', ') || '없음'}`,
  };
}

function normalizeText(value) {
  return value === undefined || value === null ? '' : String(value).trim();
}

function inferDistrict(address) {
  const parts = address.split(/\s+/).filter(Boolean);
  const regionParts = [];

  for (const part of parts) {
    if (regionParts.length === 0 && /[시도]$/.test(part)) {
      regionParts.push(part);
      continue;
    }

    if (regionParts.length > 0 && /[시군구]$/.test(part)) {
      regionParts.push(part);
      continue;
    }

    if (
      regionParts.length > 0 &&
      (/[읍면]$/.test(part) || (/[동]$/.test(part) && part.length <= 4))
    ) {
      regionParts.push(part);
    }

    break;
  }

  if (regionParts.length > 0) {
    return regionParts.join(' ');
  }

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

function ensureStoreSchema(database) {
  const columns = database.prepare('PRAGMA table_info(stores)').all();
  const columnNames = new Set(columns.map((column) => column.name));

  if (!columnNames.has('raw_facilities_json')) {
    database.exec('ALTER TABLE stores ADD COLUMN raw_facilities_json TEXT');
  }
}
