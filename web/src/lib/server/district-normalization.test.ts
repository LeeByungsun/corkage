import {
  buildJusoSearchKeywords,
  buildNormalizedDistrictFromJuso,
  shouldNormalizeDistrict,
} from './district-normalization';

describe('district-normalization', () => {
  it('builds a district from official Juso API administrative fields', () => {
    expect(
      buildNormalizedDistrictFromJuso({
        siNm: '경기도',
        sggNm: '화성시 동탄구',
        emdNm: '청계동',
      }),
    ).toBe('경기도 화성시 동탄구 청계동');
  });

  it('targets coarse road-name districts and missing subdistricts while keeping already-normalized dongs stable', () => {
    expect(
      shouldNormalizeDistrict({
        address: '경기도 화성시 동탄구 동탄대로 446 1층 1103호',
        district: '경기도 화성시 동탄구',
        roadAddress: '경기도 화성시 동탄구 동탄대로 446 1층 1103호',
      }),
    ).toBe(true);

    expect(
      shouldNormalizeDistrict({
        address: '경기도 화성시 영천동 99',
        district: '경기도 화성시 영천동',
        roadAddress: '경기도 화성시 동탄구 동탄대로 700',
      }),
    ).toBe(true);

    expect(
      shouldNormalizeDistrict({
        address: '경기도 화성시 동탄구 청계동 536',
        district: '경기도 화성시 동탄구 청계동',
        roadAddress: '동탄대로시범길 134',
      }),
    ).toBe(false);
  });

  it('builds bounded Juso search keywords from noisy store road addresses', () => {
    expect(
      buildJusoSearchKeywords({
        address: '경기도 화성시 동탄구 동탄대로 446 1층 1103호, 1104호',
        roadAddress: '경기도 화성시 동탄구 동탄대로 446 1층 1103호, 1104호',
      }),
    ).toEqual([
      '경기도 화성시 동탄구 동탄대로 446 1층 1103호, 1104호',
      '경기도 화성시 동탄구 동탄대로 446',
    ]);
  });
});
