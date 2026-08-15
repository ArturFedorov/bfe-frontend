export interface OutageInput {
  /** server id, or null for an empty slot that blocks the cascade */
  grid: (string | null)[][];
  /** ids of servers already failed at minute 0 */
  initialFailures: string[];
}

export interface OutageResult {
  /** minute of the last new infection; 0 if nothing new is infected */
  minutes: number;
  /** ids of servers never affected, sorted alphabetically */
  unaffected: string[];
}

export function outageSpread(input: OutageInput): OutageResult {
  // TODO: implement
  throw new Error('Not implemented');
}
