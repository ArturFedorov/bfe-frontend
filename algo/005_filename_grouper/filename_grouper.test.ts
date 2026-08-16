import { groupFilenames } from './filename_grouper';

describe('groupFilenames', () => {
  it('groups names equal up to case and separators', () => {
    expect(
      groupFilenames(['myFile-v2', 'report', 'my_file_v2', 'Report']),
    ).toEqual([
      ['myFile-v2', 'my_file_v2'],
      ['report', 'Report'],
    ]);
  });

  it('treats dash, underscore, and space as the same (ignored) separator', () => {
    expect(groupFilenames(['a-b', 'ab', 'a b', 'a_b'])).toEqual([
      ['a-b', 'ab', 'a b', 'a_b'],
    ]);
  });

  it('keeps singleton groups', () => {
    expect(groupFilenames(['alpha', 'beta'])).toEqual([['alpha'], ['beta']]);
  });

  it('returns [] for empty input', () => {
    expect(groupFilenames([])).toEqual([]);
  });

  it('handles a single name', () => {
    expect(groupFilenames(['only-one'])).toEqual([['only-one']]);
  });

  it('orders groups by first occurrence and preserves order within a group', () => {
    expect(groupFilenames(['b1', 'A_1', 'B-1', 'a1'])).toEqual([
      ['b1', 'B-1'],
      ['A_1', 'a1'],
    ]);
  });

  it('keeps exact duplicates as separate entries in the same group', () => {
    expect(groupFilenames(['x', 'x', 'X'])).toEqual([['x', 'x', 'X']]);
  });

  it('does not ignore dots or other punctuation', () => {
    expect(groupFilenames(['my.file', 'myfile', 'my-file'])).toEqual([
      ['my.file'],
      ['myfile', 'my-file'],
    ]);
  });

  it('matches camelCase against snake_case and kebab-case', () => {
    expect(groupFilenames(['myFileV2', 'my_file_v2', 'my-file-v2'])).toEqual([
      ['myFileV2', 'my_file_v2', 'my-file-v2'],
    ]);
  });

  it('keeps digits significant', () => {
    expect(groupFilenames(['file1', 'file2', 'file_1'])).toEqual([
      ['file1', 'file_1'],
      ['file2'],
    ]);
  });

  it('groups empty and separator-only names together', () => {
    expect(groupFilenames(['', '-', '_ _', 'a'])).toEqual([
      ['', '-', '_ _'],
      ['a'],
    ]);
  });

  it('handles names that collide with object prototype keys', () => {
    expect(groupFilenames(['constructor', '__proto__', 'Constructor'])).toEqual(
      [['constructor', 'Constructor'], ['__proto__']],
    );
  });

  it('groups 100k names in linear time', () => {
    const names: string[] = [];
    for (let i = 0; i < 50_000; i++) {
      names.push(`Asset-${i}`);
      names.push(`asset_${i}`);
    }
    const groups = groupFilenames(names);
    expect(groups).toHaveLength(50_000);
    expect(groups[0]).toEqual(['Asset-0', 'asset_0']);
    expect(groups[49_999]).toEqual(['Asset-49999', 'asset_49999']);
    for (const group of groups) {
      expect(group).toHaveLength(2);
    }
  });
});
