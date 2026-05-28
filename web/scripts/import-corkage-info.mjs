/* eslint-env node */

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';

const WEB_DIR = process.cwd();
const SOURCE_PATH = path.resolve(WEB_DIR, process.argv[2] ?? 'corkage-info.json');
const DB_PATH = path.resolve(
  WEB_DIR,
  process.env.CORKAGE_STORE_DB_FILE ?? path.join('data', 'corkage.sqlite'),
);

const CORKAGE_STATUSES = new Set(['available', 'unavailable', 'unknown']);
const FRESHNESS_STATES = new Set(['fresh', 'stale']);
const CONFIDENCE_LABELS = new Set(['high', 'medium', 'low']);
const SOURCE_TYPES = new Set([
  'operator_verified',
  'store_direct',
  'user_report_reviewed',
  'public_web_reference',
  'partner_data',
]);
const FEE_UNITS = new Set(['per_bottle', 'per_table', 'free']);

const raw = await readFile(SOURCE_PATH, 'utf8');
const rows = parseSource(raw, SOURCE_PATH);
const updates = rows.map(normalizeCorkageInfoRow);
const database = new DatabaseSync(DB_PATH);

try {
  database.exec('BEGIN');
  const updateStatement = database.prepare(`
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
      memo = COALESCE(:memo, memo),
      updated_at = CURRENT_TIMESTAMP
    WHERE place_id = :placeId
  `);

  const results = [];

  for (const update of updates) {
    const existing = database
      .prepare(
        `SELECT
          condition_note,
          corkage_fee,
          fee_unit,
          bottle_limit,
          alcohol_type_limit,
          glass_service_available
        FROM stores WHERE place_id = ?`,
      )
      .get(update.placeId);

    if (!existing) {
      results.push({ placeId: update.placeId, updated: false });
      continue;
    }

    updateStatement.run({
      ...update,
      conditionNote: update.conditionNote ?? existing.condition_note,
      corkageFee: update.corkageFee ?? existing.corkage_fee ?? null,
      feeUnit: update.feeUnit ?? existing.fee_unit ?? null,
      bottleLimit: update.bottleLimit ?? existing.bottle_limit ?? null,
      alcoholTypeLimit:
        update.alcoholTypeLimit ?? existing.alcohol_type_limit ?? null,
      glassServiceAvailable:
        update.glassServiceAvailable === undefined
          ? existing.glass_service_available ?? null
          : update.glassServiceAvailable
            ? 1
            : 0,
      memo: update.memo ?? null,
    });
    results.push({ placeId: update.placeId, updated: true });
  }

  database.exec('COMMIT');

  const updated = results.filter((result) => result.updated).length;
  const missing = results.filter((result) => !result.updated);

  console.log(`Imported corkage info from ${SOURCE_PATH}`);
  console.log(`Updated ${updated} stores in ${DB_PATH}`);

  if (missing.length > 0) {
    console.log(
      `Skipped ${missing.length} unknown placeIds: ${missing
        .map((result) => result.placeId)
        .join(', ')}`,
    );
  }
} catch (error) {
  database.exec('ROLLBACK');
  throw error;
} finally {
  database.close();
}

function parseSource(content, sourcePath) {
  if (sourcePath.endsWith('.csv')) {
    return parseCsv(content);
  }

  const parsed = JSON.parse(content);

  if (Array.isArray(parsed)) {
    return parsed;
  }

  if (Array.isArray(parsed.records)) {
    return parsed.records;
  }

  throw new Error('Corkage info JSON must be an array or { "records": [...] }');
}

