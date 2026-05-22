import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, vi } from 'vitest';
import { ReviewQueue } from './ReviewQueue';
import type { ServerMvpState } from '../../lib/types/corkage';

describe('ReviewQueue', () => {
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

      if (method === 'PATCH') {
        const body = JSON.parse(String(init?.body ?? '{}'));
        const report = serverState.draftReports.find(
          (item) => item.reportId === body.reportId,
        );

        if (!report) {
          return createJsonResponse(serverState, 404);
        }

        const nextReport = {
          ...report,
          reviewState: body.reviewState ?? report.reviewState,
          reviewNote: body.reviewNote ?? report.reviewNote,
          reviewedAt:
            body.reviewState && body.reviewState !== 'pending'
              ? '2026-05-22'
              : undefined,
          appliedAt:
            report.placeId && body.reviewState === 'accepted'
              ? '2026-05-22'
              : undefined,
        };

        serverState = {
          ...serverState,
          draftReports: serverState.draftReports.map((item) =>
            item.reportId === body.reportId ? nextReport : item,
          ),
          canonicalOverrides:
            nextReport.placeId && nextReport.reviewState === 'accepted'
              ? [
                  {
                    placeId: nextReport.placeId,
                    name: nextReport.storeName,
                    address: '서울시 강남구 압구정로 10',
                    roadAddress: '서울시 강남구 압구정로 10',
                    lat: 37.527,
                    lng: 127.028,
                    category: '다이닝',
                    district: '강남',
                    corkageStatus: 'available',
                    freshnessState: 'fresh',
                    confidenceLabel: 'medium',
                    verifiedAt: '2026-05-22',
                    sourceType: 'user_report_reviewed',
                    sourceNote: nextReport.reviewNote ?? '',
                    conditionNote: nextReport.memo,
                    corkageFee: nextReport.reportedFee,
                    feeUnit: 'per_bottle',
                  },
                ]
              : [],
          reviewLogs: [
            {
              logId: `log-${nextReport.reportId}`,
              reportId: nextReport.reportId,
              reviewState: nextReport.reviewState,
              reviewNote: nextReport.reviewNote,
              reviewedAt: nextReport.reviewedAt,
              appliedAt: nextReport.appliedAt,
              createdAt: '2026-05-22T00:00:00.000Z',
              storeMatchType: nextReport.storeMatchType,
              placeId: nextReport.placeId,
              storeName: nextReport.storeName,
            },
          ],
        };

        return createJsonResponse(serverState);
      }

      throw new Error(`Unsupported method: ${method}`);
    });
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('auto-applies canonical overrides when a matched report is accepted', async () => {
    serverState.draftReports = [
      {
        reportId: 'draft-test-001',
        storeMatchType: 'existing',
        placeId: 'seasonal-noodle-lab',
        storeName: '테스트 식당',
        reportType: 'status',
        reportedStatus: 'available',
        reportedFee: 12000,
        memo: '병당 12,000원 제보',
        submittedAt: '2026-05-18',
        reviewState: 'pending',
      },
    ];

    render(<ReviewQueue />);

    const draftCard = await findDraftCard('테스트 식당');

    fireEvent.change(within(draftCard).getByLabelText('검수 상태'), {
      target: { value: 'accepted' },
    });

    await waitFor(() =>
      expect(serverState.canonicalOverrides[0]).toMatchObject({
        placeId: 'seasonal-noodle-lab',
        sourceType: 'user_report_reviewed',
      }),
    );

    expect(within(draftCard).getByText('placeId 매칭 완료')).toBeInTheDocument();
    expect(
      within(draftCard).getByText(/기존 식당 existing · seasonal-noodle-lab/),
    ).toBeInTheDocument();
    expect(
      within(draftCard).getByText(
        'accepted 시 seasonal-noodle-lab canonical override preview를 만들 수 있습니다.',
      ),
    ).toBeInTheDocument();
    expect(
      within(draftCard).getByText('canonical 반영 preview'),
    ).toBeInTheDocument();
    expect(within(draftCard).getAllByText('반영 가능').length).toBeGreaterThan(0);
    expect(
      within(draftCard).getByText((content) =>
        content.includes('기존 식당 매칭 · seasonal-noodle-lab'),
      ),
    ).toBeInTheDocument();
  });

  it('keeps accepted new restaurant reports as candidates without canonical overrides', async () => {
    serverState.draftReports = [
      {
        reportId: 'draft-test-002',
        storeMatchType: 'candidate',
        storeName: '새 식당 후보',
        reportType: 'new',
        reportedStatus: 'available',
        memo: '신규 후보 제보',
        submittedAt: '2026-05-18',
        reviewState: 'pending',
      },
    ];

    render(<ReviewQueue />);

    const draftCard = await findDraftCard('새 식당 후보');

    fireEvent.change(within(draftCard).getByLabelText('검수 상태'), {
      target: { value: 'accepted' },
    });

    await waitFor(() => expect(serverState.canonicalOverrides).toEqual([]));
    expect(
      within(draftCard).getByText('신규 candidate'),
    ).toBeInTheDocument();
    expect(
      within(draftCard).getAllByText(/신규 식당 candidate/).length,
    ).toBeGreaterThan(0);
    expect(
      within(draftCard).getByText(
        '기존 placeId가 없어서 accepted 되어도 canonical preview를 만들 수 없습니다.',
      ),
    ).toBeInTheDocument();
    expect(
      within(draftCard).queryByText('canonical 반영 preview'),
    ).not.toBeInTheDocument();
    expect(
      within(draftCard).getByText(
        '신규 식당 제보는 candidate로 유지되고 canonical을 덮지 않습니다.',
      ),
    ).toBeInTheDocument();
    expect(
      within(draftCard).getByText(
        '신규 식당 제보는 candidate로만 유지되며 accepted 되어도 기존 canonical을 덮어쓰지 않습니다.',
      ),
    ).toBeInTheDocument();
  });
});

async function findDraftCard(name: string): Promise<HTMLElement> {
  const heading = await screen.findByRole('heading', { name });
  const card = heading.closest('.review-card');

  if (!card) {
    throw new Error('draft review card not found');
  }

  return card as HTMLElement;
}

function createJsonResponse(data: ServerMvpState, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}
