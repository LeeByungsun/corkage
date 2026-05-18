import { corkageSeed } from '../data/corkage-seed';
import type {
  ConfidenceLabel,
  CorkageStore,
  FeeUnit,
  StoreFilterInput,
} from '../types/corkage';

const CONFIDENCE_LABELS: Record<ConfidenceLabel, string> = {
  high: '높은 신뢰',
  medium: '보통 신뢰',
  low: '낮은 신뢰',
};

const FEE_UNIT_LABELS: Record<FeeUnit, string> = {
  per_bottle: '병',
  per_table: '테이블',
  free: '무료',
};

const SOURCE_TYPE_LABELS: Record<CorkageStore['sourceType'], string> = {
  operator_verified: '운영자 검수',
  store_direct: '매장 직접 확인',
  user_report_reviewed: '사용자 제보 검수 반영',
  public_web_reference: '공개 웹 참고',
  partner_data: '제휴 데이터',
};

export function getAllStores(): CorkageStore[] {
  return corkageSeed;
}

export function getStoreById(placeId: string): CorkageStore | undefined {
  return corkageSeed.find((store) => store.placeId === placeId);
}

export function listDistricts(): string[] {
  return [...new Set(corkageSeed.map((store) => store.district))].sort();
}

export function filterStores({
  status = 'all',
  district,
  maxFee,
}: StoreFilterInput): CorkageStore[] {
  return corkageSeed.filter((store) => {
    if (status === 'stale' && store.freshnessState !== 'stale') {
      return false;
    }

    if (
      status !== 'all' &&
      status !== 'stale' &&
      store.corkageStatus !== status
    ) {
      return false;
    }

    if (district && district !== 'all' && store.district !== district) {
      return false;
    }

    if (
      typeof maxFee === 'number' &&
      Number.isFinite(maxFee) &&
      maxFee > 0 &&
      (store.corkageFee === undefined || store.corkageFee > maxFee)
    ) {
      return false;
    }

    return true;
  });
}

export function getDisplayStatus(store: CorkageStore): string {
  if (store.corkageStatus === 'unknown') {
    return '확인중';
  }

  if (store.freshnessState === 'stale') {
    return '정보 오래됨';
  }

  return store.corkageStatus === 'available' ? '가능' : '불가';
}

export function getConfidenceText(confidenceLabel: ConfidenceLabel): string {
  return CONFIDENCE_LABELS[confidenceLabel];
}

export function getSourceTypeLabel(sourceType: CorkageStore['sourceType']): string {
  return SOURCE_TYPE_LABELS[sourceType];
}

export function shouldShowFeeDetails(store: CorkageStore): boolean {
  if (store.corkageStatus === 'unknown') {
    return false;
  }

  if (store.freshnessState === 'fresh') {
    return store.confidenceLabel === 'high' || store.confidenceLabel === 'medium';
  }

  return store.corkageFee !== undefined;
}

export function getFeeLabel(store: CorkageStore): string | null {
  if (store.corkageStatus === 'unavailable') {
    return '반입 불가 안내';
  }

  if (!shouldShowFeeDetails(store)) {
    return null;
  }

  if (!store.corkageFee || !store.feeUnit) {
    return '비용 문의 필요';
  }

  if (store.feeUnit === 'free') {
    return FEE_UNIT_LABELS.free;
  }

  const formatted = new Intl.NumberFormat('ko-KR').format(store.corkageFee);

  return `${formatted}원 / ${FEE_UNIT_LABELS[store.feeUnit]}`;
}

export function getVisibilityNote(store: CorkageStore): string {
  if (store.corkageStatus === 'unknown') {
    return '검수 전 제보 단계입니다. 매장 확인 후 반영됩니다.';
  }

  if (store.freshnessState === 'stale') {
    return '마지막 확인일이 오래됐습니다. 방문 전 매장 확인이 필요합니다.';
  }

  if (store.confidenceLabel === 'low') {
    return '공개 웹 참고 비중이 높아 정확하지 않을 수 있습니다.';
  }

  return '운영 정책상 canonical 정보만 보수적으로 표시합니다.';
}

export function getStoreCounts() {
  const stores = getAllStores();

  return {
    total: stores.length,
    available: stores.filter(
      (store) =>
        store.corkageStatus === 'available' && store.freshnessState === 'fresh',
    ).length,
    stale: stores.filter((store) => store.freshnessState === 'stale').length,
  };
}
