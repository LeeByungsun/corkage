export type JusoAddressResult = {
  siNm?: string | null;
  sggNm?: string | null;
  emdNm?: string | null;
  liNm?: string | null;
};

export type DistrictNormalizationInput = {
  address: string;
  roadAddress: string;
  district: string;
};

export type JusoSearchKeywordInput = Pick<
  DistrictNormalizationInput,
  'address' | 'roadAddress'
>;

const LEGAL_UNIT_SUFFIX_PATTERN = /[읍면동]$/;
const ROAD_NAME_WITH_BUILDING_NUMBER_PATTERN = /\S+(?:대로|로|길)\s+\d+(?:-\d+)?/;
const DONGTAN_SUBDISTRICT_PATTERN = /화성시\s+동탄구/;
const DISTRICT_KEYWORD_LIMIT = 4;

export function buildNormalizedDistrictFromJuso(result: JusoAddressResult) {
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

export function shouldNormalizeDistrict(input: DistrictNormalizationInput) {
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

export function buildJusoSearchKeywords(input: JusoSearchKeywordInput) {
  const candidates = [input.roadAddress, input.address]
    .map(normalizeText)
    .filter(Boolean);
  const keywords: string[] = [];

  for (const candidate of candidates) {
    pushUnique(keywords, candidate);

    const roadAddressBase = extractRoadAddressBase(candidate);
    if (roadAddressBase) {
      pushUnique(keywords, roadAddressBase);
    }
  }

  return keywords.slice(0, DISTRICT_KEYWORD_LIMIT);
}

function extractRoadAddressBase(address: string) {
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

function pushUnique(values: string[], value: string) {
  if (!values.includes(value)) {
    values.push(value);
  }
}

function normalizeText(value: unknown) {
  return value === undefined || value === null
    ? ''
    : String(value).replace(/\s+/g, ' ').trim();
}
