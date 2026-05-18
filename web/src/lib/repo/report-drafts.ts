'use client';

import type { CorkageReport, ReviewState } from '../types/corkage';

export const REPORT_DRAFTS_STORAGE_KEY = 'corkage-mvp-report-drafts';

export function readDraftReports(): CorkageReport[] {
  if (typeof window === 'undefined') {
    return [];
  }

  const raw = window.localStorage.getItem(REPORT_DRAFTS_STORAGE_KEY);

  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as CorkageReport[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    window.localStorage.removeItem(REPORT_DRAFTS_STORAGE_KEY);
    return [];
  }
}

export function saveDraftReport(report: CorkageReport): CorkageReport[] {
  const nextReports = [report, ...readDraftReports()];
  persistDraftReports(nextReports);
  return nextReports;
}

export function updateDraftReportReview(
  reportId: string,
  update: {
    reviewState: ReviewState;
    reviewNote?: string;
    reviewedAt?: string;
    appliedAt?: string;
  },
): CorkageReport[] {
  const nextReports = readDraftReports().map((report) =>
    report.reportId === reportId
      ? {
          ...report,
          reviewState: update.reviewState,
          reviewNote: update.reviewNote ?? report.reviewNote,
          reviewedAt: update.reviewedAt ?? report.reviewedAt,
          appliedAt: update.appliedAt ?? report.appliedAt,
        }
      : report,
  );

  persistDraftReports(nextReports);
  return nextReports;
}

function persistDraftReports(reports: CorkageReport[]) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(REPORT_DRAFTS_STORAGE_KEY, JSON.stringify(reports));
}
