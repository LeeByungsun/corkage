import type { CorkageReport } from '../types/corkage';

export const reportSeed: CorkageReport[] = [
  {
    reportId: 'report-accepted-001',
    storeMatchType: 'existing',
    placeId: 'seasonal-noodle-lab',
    storeName: '시즈널 누들랩',
    reportType: 'status',
    reportedStatus: 'available',
    reportedFee: 15000,
    memo: '매장 재확인 결과 와인 1병 반입 가능. 병당 15,000원 안내.',
    evidenceUrl: 'https://example.com/reviewed-report',
    submittedAt: '2026-05-13',
    reviewState: 'accepted',
    reviewNote: '운영자 유선 확인 후 canonical 반영 가능',
    reviewedAt: '2026-05-14',
  },
  {
    reportId: 'report-followup-001',
    storeMatchType: 'existing',
    placeId: 'old-cellar-bistro',
    storeName: '올드셀러 비스트로',
    reportType: 'fee',
    reportedFee: 25000,
    memo: '최근 방문 시 25,000원/병으로 안내받았다는 제보.',
    submittedAt: '2026-05-15',
    reviewState: 'needs_follow_up',
    reviewNote: '매장 재확인 필요',
  },
];
