#!/usr/bin/env node
/* eslint-env node */

import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';

const DEFAULT_JUSO_SEARCH_API_URL = 'https://business.juso.go.kr/addrlink/addrLinkApi.do';
const DISTRICT_SOURCE = 'juso-search-api';
const DISTRICT_KEYWORD_LIMIT = 4;
const LEGAL_UNIT_SUFFIX_PATTERN = /[읍면동]$/;
const ROAD_NAME_WITH_BUILDING_NUMBER_PATTERN = /\S+(?:대로|로|길)\s+\d+(?:-\d+)?/;
const DONGTAN_SUBDISTRICT_PATTERN = /화성시\s+동탄구/;

const options = parseArgs(process.argv.slice(2));

if (options.help) {
  printHelp();
  process.exit(0);
}

const jusoConfirmKey = process.env.JUSO_CONFIRM_KEY ?? process.env.JUSO_API_KEY ?? '';

if (!jusoConfirmKey) {
  console.error(
    'JUSO_CONFIRM_KEY 환경변수가 필요합니다. 도로명주소 검색API 승인키를 넣고 다시 실행하세요.',
  );
  console.error('예: JUSO_CONFIRM_KEY=... npm run db:normalize:districts -- --limit=20');
  process.exit(1);
}

const dbPath = path.resolve(
  process.cwd(),
  process.env.CORKAGE_STORE_DB_FILE ?? path.join('data', 'corkage.sqlite'),
);
const apiUrl = process.env.JUSO_API_URL ?? DEFAULT_JUSO_SEARCH_API_URL;
const database = new DatabaseSync(dbPath);
const normalizedAt = new Date().toISOString();

try {
  ensureStoreSchema(database);
  const rows = readRows(database);
  const candidates = (options.all ? rows : rows.filter(shouldNormalizeDistrict)).slice(
    0,
    options.limit,
  );

  console.log(
    `District normalization ${options.apply ? 'apply' : 'dry-run'}: ${candidates.length}/${rows.length} targets from ${dbPath}`,
  );

  const changes = [];
  const misses = [];

  for (const row of candidates) {
    const normalized = await normalizeStoreDistrict(row, {
      apiUrl,
      jusoConfirmKey,
    });

    if (!normalized) {
      misses.push(row);
      console.log(`MISS ${row.placeId} ${row.name}: ${row.district}`);
      continue;
    }

    if (normalized.district === row.district) {
      console.log(
        `SAME ${row.placeId} ${row.name}: ${row.district} via "${normalized.keyword}"`,
      );
      continue;
    }

    changes.push({ row, normalized });
    console.log(
      `CHANGE ${row.placeId} ${row.name}: ${row.district} -> ${normalized.district} via "${normalized.keyword}"`,
    );
  }

  if (options.apply && changes.length > 0) {
    applyChanges(database, changes, normalizedAt);
  }

  console.log(
    `Done. changes=${changes.length}, misses=${misses.length}, skipped=${candidates.length - changes.length - misses.length}`,
  );

  if (!options.apply && changes.length > 0) {
    console.log('DB에 쓰려면 같은 명령에 --apply를 추가하세요.');
  }
} finally {
  database.close();
}

function parseArgs(args) {
  const parsed = {
    apply: false,
    all: false,
    help: false,
    limit: Number.POSITIVE_INFINITY,
  };

  for (const arg of args) {
    if (arg === '--apply') {
      parsed.apply = true;
      continue;
    }

    if (arg === '--all') {
      parsed.all = true;
      continue;
    }

    if (arg === '--help' || arg === '-h') {
      parsed.help = true;
      continue;
    }

    if (arg.startsWith('--limit=')) {
      const value = Number(arg.slice('--limit='.length));

      if (!Number.isInteger(value) || value < 1) {
        throw new Error('--limit은 1 이상의 정수여야 합니다.');
      }

      parsed.limit = value;
      continue;
    }

    throw new Error(`지원하지 않는 옵션입니다: ${arg}`);
  }

  return parsed;
}

