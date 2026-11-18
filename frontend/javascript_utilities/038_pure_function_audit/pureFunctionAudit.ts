export interface PureCallReport {
  deterministic: boolean;
  mutatesArgs: boolean;
  results: unknown[];
}

export function isPureCall<A extends unknown[]>(
  fn: (...args: A) => unknown,
  args: A,
  options?: { runs?: number },
): PureCallReport {
  return {} as PureCallReport;
}

export function memoizePure<T extends (...args: any[]) => any>(fn: T): T {
  return function () {} as any;
}
