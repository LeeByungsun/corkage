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
} from '../../lib/types/corkage';
import { ReviewStateBadge } from './ReviewStateBadge';

type DraftState = {
  storeName: string;
  memo: string;
};

export function ReportForm() {
  const [submitted, setSubmitted] = useState<DraftState | null>(null);
  const [localReports, setLocalReports] = useState<CorkageReport[]>([]);
  const [storeMatchType, setStoreMatchType] =
    useState<ReportStoreMatchType>('candidate');
  const [selectedPlaceId, setSelectedPlaceId] = useState('');
  const currentStores = useCanonicalStores();

  useEffect(() => {
    setLocalReports(readDraftReports());
  }, []);

  useEffect(() => {
    if (!currentStores.some((store) => store.placeId === selectedPlaceId)) {
      setSelectedPlaceId(currentStores[0]?.placeId ?? '');
    }
  }, [currentStores, selectedPlaceId]);

  const seededReports = useMemo(() => getReports(), []);
  const selectedStore = currentStores.find(
    (store) => store.placeId === selectedPlaceId,
  );
  const acceptedPreviews = seededReports
    .map((report) =>
      buildCanonicalPreviewFromAcceptedReport(report, currentStores),
    )
    .filter((preview): preview is NonNullable<typeof preview> => Boolean(preview));

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = new FormData(event.currentTarget);
    const nextStoreMatchType = parseStoreMatchType(
      String(form.get('storeMatchType') ?? 'candidate'),
    );
    const matchedStore =
      nextStoreMatchType === 'existing'
        ? currentStores.find(
            (store) => store.placeId === String(form.get('existingPlaceId') ?? ''),
          )
        : undefined;
    const nextState: DraftState = {
      storeName:
        matchedStore?.name ?? String(form.get('storeName') ?? '').trim(),
      memo: String(form.get('memo') ?? ''),
    };

    if (nextStoreMatchType === 'existing' && !matchedStore) {
      return;
    }

    const nextReport: CorkageReport = {
      reportId: `draft-${Date.now()}`,
      storeMatchType: nextStoreMatchType,
      placeId: matchedStore?.placeId,
      storeName: nextState.storeName,
      reportType: String(form.get('reportType') ?? 'new') as ReportType,
      reportedStatus: mapReportedStatus(String(form.get('reportedStatus') ?? 'unknown')),
      reportedFee: parseFeeValue(String(form.get('reportedFee') ?? '')),
      memo: nextState.memo,
      evidenceUrl: String(form.get('evidenceUrl') ?? '') || undefined,
      submittedAt: new Date().toISOString().slice(0, 10),
      reviewState: 'pending',
      reviewNote: '로컬 목업 저장소에 임시 저장됨',
    };

    setSubmitted(nextState);
    setLocalReports(saveDraftReport(nextReport));
    event.currentTarget.reset();
  }

  return (
    <div className="report-layout">
      <form className="report-form" onSubmit={handleSubmit}>
        <label>
          <span>제보 대상</span>
          <select
            name="storeMatchType"
            value={storeMatchType}
            onChange={(event) =>
              setStoreMatchType(parseStoreMatchType(event.target.value))
            }
          >
            <option value="candidate">신규 식당 후보</option>
            <option value="existing">기존 식당 수정 제보</option>
          </select>
        </label>

        {storeMatchType === 'existing' ? (
          <label>
            <span>기존 식당 선택</span>
            <select
              name="existingPlaceId"
              required
              value={selectedPlaceId}
              onChange={(event) => setSelectedPlaceId(event.target.value)}
            >
              {currentStores.map((store) => (
                <option key={store.placeId} value={store.placeId}>
                  {store.name} · {store.district}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        <label>
          <span>식당명</span>
          {storeMatchType === 'existing' ? (
            <input
              disabled
              name="storeName"
              placeholder="예: 빈테이블 청담"
              value={selectedStore?.name ?? ''}
              readOnly
            />
          ) : (
            <input name="storeName" required placeholder="예: 빈테이블 청담" />
          )}
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
                    <ReviewStateBadge reviewState={report.reviewState} />
                  </div>
                  <p>{report.memo}</p>
                  <small>
                    {report.storeMatchType === 'existing'
                      ? `기존 식당 매칭 · ${report.placeId}`
                      : '신규 식당 candidate'}{' '}
                    · {report.submittedAt} 저장
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
            미리 보여주는 뼈대입니다.
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

function parseStoreMatchType(value: string): ReportStoreMatchType {
  return value === 'existing' ? 'existing' : 'candidate';
}
