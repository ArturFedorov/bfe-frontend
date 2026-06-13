import { migrateApi } from './api_deprecation_migrator';

describe('migrateApi', () => {
  it('rewrites and swaps arguments', () => {
    expect(migrateApi('oldApi(1, 2);')).toBe('newApi(2, 1);');
  });

  it('handles multiple calls', () => {
    expect(migrateApi('oldApi(a, b); oldApi(c, d);')).toBe(
      'newApi(b, a); newApi(d, c);',
    );
  });

  it('leaves unrelated code untouched', () => {
    expect(migrateApi('keep(1, 2);')).toBe('keep(1, 2);');
  });
});
