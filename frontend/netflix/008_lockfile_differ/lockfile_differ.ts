export interface Lockfile {
  // package name -> resolved version
  [pkg: string]: string;
}

export interface LockfileDiff {
  added: string[];
  removed: string[];
  changed: { name: string; from: string; to: string }[];
}

/** Compare two lock files and report added / removed / changed packages. */
export function diffLockFiles(before: Lockfile, after: Lockfile): LockfileDiff {
  const beforeKeys = Object.keys(before);
  const afterKeys = Object.keys(after);
  const result: LockfileDiff = {
    added: [],
    removed: [],
    changed: [],
  };

  let keys = [...new Set([...beforeKeys, ...afterKeys])];

  for (const key of keys) {
    const isAdded = !(key in before) && key in after;
    const isRemoved = key in before && !(key in after);
    const hasBoth = key in before && key in after;
    const hasChanged = hasBoth && before[key] !== after[key];

    if (isAdded) {
      result.added.push(key);
    }

    if (isRemoved) {
      result.removed.push(key);
    }

    if (hasChanged) {
      result.changed.push({
        name: key,
        from: before[key],
        to: after[key],
      });
    }
  }

  return result;
}
