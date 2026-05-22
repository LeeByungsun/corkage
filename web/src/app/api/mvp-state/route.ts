import { NextResponse } from 'next/server';
import {
  createServerDraftReport,
  readServerMvpState,
  updateServerDraftReportReview,
} from '../../../lib/server/mvp-state-store';
import type {
  CorkageReport,
  DraftReportReviewUpdate,
} from '../../../lib/types/corkage';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const state = await readServerMvpState();
  return NextResponse.json(state);
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      report?: CorkageReport;
    };

    if (!body.report) {
      return NextResponse.json(
        { error: 'report is required' },
        { status: 400 },
      );
    }

    const state = await createServerDraftReport(body.report);

    return NextResponse.json(state, {
      status: 201,
    });
  } catch (error) {
    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = (await request.json()) as
      | ({ reportId?: string } & DraftReportReviewUpdate)
      | undefined;

    if (!body?.reportId) {
      return NextResponse.json(
        { error: 'reportId is required' },
        { status: 400 },
      );
    }

    const state = await updateServerDraftReportReview(body.reportId, {
      reviewState: body.reviewState,
      reviewNote: body.reviewNote,
      reviewedAt: body.reviewedAt,
    });

    return NextResponse.json(state);
  } catch (error) {
    const message = getErrorMessage(error);
    const status = message.includes('not found') ? 404 : 500;

    return NextResponse.json({ error: message }, { status });
  }
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return 'Unknown server state error';
}
