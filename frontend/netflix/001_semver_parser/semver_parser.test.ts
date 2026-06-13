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
});
