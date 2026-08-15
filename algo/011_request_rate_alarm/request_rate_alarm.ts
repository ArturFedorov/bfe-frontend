/**
 * Sliding 60-second request counter — the bookkeeping core of a
 * sliding-window rate limiter.
 *
 * `record(t)` registers a request at timestamp `t` (milliseconds,
 * non-decreasing) and returns how many recorded requests fall in the
 * window `(t - 60_000, t]`, including this one.
 *
 * Memory must stay proportional to the requests currently inside the
 * window, not to the total history.
 */
export class RequestRateAlarm {
  /**
   * @param timestampMs - request time in ms; must be >= the previous timestamp
   * @returns the number of requests in the window `(timestampMs - 60_000, timestampMs]`
   * @throws Error when timestamps go backwards
   */
  record(timestampMs: number): number {
    // TODO: implement
    throw new Error('Not implemented');
  }
}