function printHelp() {
  console.log(`Usage: JUSO_CONFIRM_KEY=... npm run db:normalize:districts -- [--limit=N] [--all] [--apply]

도로명주소 검색API 결과의 siNm/sggNm/emdNm으로 stores.district를 정규화합니다.
기본은 dry-run입니다. --apply를 붙여야 DB를 수정합니다.

Options:
  --limit=N  처리할 대상 수를 제한합니다.
  --all      이미 동 단위인 행까지 전체를 API로 재검증합니다.
  --apply    변경사항을 stores 테이블에 반영합니다.
`);
}

function readRows(database) {
  return database
    .prepare(
      `SELECT
        place_id AS placeId,
        name,
        address,
        road_address AS roadAddress,
        district
      FROM stores
      ORDER BY district ASC, name ASC`,
    )
    .all();
}

function ensureStoreSchema(database) {
  const columns = database.prepare('PRAGMA table_info(stores)').all();
  const columnNames = new Set(columns.map((column) => column.name));
  const migrations = [
    ['jibun_address', 'ALTER TABLE stores ADD COLUMN jibun_address TEXT'],
    ['legal_dong', 'ALTER TABLE stores ADD COLUMN legal_dong TEXT'],
    ['juso_adm_cd', 'ALTER TABLE stores ADD COLUMN juso_adm_cd TEXT'],
    ['district_source', 'ALTER TABLE stores ADD COLUMN district_source TEXT'],
    [
      'district_normalized_at',
      'ALTER TABLE stores ADD COLUMN district_normalized_at TEXT',
    ],
  ];

  for (const [column, sql] of migrations) {
    if (!columnNames.has(column)) {
      database.exec(sql);
    }
  }
}

async function normalizeStoreDistrict(row, { apiUrl, jusoConfirmKey }) {
  const keywords = buildJusoSearchKeywords(row);

  for (const keyword of keywords) {
    const results = await searchJuso(apiUrl, jusoConfirmKey, keyword);
    const match = selectBestJusoResult(results, row);

    if (!match) {
      continue;
    }

    const district = buildNormalizedDistrictFromJuso(match);

    if (!district) {
      continue;
    }

    return {
      admCd: normalizeText(match.admCd),
      district,
      jibunAddress: normalizeText(match.jibunAddr),
      keyword,
      legalDong: normalizeText(match.emdNm),
      roadAddress: normalizeText(match.roadAddrPart1 ?? match.roadAddr),
    };
  }

  return undefined;
}

async function searchJuso(apiUrl, jusoConfirmKey, keyword) {
  const url = new URL(apiUrl);
  url.searchParams.set('confmKey', jusoConfirmKey);
  url.searchParams.set('currentPage', '1');
  url.searchParams.set('countPerPage', '5');
  url.searchParams.set('keyword', keyword);
  url.searchParams.set('resultType', 'json');
  url.searchParams.set('firstSort', 'road');

  const response = await fetch(url);
  const responseText = await response.text();

  if (!response.ok) {
    throw new Error(`Juso API HTTP ${response.status}: ${responseText.slice(0, 160)}`);
  }

  let payload;
  try {
    payload = JSON.parse(responseText);
  } catch (error) {
    throw new Error(`Juso API JSON 파싱 실패: ${responseText.slice(0, 160)}`, {
      cause: error,
    });
  }

  const common = payload?.results?.common;
  const errorCode = normalizeText(common?.errorCode);

  if (errorCode && errorCode !== '0') {
    throw new Error(
      `Juso API ${errorCode}: ${normalizeText(common?.errorMessage)} (keyword: ${keyword})`,
    );
  }

  const results = payload?.results?.juso;
  return Array.isArray(results) ? results : [];
}

function selectBestJusoResult(results, row) {
  const base = extractRoadAddressBase(row.roadAddress || row.address);

  if (!base) {
    return results.find(buildNormalizedDistrictFromJuso);
  }

  const normalizedBase = normalizeComparableAddress(base);
  return (
    results.find((result) => {
      const resultRoadAddress = normalizeComparableAddress(
        result.roadAddrPart1 ?? result.roadAddr ?? '',
      );

      return resultRoadAddress.includes(normalizedBase);
    }) ?? results.find(buildNormalizedDistrictFromJuso)
  );
}

