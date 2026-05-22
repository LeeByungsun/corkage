import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, vi } from 'vitest';
import { ReportForm } from './ReportForm';
import type { ServerMvpState } from '../../lib/types/corkage';

describe('ReportForm', () => {
  let serverState: ServerMvpState;
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    serverState = {
      draftReports: [],
      canonicalOverrides: [],
      reviewLogs: [],
    };
    fetchMock = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      const method = init?.method ?? 'GET';

      if (method === 'GET') {
        return createJsonResponse(serverState);
      }

      if (method === 'POST') {
        const body = JSON.parse(String(init?.body ?? '{}'));
        serverState = {
          ...serverState,
          draftReports: [body.report, ...serverState.draftReports],
        };

        return createJsonResponse(serverState, 201);
      }

      throw new Error(`Unsupported method: ${method}`);
    });
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('stores matched existing restaurant reports with an explicit placeId', async () => {
    render(<ReportForm />);

    fireEvent.change(screen.getByLabelText('기존 식당 연결'), {
      target: { value: 'seasonal-noodle-lab' },
    });
    fireEvent.change(screen.getByLabelText('메모'), {
      target: { value: '와인 1병 반입 가능 확인' },
    });

    fireEvent.click(screen.getByRole('button', { name: '제보 초안 저장' }));

    await waitFor(() =>
      expect(serverState.draftReports[0]).toMatchObject({
        storeMatchType: 'existing',
        placeId: 'seasonal-noodle-lab',
        reportType: 'status',
        reviewState: 'pending',
        storeName: '시즈널 누들랩',
      }),
    );

    const status = await screen.findByRole('status');

    expect(status).toHaveTextContent('임시 저장 완료');
    expect(status).toHaveTextContent(
      '시즈널 누들랩 제보 초안을 서버 목업 저장소에 저장했습니다.',
    );
    expect(status).toHaveTextContent('placeId 매칭 완료');
    expect(status).toHaveTextContent(
      '기존 식당 existing · 시즈널 누들랩 · seasonal-noodle-lab',
    );
    expect(status).toHaveTextContent(
      'accepted 되면 seasonal-noodle-lab canonical override 검토 대상으로 연결됩니다.',
    );
    expect(status).toHaveTextContent('와인 1병 반입 가능 확인');
    expect(screen.getAllByText('기존 식당 연결').length).toBeGreaterThan(0);
    expect(
      screen.getByText(/placeId seasonal-noodle-lab 연결됨 · canonical 반영 가능/),
    ).toBeInTheDocument();
    expect(screen.getByText('검수 대기')).toBeInTheDocument();
  });

  it('keeps new restaurant reports as candidates without a placeId', async () => {
    render(<ReportForm />);

    fireEvent.change(screen.getByLabelText('기존 식당 연결'), {
      target: { value: '' },
    });
    fireEvent.change(screen.getByLabelText('식당명'), {
      target: { value: '새 식당' },
    });
    fireEvent.change(screen.getByLabelText('메모'), {
      target: { value: '콜키지 비용 2만원 확인' },
    });

    fireEvent.click(screen.getByRole('button', { name: '제보 초안 저장' }));

    await waitFor(() =>
      expect(serverState.draftReports[0]).toMatchObject({
        storeMatchType: 'candidate',
        reportType: 'new',
        reviewState: 'pending',
        storeName: '새 식당',
      }),
    );

    expect(serverState.draftReports[0]?.placeId).toBeUndefined();
    expect(screen.getAllByText('신규 식당 candidate').length).toBeGreaterThan(0);
    expect(
      screen.getByText('placeId 미연결 · canonical 반영 불가'),
    ).toBeInTheDocument();
  });
});

function createJsonResponse(data: ServerMvpState, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}
