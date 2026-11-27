import { groupStrings } from './group_shifted_strings';

/** Sorts each group, then the groups themselves, for order-insensitive comparison. */
function normalize(groups: string[][]): string[][] {
  return groups
    .map((g) => [...g].sort())
    .sort((a, b) => a.join(',').localeCompare(b.join(',')));
}

describe('groupStrings', () => {
  it('example: mixed groups', () => {
    expect(
      normalize(
        groupStrings(['abc', 'bcd', 'acef', 'xyz', 'az', 'ba', 'a', 'z']),
      ),
    ).toEqual(
      normalize([['abc', 'bcd', 'xyz'], ['acef'], ['az', 'ba'], ['a', 'z']]),
    );
  });

  it('single string', () => {
    expect(groupStrings(['a'])).toEqual([['a']]);
  });

  it('empty input', () => {
    expect(groupStrings([])).toEqual([]);
  });

  it('all single letters form one group', () => {
    const letters = 'abcdefghijklmnopqrstuvwxyz'.split('');
    expect(normalize(groupStrings(letters))).toEqual([letters]);
  });

  it('keeps duplicates', () => {
    expect(normalize(groupStrings(['ab', 'ab', 'bc']))).toEqual([
      ['ab', 'ab', 'bc'],
    ]);
  });

  it('wraps around z -> a', () => {
    expect(normalize(groupStrings(['az', 'ba', 'za']))).toEqual(
      normalize([['az', 'ba'], ['za']]),
    );
  });

  it('separates strings of different lengths', () => {
    expect(normalize(groupStrings(['a', 'aa', 'aaa', 'bb']))).toEqual(
      normalize([['a'], ['aa', 'bb'], ['aaa']]),
    );
  });

  it('does not confuse multi-digit differences (key collision trap)', () => {
    // diffs [1, 11] and [11, 1] both concatenate to '111' without a separator.
    expect(normalize(groupStrings(['abm', 'alm', 'bcn']))).toEqual(
      normalize([['abm', 'bcn'], ['alm']]),
    );
  });

  it('no two strings share a group', () => {
    expect(normalize(groupStrings(['abc', 'abd', 'abe']))).toEqual(
      normalize([['abc'], ['abd'], ['abe']]),
    );
  });

  it('handles a large input with many groups in linear time', () => {
    // 10^5 strings in 5 * 10^4 groups of two: comparing each string against
    // existing groups (or every other string) is quadratic and times out.
    const n = 100_000;
    const strings: string[] = [];
    for (let i = 0; i < n; i++) {
      const shift = i % 2 === 0 ? 0 : 3;
      let k = Math.floor(i / 2);
      const offsets = [0];
      for (let d = 0; d < 4; d++) {
        offsets.push(k % 26);
        k = Math.floor(k / 26);
      }
      strings.push(
        offsets
          .map((o) => String.fromCharCode(97 + ((o + shift) % 26)))
          .join(''),
      );
    }
    const groups = groupStrings(strings);
    expect(groups).toHaveLength(n / 2);
    expect(groups.every((g) => g.length === 2)).toBe(true);
  });
});
