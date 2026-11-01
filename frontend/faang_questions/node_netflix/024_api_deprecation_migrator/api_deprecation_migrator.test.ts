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

  it('returns the input unchanged when there is no call at all', () => {
    expect(migrateApi('const x = 5;')).toBe('const x = 5;');
  });

  it('returns an empty string unchanged', () => {
    expect(migrateApi('')).toBe('');
  });

  it('handles a call with no trailing semicolon', () => {
    expect(migrateApi('oldApi(1, 2)')).toBe('newApi(2, 1)');
  });

  it('rewrites a call embedded within a larger statement', () => {
    expect(migrateApi('const result = oldApi(1, 2);')).toBe(
      'const result = newApi(2, 1);',
    );
  });

  it('rewrites calls with string literal arguments', () => {
    expect(migrateApi("oldApi('a', 'b');")).toBe("newApi('b', 'a');");
  });

  it('rewrites calls with negative number arguments', () => {
    expect(migrateApi('oldApi(-1, 2);')).toBe('newApi(2, -1);');
  });

  it('normalizes extra whitespace around arguments', () => {
    expect(migrateApi('oldApi( 1 , 2 );')).toBe('newApi(2, 1);');
  });

  it('rewrites calls with identifier arguments containing digits and underscores', () => {
    expect(migrateApi('oldApi(x_1, y2);')).toBe('newApi(y2, x_1);');
  });

  it('mixes rewritten calls with untouched statements', () => {
    expect(migrateApi('const a = 1; oldApi(a, 2); keep(3, 4);')).toBe(
      'const a = 1; newApi(2, a); keep(3, 4);',
    );
  });

  it('does not rewrite calls whose name only contains oldApi as a substring', () => {
    expect(migrateApi('oldApiV2(1, 2);')).toBe('oldApiV2(1, 2);');
  });

  it('is case-sensitive and leaves differently-cased names untouched', () => {
    expect(migrateApi('OLDAPI(1, 2);')).toBe('OLDAPI(1, 2);');
  });

  it('rewrites three consecutive calls', () => {
    expect(migrateApi('oldApi(1, 2); oldApi(3, 4); oldApi(5, 6);')).toBe(
      'newApi(2, 1); newApi(4, 3); newApi(6, 5);',
    );
  });
});
