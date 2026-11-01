import { compare, gt, lt, eq } from './semver_comparator';

describe('semver comparator', () => {
  it('orders by major', () => {
    expect(compare('2.0.0', '1.9.9')).toBe(1);
    expect(compare('1.0.0', '2.0.0')).toBe(-1);
  });

  it('orders by minor then patch', () => {
    expect(compare('1.2.0', '1.1.9')).toBe(1);
    expect(compare('1.1.1', '1.1.2')).toBe(-1);
  });

  it('detects equality', () => {
    expect(compare('1.2.3', '1.2.3')).toBe(0);
  });

  it('exposes gt / lt / eq helpers', () => {
    expect(gt('1.2.4', '1.2.3')).toBe(true);
    expect(lt('1.2.3', '1.2.4')).toBe(true);
    expect(eq('1.2.3', '1.2.3')).toBe(true);
  });

  describe('numeric (not lexical) core comparison', () => {
    it('treats multi-digit numbers numerically (10 > 9)', () => {
      expect(compare('1.10.0', '1.9.0')).toBe(1);
      expect(compare('1.0.10', '1.0.9')).toBe(1);
      expect(compare('10.0.0', '9.9.9')).toBe(1);
    });

    it('is antisymmetric: swapping arguments negates the result', () => {
      expect(compare('1.0.0', '2.0.0')).toBe(-1);
      expect(compare('2.0.0', '1.0.0')).toBe(1);
    });

    it('gt / lt are false when versions are equal', () => {
      expect(gt('1.2.3', '1.2.3')).toBe(false);
      expect(lt('1.2.3', '1.2.3')).toBe(false);
      expect(eq('1.2.4', '1.2.3')).toBe(false);
    });
  });

  describe('prerelease precedence', () => {
    it('ranks a prerelease below the corresponding release', () => {
      expect(compare('1.0.0-alpha', '1.0.0')).toBe(-1);
      expect(compare('1.0.0', '1.0.0-alpha')).toBe(1);
    });

    it('compares alphanumeric identifiers lexically (ASCII order)', () => {
      expect(compare('1.0.0-alpha', '1.0.0-beta')).toBe(-1);
      expect(compare('1.0.0-beta', '1.0.0-alpha')).toBe(1);
    });

    it('compares purely numeric identifiers numerically', () => {
      expect(compare('1.0.0-1', '1.0.0-2')).toBe(-1);
      expect(compare('1.0.0-2', '1.0.0-11')).toBe(-1);
    });

    it('compares dotted identifiers field by field', () => {
      expect(compare('1.0.0-alpha.1', '1.0.0-alpha.2')).toBe(-1);
      expect(compare('1.0.0-alpha.2', '1.0.0-alpha.1')).toBe(1);
    });

    it('ranks a shorter prerelease below a longer one with the same prefix', () => {
      expect(compare('1.0.0-alpha', '1.0.0-alpha.1')).toBe(-1);
      expect(compare('1.0.0-alpha.1', '1.0.0-alpha')).toBe(1);
    });

    it('ranks numeric identifiers below alphanumeric ones', () => {
      // Per semver: numeric identifiers always have lower precedence.
      expect(compare('1.0.0-1', '1.0.0-alpha')).toBe(-1);
    });

    it('treats identical prerelease strings as equal', () => {
      expect(compare('1.0.0-alpha.1', '1.0.0-alpha.1')).toBe(0);
      expect(eq('1.0.0-rc.1', '1.0.0-rc.1')).toBe(true);
    });

    it('lets the core version win regardless of prerelease', () => {
      expect(compare('1.0.0', '1.0.1-alpha')).toBe(-1);
      expect(compare('2.0.0-alpha', '1.0.0')).toBe(1);
    });

    it('follows the full semver ordering example end to end', () => {
      const ordered = [
        '1.0.0-alpha',
        '1.0.0-alpha.1',
        '1.0.0-alpha.beta',
        '1.0.0-beta',
        '1.0.0-beta.2',
        '1.0.0-beta.11',
        '1.0.0-rc.1',
        '1.0.0',
      ];

      for (let i = 0; i < ordered.length - 1; i++) {
        expect(compare(ordered[i], ordered[i + 1])).toBe(-1);
        expect(compare(ordered[i + 1], ordered[i])).toBe(1);
      }
    });
  });
});
