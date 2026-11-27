import { validPalindrome } from './valid_palindrome_ii';

describe('validPalindrome', () => {
  it('returns true for an existing palindrome', () => {
    expect(validPalindrome('aba')).toBe(true);
  });

  it('returns true when one deletion is enough', () => {
    expect(validPalindrome('abca')).toBe(true);
  });

  it('returns false when two deletions are needed', () => {
    expect(validPalindrome('abc')).toBe(false);
  });

  it('handles a single character', () => {
    expect(validPalindrome('a')).toBe(true);
  });

  it('handles two different characters', () => {
    expect(validPalindrome('ab')).toBe(true);
  });

  it('handles deleting the first character', () => {
    expect(validPalindrome('xracecar')).toBe(true);
  });

  it('handles deleting the last character', () => {
    expect(validPalindrome('racecarx')).toBe(true);
  });

  it('must try both sides on a mismatch (skip right is correct)', () => {
    // Skipping the left char at the first mismatch fails; skipping the right succeeds.
    expect(
      validPalindrome(
        'aguokepatgbnvfqmgmlcupuufxoohdfpgjdmysgvhmvffcnqxjjxqncffvmhvgsymdjgpfdhooxfuupuculmgmqfvnbgtapekouga',
      ),
    ).toBe(true);
  });

  it('must try both sides on a mismatch (skip left is correct)', () => {
    expect(validPalindrome('cbbcc')).toBe(true);
  });

  it('returns false when mismatches are far apart', () => {
    expect(validPalindrome('abcdba')).toBe(true);
    expect(validPalindrome('abcdeba')).toBe(false);
  });

  it('handles all identical characters', () => {
    expect(validPalindrome('aaaaaaa')).toBe(true);
  });

  it('runs in linear time on a large input', () => {
    const half = 'ab'.repeat(25_000);
    const reversed = half.split('').reverse().join('');
    expect(validPalindrome(half + 'z' + reversed)).toBe(true);
    // Many near-mismatches: brute force O(n^2) would time out.
    expect(
      validPalindrome('a'.repeat(50_000) + 'bc' + 'a'.repeat(50_000)),
    ).toBe(true);
    expect(
      validPalindrome('a'.repeat(50_000) + 'bcd' + 'a'.repeat(50_000)),
    ).toBe(false);
  });
});
