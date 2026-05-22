import { ReportForm } from '../../components/corkage/ReportForm';

export default function ReportPage() {
  return (
    <section className="page-stack">
      <header className="section-header">
        <p className="eyebrow">제보는 이벤트 기록</p>
        <h1>신규 식당/정보 수정 제보</h1>
        <p>
          현재는 서버 목업 저장 단계입니다. 검수 전에는 canonical 데이터를
          바로 덮지 않습니다.
        </p>
      </header>

      <ReportForm />
    </section>
  );
}
