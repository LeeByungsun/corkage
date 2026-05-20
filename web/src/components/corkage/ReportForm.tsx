'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import {
  buildCanonicalPreviewFromAcceptedReport,
  getReports,
} from '../../lib/repo/corkage-repo';
import {
  readDraftReports,
  saveDraftReport,
} from '../../lib/repo/report-drafts';
import { useCanonicalStores } from '../../lib/repo/use-canonical-stores';
import type {
  CorkageReport,
  CorkageStatus,
  ReportStoreMatchType,
  ReportType,
  CorkageStore,
} from '../../lib/types/corkage';
import { ReviewStateBadge } from './ReviewStateBadge';

type DraftState = {
  storeName: string;
  memo: string;
  storeMatchType: 'existing' | 'candidate';
  matchBadge: string;
  matchSummary: string;
  matchNote: string;
};

type MatchUi = {
  badge: string;
  summary: string;
  note: string;
};

export function ReportForm() {
  const [selectedPlaceId, setSelectedPlaceId] = useState('');
  const [submitted, setSubmitted] = useState<DraftState | null>(null);
  const [localReports, setLocalReports] = useState<CorkageReport[]>([]);
  const currentStores = useCanonicalStores();

  useEffect(() => {
    setLocalReports(readDraftReports());
  }, []);

  useEffect(() => {
    if (
      selectedPlaceId &&
      !currentStores.some((store) => store.placeId === selectedPlaceId)
    ) {
      setSelectedPlaceId('');
    }
  }, [currentStores, selectedPlaceId]);

  const seededReports = useMemo(() => getReports(), []);
  const matchedStore = useMemo(
    () =>
      currentStores.find((store) => store.placeId === selectedPlaceId) ?? null,
    [currentStores, selectedPlaceId],
  );
  const currentMatchUi = useMemo(() => getFormMatchUi(matchedStore), [matchedStore]);
  const acceptedPreviews = useMemo(
    () =>
      seededReports
        .map((report) =>
          buildCanonicalPreviewFromAcceptedReport(report, currentStores),
        )
        .filter(
          (preview): preview is NonNullable<typeof preview> => Boolean(preview),
        ),
    [currentStores, seededReports],
  );

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = new FormData(event.currentTarget);
    const matchedPlaceId = String(form.get('placeId') ?? '').trim();
    const selectedStore =
      currentStores.find((store) => store.placeId === matchedPlaceId) ?? null;
    const typedStoreName = String(form.get('storeName') ?? '').trim();
    const reportType = String(form.get('reportType') ?? 'new') as ReportType;
    const nextStoreMatchType: ReportStoreMatchType = selectedStore
      ? 'existing'
      : 'candidate';
    const matchUi = getFormMatchUi(selectedStore);
    const nextState: DraftState = {
      storeName: selectedStore?.name ?? typedStoreName,
      memo: String(form.get('memo') ?? ''),
      storeMatchType: nextStoreMatchType,
      matchBadge: matchUi.badge,
      matchSummary: matchUi.summary,
      matchNote: matchUi.note,
    };

    if (nextStoreMatchType === 'existing' && !selectedStore) {
      return;
    }

    const nextReport: CorkageReport = {
      reportId: `draft-${Date.now()}`,
      storeMatchType: nextStoreMatchType,
      placeId: selectedStore?.placeId,
      storeName: nextState.storeName,
      reportType:
        nextStoreMatchType === 'existing' && reportType === 'new'
          ? 'status'
          : reportType,
      reportedStatus: mapReportedStatus(
        String(form.get('reportedStatus') ?? 'unknown'),
      ),
      reportedFee: parseFeeValue(String(form.get('reportedFee') ?? '')),
      memo: nextState.memo,
      evidenceUrl: String(form.get('evidenceUrl') ?? '') || undefined,
      submittedAt: new Date().toISOString().slice(0, 10),
      reviewState: 'pending',
      reviewNote:
        nextStoreMatchType === 'existing'
          ? '기존 식당 placeId 매칭 초안이 로컬 목업 저장소에 저장됨'
          : '신규 candidate 제보가 로컬 목업 저장소에 저장됨',
    };

    setSubmitted(nextState);
    setLocalReports(saveDraftReport(nextReport));
    event.currentTarget.reset();
    setSelectedPlaceId('');
  }

  return (
    <div className="report-layout">
      <form className="report-form" onSubmit={handleSubmit}>
        <label>
          <span>기존 식당 연결</span>
          <select
            name="placeId"
            value={selectedPlaceId}
            onChange={(event) => setSelectedPlaceId(event.target.value)}
          >
            <option value="">신규 식당 candidate로 저장</option>
            {currentStores.map((store) => (
              <option key={store.placeId} value={store.placeId}>
                {store.name} · {store.district}
              </option>
            ))}
          </select>
        </label>

        <p className="muted">
          {matchedStore
            ? '기존 식당 제보는 placeId가 연결된 상태라 accepted 시 canonical override 후보가 됩니다.'
            : '선택하지 않으면 신규 식당 candidate로 저장되고 canonical 반영 대상이 되지 않습니다.'}
        </p>
        <p className="eyebrow">{currentMatchUi.badge}</p>
        <p className="muted">{currentMatchUi.summary}</p>
        <p className="muted">{currentMatchUi.note}</p>

        <label>
          <span>식당명</span>
          <input
            name="storeName"
            required={!selectedPlaceId}
            placeholder="예: 빈테이블 청담"
          />
        </label>

        <label>
          <span>제보 유형</span>
          <select name="reportType" defaultValue="new">
            <option value="new">신규 식당</option>
            <option value="status">콜키지 가능 여부 수정</option>
            <option value="fee">비용/조건 수정</option>
            <option value="stale">오래된 정보 신고</option>
          </select>
        </label>

        <label>
          <span>제보 상태</span>
          <select name="reportedStatus" defaultValue="unknown">
            <option value="available">가능</option>
            <option value="unavailable">불가</option>
            <option value="unknown">확인중</option>
          </select>
        </label>

        <label>
          <span>제보 비용(선택)</span>
          <input
            inputMode="numeric"
            name="reportedFee"
            placeholder="예: 20000"
          />
        </label>

        <label>
          <span>메모</span>
          <textarea
            name="memo"
            rows={5}
            placeholder="확인한 날짜, 비용, 병 수 제한, 참고 링크 등을 남겨주세요."
          />
        </label>

        <label>
          <span>참고 링크</span>
          <input
            name="evidenceUrl"
            inputMode="url"
            placeholder="https://example.com"
          />
        </label>

        <button className="primary-button" type="submit">
          제보 초안 저장
        </button>
      </form>

      <aside className="info-panel">
        <h2>현재 단계 안내</h2>
        <ul>
          <li>제보는 아직 서버에 저장되지 않습니다.</li>
          <li>운영 검수 전에는 canonical 데이터가 바뀌지 않습니다.</li>
          <li>비용과 조건은 매장 확인 후 보수적으로 공개합니다.</li>
        </ul>

        {submitted ? (
          <div className="submission-card" role="status">
            <h3>임시 저장 완료</h3>
            <p>{submitted.storeName} 제보 초안을 브라우저에서 확인했습니다.</p>
            <p className="eyebrow">{submitted.matchBadge}</p>
            <p>{submitted.matchSummary}</p>
            <p className="muted">{submitted.matchNote}</p>
            <p className="muted">
              {submitted.storeMatchType === 'existing'
                ? '기존 식당 연결 · canonical 반영 가능'
                : '신규 candidate · canonical 반영 불가'}
            </p>
            <p>현재는 로컬 목업 저장소에 `pending` 상태로 저장됩니다.</p>
            <pre>{submitted.memo || '메모 없음'}</pre>
          </div>
        ) : null}
      </aside>

      <section className="review-panel">
        <div className="review-panel__section">
          <h2>로컬 제보 저장 상태</h2>
          <p className="muted">이 제보들은 브라우저 로컬 저장소에만 유지됩니다.</p>
          {localReports.length === 0 ? (
            <p className="muted">아직 저장된 제보가 없습니다.</p>
          ) : (
            <ul className="report-list">
              {localReports.map((report) => (
                <li key={report.reportId} className="report-list__item">
                  <div className="report-list__header">
                    <strong>{report.storeName}</strong>
                    <span className="match-badge">
                      {report.storeMatchType === 'existing'
                        ? '기존 식당 연결'
                        : '신규 candidate'}
                    </span>
                    <ReviewStateBadge reviewState={report.reviewState} />
                  </div>
                  <p>{report.memo}</p>
                  <p className="muted">
                    {report.storeMatchType === 'existing'
                      ? `placeId ${report.placeId} 연결됨 · canonical 반영 가능`
                      : 'placeId 미연결 · canonical 반영 불가'}
                  </p>
                  <small>
                    {report.submittedAt} 저장 ·{' '}
                    {report.storeMatchType === 'existing'
                      ? `기존 식당 연결 ${report.placeId}`
                      : '신규 식당 candidate'}
                  </small>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="review-panel__section">
          <h2>accepted 제보 canonical 반영 예시</h2>
          <p className="muted">
            운영자 검수에서 accepted 되면 canonical 정보에 어떤 필드가 반영될지
            미리 보여주는 뼈대입니다. candidate 제보는 placeId가 없어서 이
            preview에 포함되지 않습니다.
          </p>
          <ul className="report-list">
            {acceptedPreviews.map((preview) => (
              <li key={preview.placeId} className="report-list__item">
                <div className="report-list__header">
                  <strong>{preview.storeName}</strong>
                  <ReviewStateBadge reviewState="accepted" />
                </div>
                <ul className="change-list">
                  {preview.changes.map((change) => (
                    <li key={`${preview.placeId}-${change.field}`}>
                      <span>{change.field}</span>
                      <code>{change.before}</code>
                      <span>→</span>
                      <code>{change.after}</code>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}

function parseFeeValue(value: string): number | undefined {
  const normalized = value.trim();

  if (!normalized) {
    return undefined;
  }

  const parsed = Number(normalized);

  return Number.isFinite(parsed) ? parsed : undefined;
}

function mapReportedStatus(value: string): CorkageStatus {
  if (value === 'available' || value === 'unavailable' || value === 'unknown') {
    return value;
  }

  return 'unknown';
}

function getFormMatchUi(store: CorkageStore | null): MatchUi {
  if (store) {
    return {
      badge: 'placeId 매칭 완료',
      summary: `기존 식당 existing · ${store.name} · ${store.placeId}`,
      note: `accepted 되면 ${store.placeId} canonical override 검토 대상으로 연결됩니다.`,
    };
  }

  return {
    badge: 'canonical 반영 불가',
    summary: '신규 식당 candidate',
    note: 'placeId 미연결 · accepted 되어도 canonical 반영 불가',
  };
}
