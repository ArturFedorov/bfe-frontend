export interface SnapshotStore {
  [key: string]: string;
}

export interface SnapshotResult {
  pass: boolean;
  stored: boolean; // true if this run wrote a new snapshot
  diff?: string;
}

/**
 * Implement `toMatchSnapshot`: serialize `value`, store it under `key` on first
 * run, then compare on later runs. With `update` set, overwrite instead.
 */
export function toMatchSnapshot(
  store: SnapshotStore,
  key: string,
  value: unknown,
  options?: { update?: boolean },
): SnapshotResult {
  // TODO: implement
  throw new Error('Not implemented');
}
