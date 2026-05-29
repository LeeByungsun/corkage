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
    placeId: 'available-yeongcheon',
    name: '영천 가능 식당',
    address: '경기도 화성시 동탄구 영천동 1',
    roadAddress: '지산1길 1',
    lat: 37.2052,
    lng: 127.0982,
    category: '다이닝',
    district: '경기도 화성시 동탄구 영천동',
    corkageStatus: 'available',
    freshnessState: 'fresh',
    confidenceLabel: 'high',
    verifiedAt: '2026-05-22',
    sourceType: 'operator_verified',
    sourceNote: '매장 확인',
    conditionNote: '와인 1병 가능',
  },
  {
    placeId: 'unknown-yeongcheon',
    name: '영천 확인중 식당',
    address: '경기도 화성시 동탄구 영천동 2',
    roadAddress: '지산1길 2',
    lat: 37.2062,
    lng: 127.0992,
    category: '비스트로',
    district: '경기도 화성시 동탄구 영천동',
    corkageStatus: 'unknown',
    freshnessState: 'fresh',
    confidenceLabel: 'low',
    verifiedAt: '검수 전',
    sourceType: 'public_web_reference',
    sourceNote: '후보 정보',
    conditionNote: '확인 필요',
  },
  {
    placeId: 'unavailable-yeongcheon',
    name: '영천 불가 식당',
    address: '경기도 화성시 동탄구 영천동 3',
    roadAddress: '지산1길 3',
    lat: 37.2072,
    lng: 127.1002,
    category: '한식',
    district: '경기도 화성시 동탄구 영천동',
    corkageStatus: 'unavailable',
    freshnessState: 'fresh',
    confidenceLabel: 'high',
    verifiedAt: '2026-05-22',
    sourceType: 'operator_verified',
    sourceNote: '매장 확인',
    conditionNote: '반입 불가',
  },
  {
    placeId: 'available-osan-without-gu',
    name: '오산 가능 식당',
    address: '경기도 화성시 오산동 1089',
    roadAddress: '동탄역로 160',
    lat: 37.2082,
    lng: 127.1012,
    category: '와인바',
    district: '경기도 화성시 오산동',
    corkageStatus: 'available',
    freshnessState: 'fresh',
    confidenceLabel: 'medium',
    verifiedAt: '2026-05-22',
    sourceType: 'operator_verified',
    sourceNote: '매장 확인',
    conditionNote: '확인됨',
  },
] as const;

const testDistricts = [
  '경기도 화성시 동탄구 영천동',
  '경기도 화성시 오산동',
];

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

  it('shows a Dongtan-gu region gate before a region is selected', () => {
    renderStoreExplorer({ district: 'all' });

    expect(
      screen.getByRole('heading', { name: '동탄구 어느 동에서 찾으세요?' }),
    ).toBeInTheDocument();
    expect(screen.getByText(/경기 화성시 동탄구/)).toBeInTheDocument();
    expect(screen.getByLabelText('동탄구 세부 지역')).toBeInTheDocument();
    expect(screen.getByRole('option', { name: '영천동' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: '오산동' })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: '가능 매장 보기' }),
    ).toBeInTheDocument();
    expect(screen.queryByTestId('store-map')).not.toBeInTheDocument();
    expect(screen.queryByText(/개 결과|개 식당|개 가능 매장/)).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: '영천 가능 식당' })).not.toBeInTheDocument();
  });

  it('shows only available stores for the selected Dongtan-gu district', () => {
    renderStoreExplorer({ district: '경기도 화성시 동탄구 영천동' });

    expect(screen.getByText('동탄구 영천동')).toBeInTheDocument();
    expect(screen.getByText('1개 가능 매장')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '영천 가능 식당' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: '영천 확인중 식당' })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: '영천 불가 식당' })).not.toBeInTheDocument();
    expect(screen.queryByTestId('store-map')).not.toBeInTheDocument();
  });

  it('folds Hwaseong dong-only districts under Dongtan-gu when filtering', () => {
    renderStoreExplorer({ district: '경기도 화성시 동탄구 오산동' });

    expect(screen.getByText('동탄구 오산동')).toBeInTheDocument();
    expect(screen.getByText('1개 가능 매장')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '오산 가능 식당' })).toBeInTheDocument();
  });
});
