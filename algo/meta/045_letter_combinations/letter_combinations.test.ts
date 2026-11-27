import { letterCombinations } from './letter_combinations';

const sorted = (xs: string[]): string[] => [...xs].sort();

describe('letterCombinations', () => {
  it('combines two digits', () => {
    expect(sorted(letterCombinations('23'))).toEqual([
      'ad',
      'ae',
      'af',
      'bd',
      'be',
      'bf',
      'cd',
      'ce',
      'cf',
    ]);
  });

  it('returns an empty array for empty input', () => {
    expect(letterCombinations('')).toEqual([]);
  });

  it('handles a single digit', () => {
    expect(sorted(letterCombinations('2'))).toEqual(['a', 'b', 'c']);
  });

  it('handles four-letter keys 7 and 9', () => {
    expect(sorted(letterCombinations('7'))).toEqual(['p', 'q', 'r', 's']);
    expect(sorted(letterCombinations('9'))).toEqual(['w', 'x', 'y', 'z']);
  });

  it('handles repeated digits', () => {
    expect(sorted(letterCombinations('22'))).toEqual([
      'aa',
      'ab',
      'ac',
      'ba',
      'bb',
      'bc',
      'ca',
      'cb',
      'cc',
    ]);
  });

  it('keeps digit order in each result', () => {
    const result = letterCombinations('68');
    expect(result).toContain('mt');
    expect(result).not.toContain('tm');
    expect(result).toHaveLength(9);
  });

  it('returns 4^4 combinations for 7979', () => {
    const result = letterCombinations('7979');
    expect(result).toHaveLength(256);
    expect(new Set(result).size).toBe(256);
    expect(result).toContain('pwsz');
  });

  it('returns 3*3*4*4 combinations for mixed keys', () => {
    const result = letterCombinations('2379');
    expect(result).toHaveLength(144);
    expect(result.every((s) => s.length === 4)).toBe(true);
    expect(result).toContain('cfsz');
  });
});
