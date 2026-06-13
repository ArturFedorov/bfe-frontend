export interface Lockfile {
  // package name -> resolved version
  [pkg: string]: string;
}

export interface LockfileDiff {
  added: string[];
  removed: string[];
  changed: { name: string; from: string; to: string }[];
}

/** Compare two lockfiles and report added / removed / changed packages. */
export function diffLockfiles(before: Lockfile, after: Lockfile): LockfileDiff {
  // TODO: implement
  throw new Error('Not implemented');
}
