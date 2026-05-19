import { fireEvent, render, screen, within } from '@testing-library/react';
import { ReviewQueue } from './ReviewQueue';

describe('ReviewQueue', () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.localStorage.setItem(
      'corkage-mvp-report-drafts',
      JSON.stringify([
        {
          reportId: 'draft-test-001',
          placeId: 'seasonal-noodle-lab',
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

    const draftCard = getDraftCard();

    fireEvent.change(within(draftCard).getByLabelText('검수 상태'), {
      target: { value: 'accepted' },
    });

    expect(
      within(draftCard).getByText('canonical 반영 preview'),
    ).toBeInTheDocument();
    expect(within(draftCard).getAllByText('반영 가능').length).toBeGreaterThan(0);
  });

  it('persists canonical override when accepted draft is applied', () => {
    render(<ReviewQueue />);

    const draftCard = getDraftCard();

    fireEvent.change(within(draftCard).getByLabelText('검수 상태'), {
      target: { value: 'accepted' },
    });

    fireEvent.click(
      within(draftCard).getByRole('button', {
        name: 'accepted canonical 반영 실행',
      }),
    );

    const raw = window.localStorage.getItem('corkage-mvp-canonical-overrides');

    expect(raw).not.toBeNull();
    expect(raw).toContain('seasonal-noodle-lab');
    expect(raw).toContain('user_report_reviewed');
  });
});

function getDraftCard(): HTMLElement {
  const card = screen
    .getByRole('heading', { name: '테스트 식당' })
    .closest('.review-card');

  if (!card) {
    throw new Error('draft review card not found');
  }

  return card as HTMLElement;
}
