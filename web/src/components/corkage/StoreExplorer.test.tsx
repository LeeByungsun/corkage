import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { StoreExplorer } from './StoreExplorer';

const mockUseCanonicalStores = vi.hoisted(() => vi.fn());

vi.mock('../../lib/repo/use-canonical-stores', () => ({
  useCanonicalStores: mockUseCanonicalStores,
}));

describe('StoreExplorer', () => {
  beforeEach(() => {
    mockUseCanonicalStores.mockReturnValue([
      {
        placeId: 'near-store',
        name: '가까운 식당',
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
        sourceNote: '테스트',
        conditionNote: '테스트',
      },
      {
        placeId: 'far-store',
        name: '먼 식당',
        address: '서울시 성수구 2',
        roadAddress: '서울시 성수구 2',
        lat: 37.5602,
        lng: 127.1502,
        category: '비스트로',
        district: '성수',
        corkageStatus: 'available',
        freshnessState: 'fresh',
        confidenceLabel: 'medium',
        verifiedAt: '2026-05-22',
        sourceType: 'operator_verified',
        sourceNote: '테스트',
        conditionNote: '테스트',
      },
    ]);

    vi.stubGlobal('navigator', {
      geolocation: {
        getCurrentPosition: vi.fn((success: PositionCallback) =>
          success({
            coords: {
              latitude: 37.5252,
              longitude: 127.0482,
              accuracy: 30,
            },
          } as GeolocationPosition),
        ),
      },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it('gets current location and sorts stores by nearest first', async () => {
    render(<StoreExplorer status="all" district="all" maxFeeInput="" />);

    fireEvent.click(screen.getByRole('button', { name: '현재 위치 가져오기' }));

    await waitFor(() =>
      expect(screen.getByText(/현재 위치 기준 정렬/)).toBeInTheDocument(),
    );

    expect(
      screen.getByRole('heading', { level: 2, name: '가까운 식당' }),
    ).toBeInTheDocument();
    expect(screen.getByText('0m')).toBeInTheDocument();
  });

  it('applies radius filter after current location is available', async () => {
    render(<StoreExplorer status="all" district="all" maxFeeInput="" />);

    fireEvent.click(screen.getByRole('button', { name: '현재 위치 가져오기' }));

    await waitFor(() =>
      expect(screen.getByText(/현재 위치 기준 정렬/)).toBeInTheDocument(),
    );

    fireEvent.change(screen.getByLabelText('반경'), {
      target: { value: '1000' },
    });

    expect(screen.getByText('1개 결과')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '가까운 식당' })).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: '먼 식당' }),
    ).not.toBeInTheDocument();
  });
});
