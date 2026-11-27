import { removeInvalidParentheses } from './remove_invalid_parentheses';

const sorted = (xs: string[]): string[] => [...xs].sort();

describe('removeInvalidParentheses', () => {
  it('returns both minimal fixes for ()())()', () => {
    expect(sorted(removeInvalidParentheses('()())()'))).toEqual(
      sorted(['(())()', '()()()']),
    );
  });

  it('keeps letters in place', () => {
    expect(sorted(removeInvalidParentheses('(a)())()'))).toEqual(
      sorted(['(a())()', '(a)()()']),
    );
  });

  it('returns the empty string when everything must go', () => {
    expect(removeInvalidParentheses(')(')).toEqual(['']);
  });

  it('returns an already valid string unchanged', () => {
    expect(removeInvalidParentheses('(a(b)c)')).toEqual(['(a(b)c)']);
  });

  it('returns a letters-only string unchanged', () => {
    expect(removeInvalidParentheses('abc')).toEqual(['abc']);
  });

  it('removes a single stray parenthesis', () => {
    expect(removeInvalidParentheses('(')).toEqual(['']);
    expect(removeInvalidParentheses('x)')).toEqual(['x']);
  });

  it('removes extra opening parentheses', () => {
    expect(sorted(removeInvalidParentheses('(()'))).toEqual(['()']);
    expect(sorted(removeInvalidParentheses('((a)'))).toEqual(sorted(['(a)']));
  });

  it('removes both kinds when needed', () => {
    expect(sorted(removeInvalidParentheses(')a(b)c('))).toEqual(['a(b)c']);
  });

  it('returns distinct results only', () => {
    const result = removeInvalidParentheses('(((k()((');
    expect(new Set(result).size).toBe(result.length);
    expect(sorted(result)).toEqual(sorted(['k()', '(k)']));
  });

  it('handles several distinct answers with letters', () => {
    expect(sorted(removeInvalidParentheses('(a)b)c)'))).toEqual(
      sorted(['(abc)', '(ab)c', '(a)bc']),
    );
  });

  it('handles a long mostly-invalid input quickly', () => {
    const s = '(a)())()((((((((((((()';
    const result = removeInvalidParentheses(s);
    expect(result.length).toBeGreaterThan(0);
    for (const r of result) {
      expect(r.length).toBe(result[0].length);
    }
    expect(sorted(result)).toEqual(sorted(['(a())()()', '(a)()()()']));
  });
});
