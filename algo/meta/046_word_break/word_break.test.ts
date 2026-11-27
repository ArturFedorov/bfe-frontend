import { wordBreak } from './word_break';

describe('wordBreak', () => {
  it('splits into two words', () => {
    expect(wordBreak('leetcode', ['leet', 'code'])).toBe(true);
  });

  it('reuses a dictionary word', () => {
    expect(wordBreak('applepenapple', ['apple', 'pen'])).toBe(true);
  });

  it('returns false when no full segmentation exists', () => {
    expect(wordBreak('catsandog', ['cats', 'dog', 'sand', 'and', 'cat'])).toBe(
      false,
    );
  });

  it('accepts a string that is itself a word', () => {
    expect(wordBreak('a', ['a'])).toBe(true);
  });

  it('rejects a single unknown character', () => {
    expect(wordBreak('b', ['a'])).toBe(false);
  });

  it('combines words of different lengths', () => {
    expect(wordBreak('aaaaaaa', ['aaaa', 'aaa'])).toBe(true);
  });

  it('requires backtracking past a greedy longest match', () => {
    expect(wordBreak('cars', ['car', 'ca', 'rs'])).toBe(true);
  });

  it('handles overlapping prefixes and a leftover character', () => {
    expect(wordBreak('goalspecial', ['go', 'goal', 'goals', 'special'])).toBe(
      true,
    );
    expect(wordBreak('goalspeciall', ['go', 'goal', 'goals', 'special'])).toBe(
      false,
    );
  });

  it('ignores words longer than the string', () => {
    expect(wordBreak('ab', ['abc', 'a', 'b'])).toBe(true);
  });

  it('handles a large unbreakable input quickly (defeats naive recursion)', () => {
    const s = 'a'.repeat(299) + 'b';
    const dict = Array.from({ length: 20 }, (_, i) => 'a'.repeat(i + 1));
    expect(wordBreak(s, dict)).toBe(false);
  });

  it('handles a large breakable input quickly', () => {
    const s = 'a'.repeat(299) + 'b';
    const dict = [
      ...Array.from({ length: 20 }, (_, i) => 'a'.repeat(i + 1)),
      'ab',
    ];
    expect(wordBreak(s, dict)).toBe(true);
  });
});