function normalizeCorkageInfoRow(row) {
  const placeId = normalizeText(readField(row, 'placeId', 'place_id'));
  const corkageStatus = normalizeCorkageStatus(
    readField(row, 'corkageStatus', 'corkage_status', 'status'),
  );
  const sourceType = normalizeEnum(
    readField(row, 'sourceType', 'source_type'),
    SOURCE_TYPES,
    'sourceType',
  );
  const verifiedAt = normalizeDate(readField(row, 'verifiedAt', 'verified_at'));
  const sourceNote = normalizeText(readField(row, 'sourceNote', 'source_note'));
  const conditionNote = normalizeOptionalText(
    readField(row, 'conditionNote', 'condition_note'),
  );

  if (!placeId) {
    throw new Error('placeId is required for every corkage info row');
  }

  if (!sourceNote) {
    throw new Error(`sourceNote is required for ${placeId}`);
  }

  return {
    placeId,
    corkageStatus,
    freshnessState: normalizeOptionalEnum(
      readField(row, 'freshnessState', 'freshness_state'),
      FRESHNESS_STATES,
      'freshnessState',
    ) ?? 'fresh',
    confidenceLabel:
      normalizeOptionalEnum(
        readField(row, 'confidenceLabel', 'confidence_label'),
        CONFIDENCE_LABELS,
        'confidenceLabel',
      ) ?? getDefaultConfidenceLabel(sourceType),
    verifiedAt,
    sourceType,
    sourceNote,
    conditionNote,
    corkageFee: normalizeOptionalNumber(readField(row, 'corkageFee', 'corkage_fee')),
    feeUnit: normalizeOptionalEnum(
      normalizeFeeUnit(readField(row, 'feeUnit', 'fee_unit')),
      FEE_UNITS,
      'feeUnit',
    ),
    bottleLimit: normalizeOptionalNumber(readField(row, 'bottleLimit', 'bottle_limit')),
    alcoholTypeLimit: normalizeOptionalText(
      readField(row, 'alcoholTypeLimit', 'alcohol_type_limit'),
    ),
    glassServiceAvailable: normalizeOptionalBoolean(
      readField(row, 'glassServiceAvailable', 'glass_service_available'),
    ),
    memo: normalizeOptionalText(readField(row, 'memo')),
  };
}

function readField(row, ...keys) {
  for (const key of keys) {
    if (row && Object.prototype.hasOwnProperty.call(row, key)) {
      return row[key];
    }
  }

  return undefined;
}

function normalizeCorkageStatus(value) {
  const text = normalizeText(value);
  const mapped = {
    가능: 'available',
    불가: 'unavailable',
    확인중: 'unknown',
    미확인: 'unknown',
    available: 'available',
    unavailable: 'unavailable',
    unknown: 'unknown',
  }[text];

  if (!mapped || !CORKAGE_STATUSES.has(mapped)) {
    throw new Error(`Invalid corkageStatus: ${text}`);
  }

  return mapped;
}

function normalizeFeeUnit(value) {
  const text = normalizeText(value);

  return {
    병당: 'per_bottle',
    테이블당: 'per_table',
    무료: 'free',
    per_bottle: 'per_bottle',
    per_table: 'per_table',
    free: 'free',
  }[text] ?? text;
}

function normalizeEnum(value, allowed, fieldName) {
  const text = normalizeText(value);

  if (!allowed.has(text)) {
    throw new Error(`Invalid ${fieldName}: ${text}`);
  }

  return text;
}

function normalizeOptionalEnum(value, allowed, fieldName) {
  const text = normalizeText(value);

  if (!text) {
    return undefined;
  }

  return normalizeEnum(text, allowed, fieldName);
}

function normalizeDate(value) {
  const text = normalizeText(value);

  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    throw new Error(`verifiedAt must be YYYY-MM-DD: ${text}`);
  }

  return text;
}

function normalizeOptionalNumber(value) {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  const number = Number(value);

  if (!Number.isFinite(number) || number < 0) {
    throw new Error(`Invalid number value: ${value}`);
  }

  return number;
}

function normalizeOptionalBoolean(value) {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  const text = normalizeText(value).toLowerCase();

  if (['true', '1', 'yes', 'y', '가능'].includes(text)) {
    return true;
  }

  if (['false', '0', 'no', 'n', '불가'].includes(text)) {
    return false;
  }

  throw new Error(`Invalid boolean value: ${value}`);
}

function normalizeText(value) {
  return value === undefined || value === null ? '' : String(value).trim();
}

function normalizeOptionalText(value) {
  const text = normalizeText(value);

  return text || undefined;
}

function getDefaultConfidenceLabel(sourceType) {
  switch (sourceType) {
    case 'operator_verified':
    case 'store_direct':
      return 'high';
    case 'partner_data':
    case 'user_report_reviewed':
      return 'medium';
    case 'public_web_reference':
      return 'low';
    default:
      throw new Error(`Unsupported sourceType: ${sourceType}`);
  }
}

function parseCsv(content) {
  const rows = content
    .trim()
    .split(/\r?\n/)
    .filter(Boolean)
    .map(parseCsvLine);
  const headers = rows.shift();

  if (!headers) {
    return [];
  }

  return rows.map((row) =>
    Object.fromEntries(headers.map((header, index) => [header, row[index] ?? ''])),
  );
}

function parseCsvLine(line) {
  const cells = [];
  let cell = '';
  let quoted = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const nextChar = line[index + 1];

    if (char === '"' && quoted && nextChar === '"') {
      cell += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === ',' && !quoted) {
      cells.push(cell);
      cell = '';
    } else {
      cell += char;
    }
  }

  cells.push(cell);

  return cells.map((value) => value.trim());
}
