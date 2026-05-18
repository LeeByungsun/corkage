'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  buildCanonicalPreviewFromAcceptedReport,
  getReports,
} from '../../lib/repo/corkage-repo';
import {
  readDraftReports,
  updateDraftReportReview,
} from '../../lib/repo/report-drafts';
import type { CorkageReport, ReviewState } from '../../lib/types/corkage';
import { ReviewStateBadge } from './ReviewStateBadge';

const REVIEW_STATE_OPTIONS: Array<{ value: ReviewState; label: string }> = [
  { value: 'pending', label: '검수 대기' },
  { value: 'accepted', label: '반영 가능' },
  { value: 'rejected', label: '반려' },
  { value: 'needs_follow_up', label: '추가 확인 필요' },
];

export function ReviewQueue() {
  const [draftReports, setDraftReports] = useState<CorkageReport[]>([]);

  useEffect(() => {
    setDraftReports(readDraftReports());
  }, []);

  const seededReports = useMemo(() => getReports(), []);
  const reports = [...draftReports, ...seededReports];

  function handleReviewChange(report: CorkageReport, reviewState: ReviewState) {
    if (!isDraftReport(report.reportId)) {
      return;
    }

    setDraftReports(
      updateDraftReportReview(report.reportId, {
        reviewState,
        reviewedAt: new Date().toISOString().slice(0, 10),
      }),
    );
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
  }

  function handleApplyCanonical(report: CorkageReport) {
    if (!isDraftReport(report.reportId)) {
      return;
    }

    setDraftReports(
      updateDraftReportReview(report.reportId, {
        reviewState: 'accepted',
        reviewedAt: report.reviewedAt ?? new Date().toISOString().slice(0, 10),
        appliedAt: new Date().toISOString().slice(0, 10),
      }),
    );
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
              ? buildCanonicalPreviewFromAcceptedReport(report)
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
                제출일 {report.submittedAt}
                {report.reviewedAt ? ` · 검수일 ${report.reviewedAt}` : ''}
                {report.appliedAt ? ` · canonical 반영 ${report.appliedAt}` : ''}
              </small>

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

                <button
                  className="primary-button"
                  disabled={!draft}
                  type="button"
                  onClick={() => handleApplyCanonical(report)}
                >
                  accepted canonical 반영 실행
                </button>
              </div>

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
