import { resolve, Registry } from './dependency_version_resolver';

const registry: Registry = {
  react: ['16.0.0', '17.0.0', '17.0.2', '18.0.0'],
  lodash: ['4.17.20', '4.17.21'],
};

describe('resolve', () => {
  it('picks the highest satisfying version', () => {
    expect(resolve(registry, { react: '^17.0.0', lodash: '^4.17.0' })).toEqual({
      react: '17.0.2',
      lodash: '4.17.21',
    });
  });

  it('throws when no version satisfies', () => {
    expect(() => resolve(registry, { react: '^19.0.0' })).toThrow();
  });

  describe('picking the highest version', () => {
    it('compares versions numerically, not lexically', () => {
      // '17.9.0' < '17.10.0' numerically, but '17.9.0' > '17.10.0' lexically.
      const reg: Registry = { pkg: ['17.9.0', '17.10.0', '17.2.0'] };
      expect(resolve(reg, { pkg: '^17.0.0' })).toEqual({ pkg: '17.10.0' });
    });

    it('does not depend on the order versions appear in the registry', () => {
      const reg: Registry = { pkg: ['18.0.0', '16.0.0', '17.0.2', '17.0.0'] };
      expect(resolve(reg, { pkg: '^17.0.0' })).toEqual({ pkg: '17.0.2' });
    });

    it('caps at the range ceiling even when higher versions exist', () => {
      // 18.0.0 is available but excluded by the caret ceiling (<18.0.0).
      expect(resolve(registry, { react: '^17.0.0' })).toEqual({
        react: '17.0.2',
      });
    });

    it('selects the single newest patch within a tilde range', () => {
      const reg: Registry = {
        pkg: ['1.2.0', '1.2.5', '1.2.9', '1.3.0'],
      };
      expect(resolve(reg, { pkg: '~1.2.0' })).toEqual({ pkg: '1.2.9' });
    });
  });

  describe('range operators', () => {
    it('resolves an exact pin to that exact version', () => {
      expect(resolve(registry, { react: '17.0.0' })).toEqual({
        react: '17.0.0',
      });
    });

    it('resolves comparator ranges', () => {
      expect(resolve(registry, { react: '>=17.0.0 <18.0.0' })).toEqual({
        react: '17.0.2',
      });
      expect(resolve(registry, { react: '<17.0.0' })).toEqual({
        react: '16.0.0',
      });
    });

    it('resolves a || union to the highest match across all clauses', () => {
      expect(resolve(registry, { react: '^16.0.0 || ^18.0.0' })).toEqual({
        react: '18.0.0',
      });
    });

    it('honors a union when only the lower clause has a match', () => {
      const reg: Registry = { pkg: ['1.0.0', '1.5.0'] };
      expect(resolve(reg, { pkg: '^1.0.0 || ^3.0.0' })).toEqual({
        pkg: '1.5.0',
      });
    });
  });

  describe('multiple requirements', () => {
    it('resolves several packages independently in one call', () => {
      const reg: Registry = {
        a: ['1.0.0', '1.2.0'],
        b: ['2.0.0', '2.0.5', '2.1.0', '3.0.0'], // added 2.0.5 so tilde has something to pick
        c: ['0.1.0', '0.2.0'],
      };
      expect(resolve(reg, { a: '^1.0.0', b: '~2.0.0', c: '^0.1.0' })).toEqual({
        a: '1.2.0',
        b: '2.0.5', // highest patch within 2.0.x
        c: '0.1.0',
      });
    });

    it('throws if any single requirement is unsatisfiable, even when others resolve', () => {
      expect(() =>
        resolve(registry, { react: '^17.0.0', lodash: '^5.0.0' }),
      ).toThrow();
    });

    it('returns an empty object for empty requirements', () => {
      expect(resolve(registry, {})).toEqual({});
    });
  });

  describe('zero-major (0.x) caret semantics', () => {
    it('pins the minor for ^0.x and picks the highest matching patch', () => {
      const reg: Registry = { pkg: ['0.2.0', '0.2.3', '0.2.9', '0.3.0'] };
      // ^0.2.0 => >=0.2.0 <0.3.0
      expect(resolve(reg, { pkg: '^0.2.0' })).toEqual({ pkg: '0.2.9' });
    });
  });

  describe('failure modes', () => {
    it('throws when the package has no published versions', () => {
      const reg: Registry = { pkg: [] };
      expect(() => resolve(reg, { pkg: '^1.0.0' })).toThrow();
    });

    it('throws when the required package is absent from the registry', () => {
      expect(() => resolve(registry, { vue: '^3.0.0' })).toThrow();
    });

    it('throws when every published version is below the range floor', () => {
      expect(() => resolve(registry, { lodash: '>=5.0.0' })).toThrow();
    });
  });

  describe('prerelease handling', () => {
    it('prefers a stable release over a prerelease of the same version', () => {
      const reg: Registry = { pkg: ['1.0.0-rc.1', '1.0.0'] };
      expect(resolve(reg, { pkg: '>=1.0.0' })).toEqual({ pkg: '1.0.0' });
    });
  });
});
