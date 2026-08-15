import { mergeSortedLogs, LogEntry } from './merge_sorted_logs';

const entry = (timestamp: number, message: string): LogEntry => ({ timestamp, message });

describe('mergeSortedLogs', () => {
  it('interleaves two sorted files by timestamp', () => {
    const a = [entry(1, 'a1'), entry(5, 'a5'), entry(9, 'a9')];
    const b = [entry(3, 'b3'), entry(7, 'b7')];
    expect(mergeSortedLogs(a, b)).toEqual([
      entry(1, 'a1'),
      entry(3, 'b3'),
      entry(5, 'a5'),
      entry(7, 'b7'),
      entry(9, 'a9'),
    ]);
  });

  it('puts entries from the first file before equal-timestamp entries from the second', () => {
    const a = [entry(2, 'a2'), entry(5, 'a5')];
    const b = [entry(2, 'b2'), entry(5, 'b5')];
    expect(mergeSortedLogs(a, b)).toEqual([
      entry(2, 'a2'),
      entry(2, 'b2'),
      entry(5, 'a5'),
      entry(5, 'b5'),
    ]);
  });

  it('preserves relative order of repeated timestamps within one file', () => {
    const a = [entry(4, 'first'), entry(4, 'second'), entry(4, 'third')];
    const b = [entry(4, 'other')];
    expect(mergeSortedLogs(a, b)).toEqual([
      entry(4, 'first'),
      entry(4, 'second'),
      entry(4, 'third'),
      entry(4, 'other'),
    ]);
  });

  it('returns the other file when one is empty', () => {
    const b = [entry(1, 'b1'), entry(2, 'b2')];
    expect(mergeSortedLogs([], b)).toEqual([entry(1, 'b1'), entry(2, 'b2')]);
    expect(mergeSortedLogs(b, [])).toEqual([entry(1, 'b1'), entry(2, 'b2')]);
  });

  it('returns an empty array when both files are empty', () => {
    expect(mergeSortedLogs([], [])).toEqual([]);
  });

  it('handles one file ending entirely before the other begins', () => {
    const a = [entry(1, 'a1'), entry(2, 'a2')];
    const b = [entry(10, 'b10'), entry(11, 'b11')];
    expect(mergeSortedLogs(a, b)).toEqual([
      entry(1, 'a1'),
      entry(2, 'a2'),
      entry(10, 'b10'),
      entry(11, 'b11'),
    ]);
  });

  it('handles single-entry files', () => {
    expect(mergeSortedLogs([entry(5, 'a')], [entry(3, 'b')])).toEqual([
      entry(3, 'b'),
      entry(5, 'a'),
    ]);
  });

  it('does not mutate the input arrays', () => {
    const a = [entry(1, 'a1'), entry(3, 'a3')];
    const b = [entry(2, 'b2')];
    mergeSortedLogs(a, b);
    expect(a).toEqual([entry(1, 'a1'), entry(3, 'a3')]);
    expect(b).toEqual([entry(2, 'b2')]);
  });

  it('merges 100_000 + 100_000 entries in linear time', () => {
    const n = 100_000;
    const a: LogEntry[] = [];
    const b: LogEntry[] = [];
    for (let i = 0; i < n; i++) {
      a.push(entry(i * 2, `a${i}`));
      b.push(entry(i * 2 + 1, `b${i}`));
    }
    const merged = mergeSortedLogs(a, b);
    expect(merged).toHaveLength(2 * n);
    expect(merged[0]).toEqual(entry(0, 'a0'));
    expect(merged[2 * n - 1]).toEqual(entry(2 * n - 1, `b${n - 1}`));
    for (let i = 1; i < merged.length; i++) {
      expect(merged[i].timestamp).toBeGreaterThanOrEqual(merged[i - 1].timestamp);
    }
  });
});
