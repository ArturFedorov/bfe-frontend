import { parseVersion } from './semver_parser';

describe('parseVersion', () => {
  it('parses a basic version', () => {
    expect(parseVersion('1.2.3')).toEqual({
      major: 1,
      minor: 2,
      patch: 3,
      prerelease: null,
    });
  });

  it('parses a version with a prerelease tag', () => {
    expect(parseVersion('1.2.3-beta.1')).toEqual({
      major: 1,
      minor: 2,
      patch: 3,
      prerelease: 'beta.1',
    });
  });

  it('parses zeros', () => {
    expect(parseVersion('0.0.0')).toEqual({
      major: 0,
      minor: 0,
      patch: 0,
      prerelease: null,
    });
  });

  it('throws on malformed input', () => {
    expect(() => parseVersion('1.2')).toThrow();
    expect(() => parseVersion('abc')).toThrow();
  });

  describe('multi-digit and large numbers', () => {
    it('parses multi-digit components', () => {
      expect(parseVersion('10.20.30')).toEqual({
        major: 10,
        minor: 20,
        patch: 30,
        prerelease: null,
      });
    });

    it('parses large numbers as numbers, not strings', () => {
      const result = parseVersion('123.456.789');
      expect(result.major).toBe(123);
      expect(result.minor).toBe(456);
      expect(result.patch).toBe(789);
      expect(typeof result.major).toBe('number');
    });
  });

  describe('prerelease handling', () => {
    it('keeps everything after the first dash, including further dashes', () => {
      expect(parseVersion('1.2.3-beta.1-rc')).toEqual({
        major: 1,
        minor: 2,
        patch: 3,
        prerelease: 'beta.1-rc',
      });
    });

    it('parses a single-token prerelease', () => {
      expect(parseVersion('2.0.0-alpha')).toEqual({
        major: 2,
        minor: 0,
        patch: 0,
        prerelease: 'alpha',
      });
    });

    it('parses a dotted prerelease with numeric identifiers', () => {
      expect(parseVersion('1.0.0-rc.10.beta')).toEqual({
        major: 1,
        minor: 0,
        patch: 0,
        prerelease: 'rc.10.beta',
      });
    });

    it('preserves prerelease that looks numeric as a string', () => {
      const result = parseVersion('1.2.3-0');
      expect(result.prerelease).toBe('0');
      expect(typeof result.prerelease).toBe('string');
    });

    it('does not confuse a prerelease number with the patch number', () => {
      expect(parseVersion('1.2.3-456')).toEqual({
        major: 1,
        minor: 2,
        patch: 3,
        prerelease: '456',
      });
    });
  });

  describe('malformed input', () => {
    it.each([
      ['empty string', ''],
      ['too few components', '1.2'],
      ['too many components', '1.2.3.4'],
      ['leading "v" prefix', 'v1.2.3'],
      ['non-numeric component', '1.2.x'],
      ['all non-numeric components', 'abc.def.ghi'],
      ['negative component', '1.-2.3'],
      ['trailing dash with empty prerelease', '1.2.3-'],
      ['leading/trailing whitespace', ' 1.2.3 '],
      ['non-numeric word', 'abc'],
      ['missing patch with prerelease', '1.2-beta'],
    ])('throws on %s', (_label, input) => {
      expect(() => parseVersion(input)).toThrow();
    });
  });
});
