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
});
