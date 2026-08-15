/**
 * Returns the length of the shortest contiguous run of transfers whose
 * total size is >= `cap`, or 0 if no run ever reaches the cap.
 *
 * @param transfers - transfer sizes in MB, in order; all positive integers
 * @param cap - the bandwidth cap to reach (positive integer)
 * @returns the minimal burst length, or 0 when the cap is never reached
 */
export function bandwidthBurst(transfers: number[], cap: number): number {
  // TODO: implement
  throw new Error('Not implemented');
}
