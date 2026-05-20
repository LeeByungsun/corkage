'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  applyAcceptedReportToCanonical,
  buildCanonicalPreviewFromAcceptedReport,
  isExistingStoreReport,
  getAllStores,
  getReports,
  mergeStores,
  transitionReportReviewState,
} from '../../lib/repo/corkage-repo';
import {
  readCanonicalOverrides,
  saveCanonicalOverride,
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

export function ReviewQueue() {
  const [draftReports, setDraftReports] = useState<CorkageReport[]>([]);
  const [canonicalOverrides, setCanonicalOverrides] = useState<CorkageStore[]>(
    [],
  );

  useEffect(() => {
    setDraftReports(readDraftReports());
    setCanonicalOverrides(readCanonicalOverrides());
  }, []);

  const seededReports = useMemo(() => getReports(), []);
  const reports = [...draftReports, ...seededReports];
  const currentStores = mergeStores(getAllStores(), canonicalOverrides);

  function handleReviewChange(report: CorkageReport, reviewState: ReviewState) {
    if (!isDraftReport(report.reportId)) {
      return;
    }

    const today = new Date().toISOString().slice(0, 10);
    const nextReport = transitionReportReviewState(report, reviewState, {
      reviewNote: report.reviewNote,
      reviewedAt:
        reviewState === 'pending' ? undefined : report.reviewedAt ?? today,
    });
    const nextStore =
      nextReport.reviewState === 'accepted'
        ? applyCanonicalOverride(nextReport)
        : null;

    setDraftReports(
      updateDraftReportReview(report.reportId, {
        reviewState: nextReport.reviewState,
        reviewNote: nextReport.reviewNote,
        reviewedAt: nextReport.reviewedAt,
        appliedAt: nextStore ? today : report.appliedAt,
      }),
    );

    if (nextStore) {
      setCanonicalOverrides(saveCanonicalOverride(nextStore));
    }
  }

  function handleReviewNoteChange(report: CorkageReport, reviewNote: string) {
    if (!isDraftReport(report.reportId)) {
      return;
    }

    setDraftReports(
      updateDraftReportReview(report.reportId, {
        reviewState: report.reviewState,
        reviewNote,
      }),
    );

    if (report.reviewState === 'accepted') {
      const nextStore = applyCanonicalOverride({
        ...report,
        reviewNote,
      });

      if (nextStore) {
        setCanonicalOverrides(saveCanonicalOverride(nextStore));
      }
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

  function applyCanonicalOverride(report: CorkageReport) {
    return buildCanonicalPreviewFromAcceptedReport(
      report,
      getComparableStores(report),
    )?.nextStore;
  }

  return (
    <section className="page-stack">
      <header className="section-header">
        <p className="eyebrow">내부 검수 큐</p>
        <h1>reviewed canonical 반영 흐름</h1>
        <p>
          MVP 단계에서는 로컬 목업 저장소에서만 reviewState 전환과 accepted
          canonical 반영 예시를 관리합니다.
        </p>
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

          return (
            <article key={report.reportId} className="review-card">
              <div className="report-list__header">
                <div>
                  <p className="eyebrow">{report.reportType}</p>
                  <h2>{report.storeName}</h2>
                </div>
                <ReviewStateBadge reviewState={report.reviewState} />
              </div>

              <p>{report.memo}</p>
              <small>
                {isExistingStoreReport(report)
                  ? `기존 식당 매칭 · ${report.placeId}`
                  : '신규 식당 candidate'}{' '}
                ·{' '}
                제출일 {report.submittedAt}
                {report.reviewedAt ? ` · 검수일 ${report.reviewedAt}` : ''}
                {report.appliedAt ? ` · canonical 반영 ${report.appliedAt}` : ''}
              </small>
              <p className="muted">
                {report.placeId
                  ? `기존 식당 연결: ${report.placeId}`
                  : '신규 식당 candidate 제보'}
              </p>

              <div className="review-controls">
                <label>
                  <span>검수 상태</span>
                  <select
                    disabled={!draft}
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
                    disabled={!draft}
                    rows={3}
                    value={report.reviewNote ?? ''}
                    onChange={(event) =>
                      handleReviewNoteChange(report, event.target.value)
                    }
                  />
                </label>

                <p className="muted">
                  {report.placeId
                    ? '기존 식당 제보는 accepted와 동시에 canonical override가 저장됩니다.'
                    : '신규 식당 제보는 candidate로 유지되고 canonical을 덮지 않습니다.'}
                </p>
              </div>

              {!isExistingStoreReport(report) ? (
                <p className="muted">
                  신규 식당 제보는 candidate로만 유지되며 accepted 되어도 기존
                  canonical을 덮어쓰지 않습니다.
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
