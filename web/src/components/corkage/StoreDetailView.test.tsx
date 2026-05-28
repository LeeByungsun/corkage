import { render, screen } from '@testing-library/react';
import { StoreDetailView } from './StoreDetailView';
import { getStoreById } from '../../lib/repo/corkage-repo';

vi.mock('./StoreLocationMap', () => ({
  StoreLocationMap: ({ store }: { store: { name: string } }) => (
    <section aria-label="상세 위치 지도">{store.name} 지도</section>
  ),
}));

describe('StoreDetailView', () => {
  it('shows corkage details, visit warning, and location map', () => {
    const store = getStoreById('seoul-vin-table');

    expect(store).toBeDefined();

    render(<StoreDetailView store={store!} />);

    expect(screen.getByRole('heading', { name: '빈테이블 청담' })).toBeInTheDocument();
    expect(screen.getByText('가능')).toBeInTheDocument();
    expect(screen.getByText('30,000원 / 병')).toBeInTheDocument();
    expect(
      screen.getByText('콜키지 정책은 방문 전 매장에 다시 확인하세요.'),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('상세 위치 지도')).toHaveTextContent('빈테이블 청담 지도');
  });
});
