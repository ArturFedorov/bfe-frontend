import { minRemoveToMakeValid } from './min_remove_to_make_valid';

function isValid(str: string): boolean {
  let balance = 0;
  for (const ch of str) {
    if (ch === '(') balance++;
    else if (ch === ')') {
      balance--;
      if (balance < 0) return false;
    }
  }
  return balance === 0;
}

function isSubsequence(sub: string, str: string): boolean {
  let i = 0;
  for (let j = 0; j < str.length && i < sub.length; j++) {
    if (sub[i] === str[j]) i++;
  }
  return i === sub.length;
}

function letters(str: string): string {
  return str.replace(/[()]/g, '');
}

/** Asserts the answer is valid, keeps all letters in order, and has the expected length. */
function expectMinimalValid(input: string, expectedLength: number): void {
  const out = minRemoveToMakeValid(input);
  expect(isValid(out)).toBe(true);
  expect(isSubsequence(out, input)).toBe(true);
  expect(letters(out)).toBe(letters(input));
  expect(out).toHaveLength(expectedLength);
}

describe('minRemoveToMakeValid', () => {
  it('example 1: removes one extra closing paren (multiple answers allowed)', () => {
    expectMinimalValid('lee(t(c)o)de)', 12);
  });

  it('example 2: removes a leading unmatched closer', () => {
    expect(minRemoveToMakeValid('a)b(c)d')).toBe('ab(c)d');
  });

  it('example 3: removes everything when nothing can match', () => {
    expect(minRemoveToMakeValid('))((')).toBe('');
  });

  it('keeps an already valid string unchanged', () => {
    expect(minRemoveToMakeValid('(a(b)c)')).toBe('(a(b)c)');
  });

  it('keeps a letters-only string unchanged', () => {
    expect(minRemoveToMakeValid('abc')).toBe('abc');
  });

  it('handles a single paren', () => {
    expect(minRemoveToMakeValid('(')).toBe('');
    expect(minRemoveToMakeValid(')')).toBe('');
  });

  it('removes trailing unmatched openers', () => {
    expect(minRemoveToMakeValid('ab((')).toBe('ab');
  });

  it('handles mixed unmatched openers and closers', () => {
    expectMinimalValid('())()(((', 4);
    expectMinimalValid('(a(b(c)d)', 8);
  });

  it('handles a reversed pair', () => {
    expect(minRemoveToMakeValid(')a(')).toBe('a');
  });

  it('handles deeply nested valid input', () => {
    const s = '('.repeat(1000) + 'x' + ')'.repeat(1000);
    expect(minRemoveToMakeValid(s)).toBe(s);
  });

  it('runs in linear time on a large input', () => {
    const n = 100_000;
    const s = ')('.repeat(n / 2);
    // Every ')' before its '(' is unmatched except pairs '()' formed in the middle.
    expectMinimalValid(s, n - 2);
    const opens = '('.repeat(n) + 'z';
    expect(minRemoveToMakeValid(opens)).toBe('z');
  });
});
