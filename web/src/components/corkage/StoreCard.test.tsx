import { render, screen } from '@testing-library/react';
import { StoreCard } from './StoreCard';
import { getStoreById } from '../../lib/repo/corkage-repo';

describe('StoreCard', () => {
  it('renders the trusted available store details', () => {
    const store = getStoreById('seoul-vin-table');

    expect(store).toBeDefined();

    render(
      <StoreCard
        isNearest={false}
        onSelect={() => {}}
        selected={false}
        store={store!}
      />,
    );

    expect(screen.getByRole('heading', { name: '빈테이블 청담' })).toBeInTheDocument();
    expect(screen.getByText('가능')).toBeInTheDocument();
    expect(screen.getByText('30,000원 / 병')).toBeInTheDocument();
    expect(screen.getByLabelText('신뢰도 높은 신뢰')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '빈테이블 청담 카드 선택' })).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByRole('link', { name: '빈테이블 청담 상세 보기' })).toHaveAttribute('href', '/store/seoul-vin-table');
  });

  it('renders imported NAVER corkage facility tags and free fee labels', () => {
    const store = getStoreById('seoul-vin-table');

    expect(store).toBeDefined();

    render(
      <StoreCard
        isNearest={false}
        onSelect={() => {}}
        selected={false}
        store={{
          ...store!,
          corkageFee: 0,
          feeUnit: 'free',
          confidenceLabel: 'low',
          sourceType: 'public_web_reference',
          sourceNote: 'NAVER InformationFacilities 자동 추출',
          conditionNote: '콜키지 가능 (무료)',
          rawFacilities: ['콜키지 가능 (무료)', '예약'],
        }}
      />,
    );

    expect(screen.getByText('무료')).toBeInTheDocument();
    expect(screen.getAllByText('콜키지 가능 (무료)').length).toBeGreaterThan(0);
    expect(
      screen.getByLabelText('네이버 편의정보 콜키지 태그'),
    ).toHaveTextContent('콜키지 가능 (무료)');
  });

  it('shows both selected and nearest visual states together', () => {
    const store = getStoreById('seoul-vin-table');

    expect(store).toBeDefined();

    render(
      <StoreCard
        isNearest
        onSelect={() => {}}
        selected
        store={{
          ...store!,
          distanceMeters: 120,
        }}
      />,
    );

    expect(screen.getByText('선택됨')).toBeInTheDocument();
    expect(screen.getByLabelText('현재 위치 기준 가장 가까운 식당')).toBeInTheDocument();
    expect(screen.getByText('120m')).toBeInTheDocument();

    const article = screen.getByRole('heading', { name: '빈테이블 청담' }).closest('article');
    expect(article).toHaveClass('card', 'card--selected', 'card--nearest');
    expect(screen.getByRole('button', { name: '빈테이블 청담 카드 선택' })).toHaveAttribute('aria-pressed', 'true');
  });
});
