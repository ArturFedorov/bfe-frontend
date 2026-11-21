export interface LogEntry {
  timestamp: number;
  message: string;
}

/**
 * Merges two timestamp-sorted log files into one sorted timeline.
 *
 * Stable across inputs: on equal timestamps, entries from `a` come before
 * entries from `b`, and entries from the same file keep their relative order.
 * Inputs are not mutated.
 *
 * @param a - first log file, sorted by timestamp ascending
 * @param b - second log file, sorted by timestamp ascending
 * @returns a new merged array sorted by timestamp ascending
 */
export function mergeSortedLogs(a: LogEntry[], b: LogEntry[]): LogEntry[] {
  const mergedLogs: LogEntry[] = [];

  let i = 0;
  let j = 0;

  while(i < a.length && j < b.length) {
    if(a[i].timestamp <= b[j].timestamp) mergedLogs.push(a[i++]);
    else mergedLogs.push(b[j++]);
  }

  while(i < a.length) mergedLogs.push(a[i++]);
  while (j < b.length) mergedLogs.push(b[j++]);

  return mergedLogs;
}
