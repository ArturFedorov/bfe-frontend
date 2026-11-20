export interface LogEntry {
  timestamp: number;
  message: string;
}

export function mergeSortedLogs(a: LogEntry[], b: LogEntry[]): LogEntry[] {
  const result: LogEntry[] = [];
  let i = 0;
  let j = 0;

  while (i < a.length && j < b.length) {
    // <= keeps entries from `a` first on equal timestamps.
    if (a[i].timestamp <= b[j].timestamp) result.push(a[i++]);
    else result.push(b[j++]);
  }

  while (i < a.length) result.push(a[i++]);
  while (j < b.length) result.push(b[j++]);

  return result;
}
