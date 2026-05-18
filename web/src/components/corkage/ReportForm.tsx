'use client';

import { FormEvent, useState } from 'react';

type SubmissionState = {
  storeName: string;
  memo: string;
};

const INITIAL_STATE: SubmissionState = {
  storeName: '',
  memo: '',
};

export function ReportForm() {
  const [submitted, setSubmitted] = useState<SubmissionState | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = new FormData(event.currentTarget);
    const nextState = {
      storeName: String(form.get('storeName') ?? ''),
      memo: String(form.get('memo') ?? ''),
    };

    setSubmitted(nextState);
    event.currentTarget.reset();
  }

  return (
    <div className="report-layout">
      <form className="report-form" onSubmit={handleSubmit}>
        <label>
          <span>식당명</span>
          <input name="storeName" required placeholder="예: 빈테이블 청담" />
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
            <p>실제 저장 연동 전이므로 아래 메모를 복사해 보관해주세요.</p>
            <pre>{submitted.memo || '메모 없음'}</pre>
          </div>
        ) : null}
      </aside>
    </div>
  );
}
