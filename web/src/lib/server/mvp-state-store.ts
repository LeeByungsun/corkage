import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import {
  applyAcceptedReportToCanonical,
  isExistingStoreReport,
  mergeStores,
  normalizeReport,
  transitionReportReviewState,
} from '../repo/corkage-repo';
import type {
  CorkageReport,
  CorkageStore,
  DraftReportReviewUpdate,
  ReviewLogEntry,
  ServerMvpState,
} from '../types/corkage';
import { readStoresFromDatabase } from './store-database';

const DEFAULT_SERVER_MVP_STATE: ServerMvpState = {
  draftReports: [],
  canonicalOverrides: [],
  reviewLogs: [],
};

export async function readServerMvpState(): Promise<ServerMvpState> {
  const filePath = getServerMvpStateFilePath();

  try {
    const raw = await readFile(filePath, 'utf8');
    return normalizeServerMvpState(JSON.parse(raw));
  } catch (error) {
    if (isMissingFileError(error)) {
      return writeServerMvpState(DEFAULT_SERVER_MVP_STATE);
    }

    throw error;
  }
}

export async function createServerDraftReport(
  report: CorkageReport,
): Promise<ServerMvpState> {
  const currentState = await readServerMvpState();
  const nextReports = [normalizeReport(report), ...currentState.draftReports];

  return writeDerivedServerMvpState(nextReports, currentState.reviewLogs);
}

export async function updateServerDraftReportReview(
  reportId: string,
  update: DraftReportReviewUpdate,
): Promise<ServerMvpState> {
  const currentState = await readServerMvpState();
  let updatedReport: CorkageReport | null = null;

  const nextReports = currentState.draftReports.map((report) => {
    if (report.reportId !== reportId) {
      return report;
    }

    updatedReport = buildUpdatedDraftReport(report, update);
    return updatedReport;
  });

  if (!updatedReport) {
    throw new Error(`Draft report not found: ${reportId}`);
  }

  const nextReviewLogs = [
    ...currentState.reviewLogs,
    buildReviewLogEntry(updatedReport),
  ];

  return writeDerivedServerMvpState(nextReports, nextReviewLogs);
}

function buildUpdatedDraftReport(
  report: CorkageReport,
  update: DraftReportReviewUpdate,
): CorkageReport {
  const normalizedReport = normalizeReport(report);
  const nextReviewNote = normalizeOptionalText(update.reviewNote);

  if (update.reviewState !== undefined) {
    return transitionReportReviewState(normalizedReport, update.reviewState, {
      reviewNote: nextReviewNote ?? normalizedReport.reviewNote,
      reviewedAt:
        update.reviewState === 'pending'
          ? undefined
          : update.reviewedAt ??
            normalizedReport.reviewedAt ??
            getTodayIsoDate(),
    });
  }

  return {
    ...normalizedReport,
    reviewNote: nextReviewNote,
  };
}

function buildReviewLogEntry(report: CorkageReport): ReviewLogEntry {
  return {
    logId: `review-log-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    reportId: report.reportId,
    reviewState: report.reviewState,
    reviewNote: report.reviewNote,
    reviewedAt: report.reviewedAt,
    appliedAt: report.appliedAt,
    createdAt: new Date().toISOString(),
    storeMatchType: report.storeMatchType,
    placeId: report.placeId,
    storeName: report.storeName,
  };
}

async function writeDerivedServerMvpState(
  draftReports: CorkageReport[],
  reviewLogs: ReviewLogEntry[],
): Promise<ServerMvpState> {
  const normalizedReports = draftReports.map((report) => normalizeReport(report));
  const { appliedReportIds, canonicalOverrides } =
    deriveCanonicalOverridesFromReports(normalizedReports);
  const nextReports = normalizedReports.map((report) =>
    appliedReportIds.has(report.reportId)
      ? {
          ...report,
          appliedAt: report.reviewedAt ?? report.appliedAt ?? getTodayIsoDate(),
        }
      : {
          ...report,
          appliedAt: undefined,
        },
  );

  return writeServerMvpState({
    draftReports: nextReports,
    canonicalOverrides,
    reviewLogs,
  });
}

function deriveCanonicalOverridesFromReports(draftReports: CorkageReport[]) {
  let canonicalOverrides: CorkageStore[] = [];
  const appliedReportIds = new Set<string>();
  const databaseStores = readStoresFromDatabase();

  for (const report of [...draftReports].reverse()) {
    if (report.reviewState !== 'accepted' || !isExistingStoreReport(report)) {
      continue;
    }

    const comparableStores = mergeStores(
      databaseStores,
      canonicalOverrides.filter((store) => store.placeId !== report.placeId),
    );
    const nextStore = applyAcceptedReportToCanonical(report, comparableStores);

    if (!nextStore) {
      continue;
    }

    canonicalOverrides = upsertCanonicalOverride(canonicalOverrides, nextStore);
    appliedReportIds.add(report.reportId);
  }

  return {
    appliedReportIds,
    canonicalOverrides,
  };
}

function upsertCanonicalOverride(
  overrides: CorkageStore[],
  store: CorkageStore,
): CorkageStore[] {
  const filtered = overrides.filter((item) => item.placeId !== store.placeId);

  return [store, ...filtered];
}

async function writeServerMvpState(
  state: ServerMvpState,
): Promise<ServerMvpState> {
  const filePath = getServerMvpStateFilePath();
  const normalizedState = normalizeServerMvpState(state);

  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(
    filePath,
    `${JSON.stringify(normalizedState, null, 2)}\n`,
    'utf8',
  );

  return normalizedState;
}

function normalizeServerMvpState(state: unknown): ServerMvpState {
  const rawState =
    state && typeof state === 'object'
      ? (state as Partial<ServerMvpState>)
      : DEFAULT_SERVER_MVP_STATE;

  return {
    draftReports: Array.isArray(rawState.draftReports)
      ? rawState.draftReports.map((report) => normalizeReport(report))
      : [],
    canonicalOverrides: Array.isArray(rawState.canonicalOverrides)
      ? rawState.canonicalOverrides
      : [],
    reviewLogs: Array.isArray(rawState.reviewLogs) ? rawState.reviewLogs : [],
  };
}

function getServerMvpStateFilePath() {
  return (
    process.env.CORKAGE_MVP_STATE_FILE ??
    path.join(process.cwd(), 'data', 'mvp-state.json')
  );
}

function normalizeOptionalText(value?: string) {
  const normalized = value?.trim();

  return normalized ? normalized : undefined;
}

function getTodayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

function isMissingFileError(error: unknown) {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === 'ENOENT'
  );
}
