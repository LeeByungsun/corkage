'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  buildCanonicalPreviewFromAcceptedReport,
  isExistingStoreReport,
  getAllStores,
  getReports,
  mergeStores,
  transitionReportReviewState,
} from '../../lib/repo/corkage-repo';
import {
  readCanonicalOverrides,
} from '../../lib/repo/canonical-overrides';
import {
  readDraftReports,
  updateDraftReportReview,
} from '../../lib/repo/report-drafts';
import type {
  CorkageReport,
  CorkageStore,
  ReviewState,
} from '../../lib/types/corkage';
import { ReviewStateBadge } from './ReviewStateBadge';

const REVIEW_STATE_OPTIONS: Array<{ value: ReviewState; label: string }> = [
  { value: 'pending', label: '검수 대기' },
  { value: 'accepted', label: '반영 가능' },
  { value: 'rejected', label: '반려' },
  { value: 'needs_follow_up', label: '추가 확인 필요' },
];

type MatchUi = {
  badge: string;
  summary: string;
  note: string;
  reviewRule: string;
};

export function ReviewQueue() {
  const [draftReports, setDraftReports] = useState<CorkageReport[]>([]);
  const [canonicalOverrides, setCanonicalOverrides] = useState<CorkageStore[]>(
    [],
  );
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});
  const [busyReportId, setBusyReportId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let active = true;

    async function loadReviewState() {
      try {
        const [nextDraftReports, nextOverrides] = await Promise.all([
          readDraftReports(),
          readCanonicalOverrides(),
        ]);

        if (!active) {
          return;
        }

        setDraftReports(nextDraftReports);
        setCanonicalOverrides(nextOverrides);
        setReviewNotes(buildReviewNotes(nextDraftReports));
      } catch {
        if (active) {
          setErrorMessage('서버 목업 저장소에서 검수 큐를 불러오지 못했습니다.');
        }
      }
    }

    void loadReviewState();

    return () => {
      active = false;
    };
  }, []);

  const seededReports = useMemo(() => getReports(), []);
  const reports = [...draftReports, ...seededReports];
  const currentStores = mergeStores(getAllStores(), canonicalOverrides);

  async function handleReviewChange(
    report: CorkageReport,
    reviewState: ReviewState,
  ) {
    if (!isDraftReport(report.reportId)) {
      return;
    }

    setBusyReportId(report.reportId);
    setErrorMessage('');

    const nextReviewNote = reviewNotes[report.reportId] ?? report.reviewNote ?? '';
    const nextReport = transitionReportReviewState(report, reviewState, {
      reviewNote: nextReviewNote,
    });

    try {
      const nextDraftReports = await updateDraftReportReview(report.reportId, {
        reviewState: nextReport.reviewState,
        reviewNote: nextReviewNote,
      });
      const nextOverrides = await readCanonicalOverrides();

      setDraftReports(nextDraftReports);
      setCanonicalOverrides(nextOverrides);
      setReviewNotes(buildReviewNotes(nextDraftReports));
    } catch {
      setErrorMessage('검수 상태를 서버 목업 저장소에 반영하지 못했습니다.');
    } finally {
      setBusyReportId(null);
    }
  }

  function handleReviewNoteChange(reportId: string, reviewNote: string) {
    setReviewNotes((current) => ({
      ...current,
      [reportId]: reviewNote,
    }));
  }

  async function handleReviewNoteBlur(report: CorkageReport) {
    if (!isDraftReport(report.reportId)) {
      return;
    }

    setBusyReportId(report.reportId);
    setErrorMessage('');

    try {
      const nextReviewNote = reviewNotes[report.reportId] ?? '';
      const nextDraftReports = await updateDraftReportReview(report.reportId, {
        reviewNote: nextReviewNote,
      });
      const nextOverrides = await readCanonicalOverrides();

      setDraftReports(nextDraftReports);
      setCanonicalOverrides(nextOverrides);
      setReviewNotes(buildReviewNotes(nextDraftReports));
    } catch {
      setErrorMessage('review note를 서버 목업 저장소에 반영하지 못했습니다.');
    } finally {
      setBusyReportId(null);
    }
  }

  function getComparableStores(report: CorkageReport) {
    if (!report.placeId) {
      return currentStores;
    }

    return mergeStores(
      getAllStores(),
      canonicalOverrides.filter((store) => store.placeId !== report.placeId),
    );
  }

  return (
    <section className="page-stack">
      <header className="section-header">
        <p className="eyebrow">내부 검수 큐</p>
        <h1>reviewed canonical 반영 흐름</h1>
        <p>
          MVP 단계에서는 서버 목업 저장소에서 reviewState 전환과 accepted
          canonical 반영 예시를 관리합니다.
        </p>
        {errorMessage ? <p role="alert">{errorMessage}</p> : null}
      </header>

      <div className="review-grid">
        {reports.map((report) => {
          const preview =
            report.reviewState === 'accepted'
              ? buildCanonicalPreviewFromAcceptedReport(
                  report,
                  getComparableStores(report),
                )
              : null;
          const draft = isDraftReport(report.reportId);
          const matchUi = getReviewMatchUi(report);

          return (
            <article key={report.reportId} className="review-card">
              <div className="report-list__header">
                <div>
                  <p className="eyebrow">{report.reportType}</p>
                  <h2>{report.storeName}</h2>
                </div>
                <div className="review-card__badges">
                  <span className="match-badge">{matchUi.badge}</span>
                  <span className="match-badge">
                    {isExistingStoreReport(report)
                      ? '기존 식당 연결'
                      : '신규 candidate'}
                  </span>
                  <ReviewStateBadge reviewState={report.reviewState} />
                </div>
              </div>

              <p>{report.memo}</p>
              <small>
                {matchUi.summary} · 제출일 {report.submittedAt}
                {report.reviewedAt ? ` · 검수일 ${report.reviewedAt}` : ''}
                {report.appliedAt ? ` · canonical 반영 ${report.appliedAt}` : ''}
              </small>
              <p className="muted">
                {isExistingStoreReport(report)
                  ? `기존 식당 매칭 · ${report.placeId}`
                  : 'placeId 미연결 candidate 제보'}
              </p>
              <p className="muted">{matchUi.note}</p>

              <div className="review-controls">
                <label>
                  <span>검수 상태</span>
                  <select
                    disabled={!draft || busyReportId === report.reportId}
                    value={report.reviewState}
                    onChange={(event) =>
                      handleReviewChange(
                        report,
                        event.target.value as ReviewState,
                      )
                    }
                  >
                    {REVIEW_STATE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  <span>review note</span>
                  <textarea
                    disabled={!draft || busyReportId === report.reportId}
                    rows={3}
                    value={reviewNotes[report.reportId] ?? report.reviewNote ?? ''}
                    onChange={(event) =>
                      handleReviewNoteChange(report.reportId, event.target.value)
                    }
                    onBlur={() => {
                      void handleReviewNoteBlur(report);
                    }}
                  />
                </label>

                <p className="muted">
                  {isExistingStoreReport(report)
                    ? matchUi.reviewRule
                    : '신규 식당 제보는 candidate로 유지되고 canonical을 덮지 않습니다.'}
                </p>
              </div>

              {!isExistingStoreReport(report) ? (
                <p className="muted">
                  신규 식당 제보는 candidate로만 유지되며 accepted 되어도 기존 canonical을 덮어쓰지 않습니다.
                </p>
              ) : null}

              {preview ? (
                <div className="review-panel__section">
                  <h3>canonical 반영 preview</h3>
                  <ul className="change-list">
                    {preview.changes.map((change) => (
                      <li key={`${report.reportId}-${change.field}`}>
                        <span>{change.field}</span>
                        <code>{change.before}</code>
                        <span>→</span>
                        <code>{change.after}</code>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </article>
          );
        })}
      </div>
    </section>
  );
}

function isDraftReport(reportId: string) {
  return reportId.startsWith('draft-');
}

function buildReviewNotes(reports: CorkageReport[]) {
  return Object.fromEntries(
    reports.map((report) => [report.reportId, report.reviewNote ?? '']),
  );
}

function getReviewMatchUi(report: CorkageReport): MatchUi {
  if (isExistingStoreReport(report)) {
    return {
      badge: 'placeId 매칭 완료',
      summary: `기존 식당 existing · ${report.placeId}`,
      note: `placeId ${report.placeId}에 연결된 existing 제보입니다.`,
      reviewRule: `accepted 시 ${report.placeId} canonical override preview를 만들 수 있습니다.`,
    };
  }

  return {
    badge: 'canonical 반영 불가',
    summary: '신규 식당 candidate',
    note: '기존 placeId가 없어서 accepted 되어도 canonical preview를 만들 수 없습니다.',
    reviewRule: 'candidate 제보는 canonical override 저장 대상이 아닙니다.',
  };
}
