import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import {
  createServerDraftReport,
  readServerMvpState,
  updateServerDraftReportReview,
} from './mvp-state-store';

describe('mvp-state-store', () => {
  let stateDir: string;
  let stateFilePath: string;
  let previousStateFilePath: string | undefined;

  beforeEach(async () => {
    stateDir = await mkdtemp(path.join(tmpdir(), 'corkage-mvp-state-'));
    stateFilePath = path.join(stateDir, 'mvp-state.json');
    previousStateFilePath = process.env.CORKAGE_MVP_STATE_FILE;
    process.env.CORKAGE_MVP_STATE_FILE = stateFilePath;
  });

  afterEach(async () => {
    if (previousStateFilePath === undefined) {
      delete process.env.CORKAGE_MVP_STATE_FILE;
    } else {
      process.env.CORKAGE_MVP_STATE_FILE = previousStateFilePath;
    }

    await rm(stateDir, { force: true, recursive: true });
  });

  it('persists draft reports in the server state file', async () => {
    const nextState = await createServerDraftReport({
      reportId: 'draft-server-001',
      storeMatchType: 'candidate',
      storeName: '서버 저장 후보',
      reportType: 'new',
      reportedStatus: 'available',
      memo: '서버에 저장되는 신규 후보 제보',
      submittedAt: '2026-05-22',
      reviewState: 'pending',
    });

    expect(nextState.draftReports).toHaveLength(1);
    expect(nextState.draftReports[0]?.storeName).toBe('서버 저장 후보');
    expect(nextState.canonicalOverrides).toEqual([]);

    const persisted = JSON.parse(await readFile(stateFilePath, 'utf8'));

    expect(persisted.draftReports).toHaveLength(1);
    expect(persisted.reviewLogs).toEqual([]);
  });

  it('recomputes canonical overrides and review logs for accepted existing reports', async () => {
    await createServerDraftReport({
      reportId: 'draft-server-002',
      storeMatchType: 'existing',
      placeId: 'seasonal-noodle-lab',
      storeName: '시즈널 누들랩',
      reportType: 'status',
      reportedStatus: 'available',
      reportedFee: 18000,
      memo: '병당 18,000원으로 서버 반영 테스트',
      submittedAt: '2026-05-22',
      reviewState: 'pending',
    });

    const nextState = await updateServerDraftReportReview('draft-server-002', {
      reviewState: 'accepted',
      reviewNote: '운영자 서버 검수 완료',
      reviewedAt: '2026-05-22',
    });

    expect(nextState.draftReports[0]).toMatchObject({
      reportId: 'draft-server-002',
      reviewState: 'accepted',
      appliedAt: '2026-05-22',
      reviewedAt: '2026-05-22',
    });
    expect(nextState.canonicalOverrides[0]).toMatchObject({
      placeId: 'seasonal-noodle-lab',
      sourceType: 'user_report_reviewed',
      sourceNote: '운영자 서버 검수 완료',
      corkageFee: 18000,
    });
    expect(nextState.reviewLogs[0]).toMatchObject({
      reportId: 'draft-server-002',
      reviewState: 'accepted',
      placeId: 'seasonal-noodle-lab',
    });
  });

  it('removes canonical overrides when an accepted report leaves accepted state', async () => {
    await createServerDraftReport({
      reportId: 'draft-server-003',
      storeMatchType: 'existing',
      placeId: 'seasonal-noodle-lab',
      storeName: '시즈널 누들랩',
      reportType: 'status',
      reportedStatus: 'available',
      memo: 'accepted 해제 테스트',
      submittedAt: '2026-05-22',
      reviewState: 'pending',
    });

    await updateServerDraftReportReview('draft-server-003', {
      reviewState: 'accepted',
      reviewNote: '한 번 반영',
      reviewedAt: '2026-05-22',
    });

    const nextState = await updateServerDraftReportReview('draft-server-003', {
      reviewState: 'rejected',
      reviewNote: '반려로 되돌림',
      reviewedAt: '2026-05-23',
    });

    expect(nextState.draftReports[0]).toMatchObject({
      reportId: 'draft-server-003',
      reviewState: 'rejected',
      appliedAt: undefined,
    });
    expect(nextState.canonicalOverrides).toEqual([]);
    expect(nextState.reviewLogs.at(-1)).toMatchObject({
      reportId: 'draft-server-003',
      reviewState: 'rejected',
    });
  });

  it('keeps accepted candidate reports out of canonical overrides', async () => {
    await createServerDraftReport({
      reportId: 'draft-server-004',
      storeMatchType: 'candidate',
      storeName: '신규 후보 식당',
      reportType: 'new',
      reportedStatus: 'available',
      memo: 'candidate accepted 테스트',
      submittedAt: '2026-05-22',
      reviewState: 'pending',
    });

    const nextState = await updateServerDraftReportReview('draft-server-004', {
      reviewState: 'accepted',
      reviewNote: '후보는 후보로 유지',
      reviewedAt: '2026-05-22',
    });

    expect(nextState.draftReports[0]).toMatchObject({
      reportId: 'draft-server-004',
      reviewState: 'accepted',
      appliedAt: undefined,
    });
    expect(nextState.canonicalOverrides).toEqual([]);
  });

  it('bootstraps an empty state file on first read', async () => {
    const nextState = await readServerMvpState();

    expect(nextState).toEqual({
      draftReports: [],
      canonicalOverrides: [],
      reviewLogs: [],
    });
  });
});
