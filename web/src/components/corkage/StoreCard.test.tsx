import { render, screen } from '@testing-library/react';
import { StoreCard } from './StoreCard';
import { getStoreById } from '../../lib/repo/corkage-repo';

describe('StoreCard', () => {
  it('renders the trusted available store details', () => {
    const store = getStoreById('seoul-vin-table');

    expect(store).toBeDefined();

    render(<StoreCard store={store!} />);

    expect(
      screen.getByRole('heading', { name: '빈테이블 청담' }),
    ).toBeInTheDocument();
    expect(screen.getByText('가능')).toBeInTheDocument();
    expect(screen.getByText('30,000원 / 병')).toBeInTheDocument();
    expect(screen.getByLabelText('신뢰도 높은 신뢰')).toBeInTheDocument();
  });
});
