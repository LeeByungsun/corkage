import {
  createServerDraftReport,
  fetchServerMvpState,
  patchServerDraftReportReview,
} from './server-state-client';
import type {
  CorkageReport,
  DraftReportReviewUpdate,
} from '../types/corkage';

export async function readDraftReports(): Promise<CorkageReport[]> {
  const state = await fetchServerMvpState();
  return state.draftReports;
}

export async function saveDraftReport(
  report: CorkageReport,
): Promise<CorkageReport[]> {
  const state = await createServerDraftReport(report);
  return state.draftReports;
}

export async function updateDraftReportReview(
  reportId: string,
  update: DraftReportReviewUpdate,
): Promise<CorkageReport[]> {
  const state = await patchServerDraftReportReview(reportId, update);
  return state.draftReports;
}
