'use client';

import { normalizeReport } from './corkage-repo';
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
    return Array.isArray(parsed) ? parsed.map(normalizeReport) : [];
  } catch {
    window.localStorage.removeItem(REPORT_DRAFTS_STORAGE_KEY);
    return [];
  }
}

export function saveDraftReport(report: CorkageReport): CorkageReport[] {
  const nextReports = [normalizeReport(report), ...readDraftReports()];
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
      ? buildUpdatedDraftReport(report, update)
      : report,
  );

  persistDraftReports(nextReports);
  return nextReports;
}

function buildUpdatedDraftReport(
  report: CorkageReport,
  update: {
    reviewState: ReviewState;
    reviewNote?: string;
    reviewedAt?: string;
    appliedAt?: string;
  },
): CorkageReport {
  const nextReport: CorkageReport = {
    ...report,
    reviewState: update.reviewState,
  };

  if ('reviewNote' in update) {
    nextReport.reviewNote = update.reviewNote;
  }

  if ('reviewedAt' in update) {
    nextReport.reviewedAt = update.reviewedAt;
  }

  if ('appliedAt' in update) {
    nextReport.appliedAt = update.appliedAt;
  }

  return nextReport;
}

function persistDraftReports(reports: CorkageReport[]) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(REPORT_DRAFTS_STORAGE_KEY, JSON.stringify(reports));
}
