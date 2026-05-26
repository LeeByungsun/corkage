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

  it('renders an explicit selected state', () => {
    const store = getStoreById('seoul-vin-table');

    expect(store).toBeDefined();

    render(
      <StoreCard
        isNearest={false}
        onSelect={() => {}}
        selected
        store={store!}
      />,
    );

    const card = screen.getByRole('heading', { name: '빈테이블 청담' }).closest('article');
    const selectButton = screen.getByRole('button', { name: '빈테이블 청담 카드 선택' });

    expect(card).toHaveClass('card--selected');
    expect(screen.getByText('선택됨')).toBeInTheDocument();
    expect(selectButton).toHaveClass('primary-button', 'card__select-button--selected');
    expect(selectButton).toHaveAttribute('aria-pressed', 'true');
  });

  it('keeps nearest and selected visual hooks together when both states are active', () => {
    const store = getStoreById('seoul-vin-table');

    expect(store).toBeDefined();

    render(
      <StoreCard
        isNearest
        onSelect={() => {}}
        selected
        store={store!}
      />,
    );

    const card = screen.getByRole('heading', { name: '빈테이블 청담' }).closest('article');

    expect(card).toHaveClass('card--selected', 'card--nearest');
    expect(screen.getByLabelText('현재 위치 기준 가장 가까운 식당')).toBeInTheDocument();
    expect(screen.getByText('선택됨')).toBeInTheDocument();
  });
});
