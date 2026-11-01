import { satisfies } from './semver_range_matcher';

describe('satisfies', () => {
  it('matches exact versions', () => {
    expect(satisfies('1.2.3', '1.2.3')).toBe(true);
    expect(satisfies('1.2.4', '1.2.3')).toBe(false);
  });

  it('handles caret ranges', () => {
    expect(satisfies('1.5.0', '^1.2.3')).toBe(true);
    expect(satisfies('2.0.0', '^1.2.3')).toBe(false);
  });

  it('handles tilde ranges', () => {
    expect(satisfies('1.2.9', '~1.2.3')).toBe(true);
    expect(satisfies('1.3.0', '~1.2.3')).toBe(false);
  });

  it('handles comparators', () => {
    expect(satisfies('2.0.0', '>=1.0.0')).toBe(true);
    expect(satisfies('0.9.0', '>=1.0.0')).toBe(false);
    expect(satisfies('1.0.0', '<2.0.0')).toBe(true);
  });

  it('handles || unions', () => {
    expect(satisfies('1.0.0', '^1.0.0 || ^2.0.0')).toBe(true);
    expect(satisfies('2.5.0', '^1.0.0 || ^2.0.0')).toBe(true);
    expect(satisfies('3.0.0', '^1.0.0 || ^2.0.0')).toBe(false);
  });

  describe('caret edge cases', () => {
    it('treats the floor as inclusive and the ceiling as exclusive', () => {
      expect(satisfies('1.2.3', '^1.2.3')).toBe(true); // floor inclusive
      expect(satisfies('1.2.2', '^1.2.3')).toBe(false); // just below floor
      expect(satisfies('1.99.99', '^1.2.3')).toBe(true); // just below ceiling
      expect(satisfies('2.0.0', '^1.2.3')).toBe(false); // ceiling exclusive
    });

    it('pins the minor when major is zero (^0.2.3 => >=0.2.3 <0.3.0)', () => {
      expect(satisfies('0.2.3', '^0.2.3')).toBe(true);
      expect(satisfies('0.2.9', '^0.2.3')).toBe(true);
      expect(satisfies('0.3.0', '^0.2.3')).toBe(false);
      expect(satisfies('0.2.2', '^0.2.3')).toBe(false);
    });

    it('pins the patch when major and minor are zero (^0.0.3 => >=0.0.3 <0.0.4)', () => {
      expect(satisfies('0.0.3', '^0.0.3')).toBe(true);
      expect(satisfies('0.0.4', '^0.0.3')).toBe(false);
      expect(satisfies('0.1.0', '^0.0.3')).toBe(false);
    });

    it('allows the entire major range from a .0.0 base', () => {
      expect(satisfies('1.0.0', '^1.0.0')).toBe(true);
      expect(satisfies('1.999.999', '^1.0.0')).toBe(true);
      expect(satisfies('0.999.999', '^1.0.0')).toBe(false);
      expect(satisfies('2.0.0', '^1.0.0')).toBe(false);
    });
  });

  describe('tilde edge cases', () => {
    it('treats the floor as inclusive and the next minor as exclusive', () => {
      expect(satisfies('1.2.3', '~1.2.3')).toBe(true);
      expect(satisfies('1.2.2', '~1.2.3')).toBe(false);
      expect(satisfies('1.2.999', '~1.2.3')).toBe(true);
      expect(satisfies('1.3.0', '~1.2.3')).toBe(false);
    });

    it('does not allow a different major', () => {
      expect(satisfies('2.2.3', '~1.2.3')).toBe(false);
      expect(satisfies('0.2.3', '~1.2.3')).toBe(false);
    });
  });

  describe('comparator boundaries', () => {
    it('respects inclusive vs exclusive boundaries exactly', () => {
      expect(satisfies('1.0.0', '>=1.0.0')).toBe(true);
      expect(satisfies('1.0.0', '>1.0.0')).toBe(false);
      expect(satisfies('1.0.1', '>1.0.0')).toBe(true);
      expect(satisfies('2.0.0', '<=2.0.0')).toBe(true);
      expect(satisfies('2.0.0', '<2.0.0')).toBe(false);
      expect(satisfies('1.9.9', '<2.0.0')).toBe(true);
    });

    it('compares each component numerically, not lexically', () => {
      expect(satisfies('1.10.0', '>1.9.0')).toBe(true); // 10 > 9
      expect(satisfies('1.9.0', '>1.10.0')).toBe(false);
      expect(satisfies('1.0.10', '>1.0.9')).toBe(true);
    });
  });

  describe('union edge cases', () => {
    it('matches when any of three clauses matches', () => {
      const range = '~1.2.0 || ~1.4.0 || ^3.0.0';
      expect(satisfies('1.2.5', range)).toBe(true);
      expect(satisfies('1.4.5', range)).toBe(true);
      expect(satisfies('3.9.0', range)).toBe(true);
      expect(satisfies('1.3.0', range)).toBe(false); // falls in the gap
      expect(satisfies('2.0.0', range)).toBe(false);
    });

    it('is false only when every clause is false', () => {
      expect(satisfies('5.0.0', '^1.0.0 || ^2.0.0 || ^3.0.0')).toBe(false);
    });
  });

  describe('prerelease handling', () => {
    it('orders release above its prerelease', () => {
      expect(satisfies('1.2.3', '>=1.2.3-alpha')).toBe(true);
      expect(satisfies('1.2.3-alpha', '>=1.2.3')).toBe(false);
    });

    it('orders prereleases by identifier', () => {
      expect(satisfies('1.2.3-beta', '>1.2.3-alpha')).toBe(true);
      expect(satisfies('1.2.3-alpha.2', '>1.2.3-alpha.1')).toBe(true);
    });
  });
});
