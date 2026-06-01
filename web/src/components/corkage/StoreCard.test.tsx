import { render, screen } from '@testing-library/react';
import { StoreCard } from './StoreCard';
import { getStoreById } from '../../lib/repo/corkage-repo';

describe('StoreCard', () => {
  it('renders the trusted available store details as a visit-decision card', () => {
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
    expect(screen.getByText('30,000원 / 병 · 조건 확인 필요')).toBeInTheDocument();
    expect(screen.getByText('750ml 와인 기준. 사전 예약 시 반입 가능')).toBeInTheDocument();
    expect(screen.getByText('서울 강남구 도산대로81길 15')).toBeInTheDocument();
    expect(screen.getByText('매장 직접 확인 · 2026-05-10 확인')).toBeInTheDocument();
    expect(screen.queryByLabelText('신뢰도 높은 신뢰')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: '빈테이블 청담 카드 선택' })).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByRole('link', { name: '빈테이블 청담 상세 보기' })).toHaveAttribute('href', '/store/seoul-vin-table');
  });

  it('renders a short Dongtan-gu card address when source road address is partial', () => {
    const store = getStoreById('seoul-vin-table');

    expect(store).toBeDefined();

    render(
      <StoreCard
        store={{
          ...store!,
          category: '다이닝',
          district: '경기도 화성시 동탄구 영천동',
          roadAddress: '지산2길 5',
        }}
      />,
    );

    expect(screen.getByText('동탄구 영천동 · 다이닝')).toBeInTheDocument();
    expect(screen.getByText('지산2길 5')).toBeInTheDocument();
    expect(screen.queryByText('경기도 화성시 동탄구 지산2길 5')).not.toBeInTheDocument();
  });

  it('shows free corkage as condition-check-needed and removes duplicate facility tags', () => {
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
          verifiedAt: '2026-05-28',
          conditionNote: '콜키지 가능 (무료)',
          rawFacilities: ['콜키지 가능 (무료)', '예약'],
        }}
      />,
    );

    expect(screen.getByText('무료 · 조건 확인 필요')).toBeInTheDocument();
    expect(screen.getAllByText('콜키지 가능 (무료)')).toHaveLength(1);
    expect(screen.queryByLabelText('네이버 편의정보 콜키지 태그')).not.toBeInTheDocument();
    expect(
      screen.getByText('공개 웹 참고 · 2026-05-28 확인 · 방문 전 조건 확인 권장'),
    ).toBeInTheDocument();
  });

  it('shows paid corkage without an amount as cost-check-needed', () => {
    const store = getStoreById('seoul-vin-table');

    expect(store).toBeDefined();

    render(
      <StoreCard
        store={{
          ...store!,
          corkageFee: undefined,
          feeUnit: undefined,
          conditionNote: '콜키지 가능 (유료)',
          rawFacilities: ['콜키지 가능 (유료)'],
        }}
      />,
    );

    expect(screen.getByText('유료 · 비용 확인 필요')).toBeInTheDocument();
    expect(screen.getAllByText('콜키지 가능 (유료)')).toHaveLength(1);
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
    expect(screen.getByText('현재 위치 기준 120m')).toBeInTheDocument();

    const article = screen.getByRole('heading', { name: '빈테이블 청담' }).closest('article');
    expect(article).toHaveClass('card', 'card--selected', 'card--nearest', 'card--visit-decision');
    expect(screen.getByRole('button', { name: '빈테이블 청담 카드 선택' })).toHaveAttribute('aria-pressed', 'true');
  });
});

describe('StoreCard guest mode', () => {
  it('renders as a simple guest card when no selection handler is provided', () => {
    const store = getStoreById('seoul-vin-table');

    expect(store).toBeDefined();

    render(<StoreCard store={store!} />);

    expect(screen.queryByRole('button', { name: /카드 선택$/ })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: '빈테이블 청담 상세 보기' })).toHaveAttribute(
      'href',
      '/store/seoul-vin-table',
    );
  });

  it('uses conservative guest copy for unknown corkage stores', () => {
    const store = getStoreById('seoul-vin-table');

    expect(store).toBeDefined();

    render(
      <StoreCard
        store={{
          ...store!,
          corkageStatus: 'unknown',
          confidenceLabel: 'low',
          conditionNote: '확인 필요',
          sourceNote: '후보 정보',
          verifiedAt: '검수 전',
        }}
      />,
    );

    expect(screen.getByText('확인중')).toBeInTheDocument();
    expect(
      screen.getByText('콜키지 정보 확인 필요 · 방문 전 매장 확인 권장'),
    ).toBeInTheDocument();
    expect(screen.getByText('비용 공개 전')).toBeInTheDocument();
  });
});
