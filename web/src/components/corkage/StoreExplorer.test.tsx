import type { ComponentProps } from 'react';
import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { StoreExplorer } from './StoreExplorer';

const replaceMock = vi.fn();

vi.mock('next/navigation', () => ({
  usePathname: () => '/store',
  useRouter: () => ({ replace: replaceMock }),
  useSearchParams: () => new URLSearchParams('status=all&district=all'),
}));

vi.mock('./StoreMap', () => ({
  StoreMap: () => <div data-testid="store-map">지도</div>,
}));

const testStores = [
  {
    placeId: 'available-gangnam',
    name: '가능 식당',
    address: '서울시 강남구 1',
    roadAddress: '서울시 강남구 1',
    lat: 37.5252,
    lng: 127.0482,
    category: '다이닝',
    district: '강남',
    corkageStatus: 'available',
    freshnessState: 'fresh',
    confidenceLabel: 'high',
    verifiedAt: '2026-05-22',
    sourceType: 'operator_verified',
    sourceNote: '매장 확인',
    conditionNote: '와인 1병 가능',
  },
  {
    placeId: 'unknown-gangnam',
    name: '확인중 식당',
    address: '서울시 강남구 2',
    roadAddress: '서울시 강남구 2',
    lat: 37.5262,
    lng: 127.0492,
    category: '비스트로',
    district: '강남',
    corkageStatus: 'unknown',
    freshnessState: 'fresh',
    confidenceLabel: 'low',
    verifiedAt: '검수 전',
    sourceType: 'public_web_reference',
    sourceNote: '후보 정보',
    conditionNote: '확인 필요',
  },
  {
    placeId: 'unavailable-gangnam',
    name: '불가 식당',
    address: '서울시 강남구 3',
    roadAddress: '서울시 강남구 3',
    lat: 37.5272,
    lng: 127.0502,
    category: '한식',
    district: '강남',
    corkageStatus: 'unavailable',
    freshnessState: 'fresh',
    confidenceLabel: 'high',
    verifiedAt: '2026-05-22',
    sourceType: 'operator_verified',
    sourceNote: '매장 확인',
    conditionNote: '반입 불가',
  },
  {
    placeId: 'stale-gangnam',
    name: '오래된 식당',
    address: '서울시 강남구 4',
    roadAddress: '서울시 강남구 4',
    lat: 37.5282,
    lng: 127.0512,
    category: '와인바',
    district: '강남',
    corkageStatus: 'available',
    freshnessState: 'stale',
    confidenceLabel: 'medium',
    verifiedAt: '2025-01-01',
    sourceType: 'operator_verified',
    sourceNote: '오래된 확인',
    conditionNote: '정보 오래됨',
  },
  {
    placeId: 'available-seongsu',
    name: '성수 가능 식당',
    address: '서울시 성수구 1',
    roadAddress: '서울시 성수구 1',
    lat: 37.5602,
    lng: 127.1502,
    category: '다이닝',
    district: '성수',
    corkageStatus: 'available',
    freshnessState: 'fresh',
    confidenceLabel: 'medium',
    verifiedAt: '2026-05-22',
    sourceType: 'operator_verified',
    sourceNote: '매장 확인',
    conditionNote: '확인됨',
  },
] as const;

const testDistricts = ['강남', '성수'];

function renderStoreExplorer(
  overrides: Partial<ComponentProps<typeof StoreExplorer>> = {},
) {
  return render(
    <StoreExplorer
      district="all"
      districts={[...testDistricts]}
      stores={[...testStores]}
      {...overrides}
    />,
  );
}

describe('StoreExplorer', () => {
  beforeEach(() => {
    replaceMock.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('shows only the region gate before a region is selected', () => {
    renderStoreExplorer({ district: 'all' });

    expect(
      screen.getByRole('heading', { name: '어느 지역에서 찾으세요?' }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('지역')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: '지역 선택하기' }),
    ).toBeInTheDocument();
    expect(screen.queryByTestId('store-map')).not.toBeInTheDocument();
    expect(screen.queryByText(/개 결과|개 식당/)).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: '가능 식당' })).not.toBeInTheDocument();
  });

  it('shows every store for the selected region regardless of corkage status', () => {
    renderStoreExplorer({ district: '강남' });

    expect(screen.getByText('강남')).toBeInTheDocument();
    expect(screen.getByText('4개 식당')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '가능 식당' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '확인중 식당' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '불가 식당' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '오래된 식당' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: '성수 가능 식당' })).not.toBeInTheDocument();
    expect(screen.queryByTestId('store-map')).not.toBeInTheDocument();
  });
});