function applyChanges(database, changes, normalizedAt) {
  const statement = database.prepare(`
    UPDATE stores
    SET
      district = :district,
      jibun_address = :jibunAddress,
      legal_dong = :legalDong,
      juso_adm_cd = :admCd,
      district_source = :districtSource,
      district_normalized_at = :normalizedAt,
      updated_at = CURRENT_TIMESTAMP
    WHERE place_id = :placeId
  `);

  database.exec('BEGIN');
  try {
    for (const change of changes) {
      statement.run({
        placeId: change.row.placeId,
        district: change.normalized.district,
        jibunAddress: change.normalized.jibunAddress || null,
        legalDong: change.normalized.legalDong || null,
        admCd: change.normalized.admCd || null,
        districtSource: DISTRICT_SOURCE,
        normalizedAt,
      });
    }

    database.exec('COMMIT');
  } catch (error) {
    database.exec('ROLLBACK');
    throw error;
  }
}

function buildNormalizedDistrictFromJuso(result) {
  const siNm = normalizeText(result.siNm);
  const sggNm = normalizeText(result.sggNm);
  const emdNm = normalizeText(result.emdNm);
  const liNm = normalizeText(result.liNm);

  if (!siNm || !sggNm || !emdNm) {
    return '';
  }

  const parts = [siNm, sggNm, emdNm];

  if (/[읍면]$/.test(emdNm) && liNm) {
    parts.push(liNm);
  }

  return normalizeText(parts.join(' '));
}

function shouldNormalizeDistrict(input) {
  const district = normalizeText(input.district);
  const addressText = normalizeText(`${input.address} ${input.roadAddress}`);
  const districtParts = district.split(/\s+/).filter(Boolean);
  const lastDistrictPart = districtParts.at(-1) ?? '';

  if (!district) {
    return ROAD_NAME_WITH_BUILDING_NUMBER_PATTERN.test(addressText);
  }

  if (DONGTAN_SUBDISTRICT_PATTERN.test(addressText) && !district.includes('동탄구')) {
    return true;
  }

  if (LEGAL_UNIT_SUFFIX_PATTERN.test(lastDistrictPart)) {
    return false;
  }

  return ROAD_NAME_WITH_BUILDING_NUMBER_PATTERN.test(addressText);
}

function buildJusoSearchKeywords(input) {
  const candidates = [input.roadAddress, input.address]
    .map(normalizeText)
    .filter(Boolean);
  const keywords = [];

  for (const candidate of candidates) {
    pushUnique(keywords, candidate);

    const roadAddressBase = extractRoadAddressBase(candidate);
    if (roadAddressBase) {
      pushUnique(keywords, roadAddressBase);
    }
  }

  return keywords.slice(0, DISTRICT_KEYWORD_LIMIT);
}

function extractRoadAddressBase(address) {
  const words = normalizeText(address)
    .replace(/[()]/g, ' ')
    .split(/\s+/)
    .map((word) => word.replace(/[,.]$/g, ''))
    .filter(Boolean);

  const roadNameIndex = words.findIndex((word) => /(?:대로|로|길)$/.test(word));

  if (roadNameIndex < 0) {
    return '';
  }

  const buildingNumber = words[roadNameIndex + 1];

  if (!buildingNumber || !/^\d+(?:-\d+)?$/.test(buildingNumber)) {
    return '';
  }

  return words.slice(0, roadNameIndex + 2).join(' ');
}

function normalizeComparableAddress(value) {
  return normalizeText(value).replace(/[\s(),.]/g, '');
}

function pushUnique(values, value) {
  if (!values.includes(value)) {
    values.push(value);
  }
}

function normalizeText(value) {
  return value === undefined || value === null
    ? ''
    : String(value).replace(/\s+/g, ' ').trim();
}
