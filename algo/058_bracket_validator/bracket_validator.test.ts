import { validateBrackets } from './bracket_validator';

describe('validateBrackets', () => {
  describe('balanced snippets', () => {
    it('accepts a simple pair', () => {
      expect(validateBrackets('()')).toBe(true);
    });

    it('accepts all three bracket types side by side', () => {
      expect(validateBrackets('()[]{}')).toBe(true);
    });

    it('accepts properly nested mixed brackets', () => {
      expect(validateBrackets('{[()()]}')).toBe(true);
    });

    it('ignores non-bracket characters', () => {
      expect(validateBrackets('server { port = (8080) }')).toBe(true);
    });

    it('accepts a realistic config snippet', () => {
      expect(validateBrackets('routes = [{ path: "/a", tags: ["x", "y"] }]')).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('accepts an empty string', () => {
      expect(validateBrackets('')).toBe(true);
    });

    it('accepts a string with no brackets at all', () => {
      expect(validateBrackets('key = value; # comment')).toBe(true);
    });

    it('rejects a single opening bracket', () => {
      expect(validateBrackets('(')).toBe(false);
    });

    it('rejects a single closing bracket', () => {
      expect(validateBrackets(')')).toBe(false);
    });
  });

  describe('unbalanced snippets', () => {
    it.each([
      ['mismatched pair', '(]'],
      ['interleaved pairs', '([)]'],
      ['closing before opening', ')('],
      ['leftover opener at the end', '{[]'],
      ['extra closer at the end', '[]}'],
      ['mismatch buried in text', 'list[0] = { key: (a }'],
      ['counts match but order is wrong', '[(])'],
      ['unclosed opener buried in text', 'if (x { y }'],
    ])('rejects %s', (_label, input) => {
      expect(validateBrackets(input)).toBe(false);
    });
  });

  describe('large input', () => {
    it('handles 100_000 characters of deep nesting in linear time', () => {
      const half = 25_000;
      const balanced = '{['.repeat(half) + ']}'.repeat(half);
      expect(balanced).toHaveLength(100_000);
      expect(validateBrackets(balanced)).toBe(true);

      const broken = balanced.slice(0, -1) + ')';
      expect(validateBrackets(broken)).toBe(false);
    });
  });
});
