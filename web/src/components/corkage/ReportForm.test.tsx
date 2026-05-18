import { fireEvent, render, screen } from '@testing-library/react';
import { ReportForm } from './ReportForm';

describe('ReportForm', () => {
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

    expect(screen.getByRole('status')).toHaveTextContent('임시 저장 완료');
    expect(screen.getByText('새 식당 제보 초안을 브라우저에서 확인했습니다.')).toBeInTheDocument();
    expect(screen.getByText('콜키지 비용 2만원 확인')).toBeInTheDocument();
  });
});
