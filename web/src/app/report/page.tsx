export default function ReportPage() {
  return (
    <section>
      <h2>제보/수정 요청</h2>
      <p className="notice">
        제보는 내부 검수 후에만 공개 canonical 데이터가 반영됩니다. 즉시 공개 사실로 보지 마세요.
      </p>
      <form>
        <label>
          식당명 또는 후보 텍스트
          <input placeholder="예: 밤하늘 포차" />
        </label>
        <label>
          제보 상태
          <select>
            <option>가능</option>
            <option>불가</option>
            <option>확인중</option>
          </select>
        </label>
        <label>
          콜키지 요금(선택)
          <input placeholder="예: 2,000원/병" />
        </label>
        <label>
          증빙 메모
          <textarea rows={4} placeholder="확인 시간, 증빙 링크, 특이사항 등을 적어주세요" />
        </label>
        <button type="submit">제보 저장(개발 전용 UI만)</button>
      </form>
      <p className="muted">현재 MVP는 저장 동작 없이 입력 형식과 정책 메시지만 제공합니다.</p>
    </section>
  );
}
