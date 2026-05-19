import { fireEvent, render, screen } from '@testing-library/react';
import { ReportForm } from './ReportForm';

describe('ReportForm', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('shows the client-side draft confirmation after submit', () => {
    render(<ReportForm />);

    fireEvent.change(screen.getByLabelText('식당명'), {
      target: { value: '새 식당' },
    });
    fireEvent.change(screen.getByLabelText('메모'), {
      target: { value: '콜키지 비용 2만원 확인' },
    });

    fireEvent.click(
      screen.getByRole('button', { name: '제보 초안 저장' }),
    );

    const status = screen.getByRole('status');

    expect(status).toHaveTextContent('임시 저장 완료');
    expect(status).toHaveTextContent('새 식당 제보 초안을 브라우저에서 확인했습니다.');
    expect(status).toHaveTextContent('콜키지 비용 2만원 확인');
    expect(screen.getByText('검수 대기')).toBeInTheDocument();
  });

  it('stores explicit placeId when submitting an existing-store report', () => {
    render(<ReportForm />);

    fireEvent.change(screen.getByLabelText('제보 대상'), {
      target: { value: 'existing' },
    });
    fireEvent.change(screen.getByLabelText('기존 식당 선택'), {
      target: { value: 'old-cellar-bistro' },
    });
    fireEvent.change(screen.getByLabelText('메모'), {
      target: { value: '기존 식당 비용 재확인' },
    });

    fireEvent.click(
      screen.getByRole('button', { name: '제보 초안 저장' }),
    );

    const raw = window.localStorage.getItem('corkage-mvp-report-drafts');

    expect(raw).not.toBeNull();
    expect(raw).toContain('"placeId":"old-cellar-bistro"');
    expect(raw).toContain('"storeMatchType":"existing"');
    expect(screen.getByText(/기존 식당 매칭 · old-cellar-bistro/)).toBeInTheDocument();
  });
});
