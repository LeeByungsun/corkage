import { fireEvent, render, screen } from '@testing-library/react';
import { ReviewQueue } from './ReviewQueue';

describe('ReviewQueue', () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.localStorage.setItem(
      'corkage-mvp-report-drafts',
      JSON.stringify([
        {
          reportId: 'draft-test-001',
          storeName: '테스트 식당',
          reportType: 'status',
          reportedStatus: 'available',
          reportedFee: 12000,
          memo: '병당 12,000원 제보',
          submittedAt: '2026-05-18',
          reviewState: 'pending',
        },
      ]),
    );
  });

  it('updates a draft report review state and shows accepted preview', () => {
    render(<ReviewQueue />);

    fireEvent.change(screen.getAllByLabelText('검수 상태')[0], {
      target: { value: 'accepted' },
    });

    expect(screen.getByText('canonical 반영 preview')).toBeInTheDocument();
    expect(screen.getAllByText('반영 가능').length).toBeGreaterThan(0);
  });
});
