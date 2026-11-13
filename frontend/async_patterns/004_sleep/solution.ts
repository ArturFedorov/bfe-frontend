/**
 * Reference solution for 004 — sleep.
 *
 * Promise-wrapped `setTimeout`: `await sleep(ms)` pauses an async function
 * for `ms` milliseconds. `setTimeout(resolve, ms)` calls resolve with no
 * argument, which is exactly what `Promise<void>` wants.
 */
export function sleep(ms: number): Promise<void> {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}
