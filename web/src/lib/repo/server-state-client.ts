import type {
  CorkageReport,
  DraftReportReviewUpdate,
  ServerMvpState,
} from '../types/corkage';

const MVP_STATE_ENDPOINT = '/api/mvp-state';

export async function fetchServerMvpState(): Promise<ServerMvpState> {
  const response = await fetch(MVP_STATE_ENDPOINT, {
    cache: 'no-store',
  });

  return readServerMvpStateResponse(response);
}

export async function createServerDraftReport(
  report: CorkageReport,
): Promise<ServerMvpState> {
  const response = await fetch(MVP_STATE_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      report,
    }),
  });

  return readServerMvpStateResponse(response);
}

export async function patchServerDraftReportReview(
  reportId: string,
  update: DraftReportReviewUpdate,
): Promise<ServerMvpState> {
  const response = await fetch(MVP_STATE_ENDPOINT, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      reportId,
      ...update,
    }),
  });

  return readServerMvpStateResponse(response);
}

async function readServerMvpStateResponse(response: Response) {
  if (!response.ok) {
    throw new Error(`Server state request failed: ${response.status}`);
  }

  return (await response.json()) as ServerMvpState;
}
