export interface SnapshotStore {
  [key: string]: string;
}

export interface SnapshotResult {
  pass: boolean;
  stored: boolean; // true if this run wrote a new snapshot
  diff?: string;
}

const serialize = (value: unknown): string => {
  try {
    return JSON.stringify(value, Object.keys(value as object).sort());
  } catch {
    return '';
  }
};

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
  const valueStored = Boolean(store[key]);
  const updateRequired = Boolean(options?.update);

  if (updateRequired) {
    store[key] = serialize(value);

    return {
      pass: true,
      stored: true,
    };
  }

  if (valueStored) {
    const serialized = serialize(value);
    const isEqual = store[key] === serialized;

    return {
      pass: isEqual,
      stored: false,
      ...(isEqual
        ? {}
        : { diff: `Expected: ${store[key]}\nReceived: ${serialized}` }),
    };
  }

  store[key] = serialize(value);

  return {
    pass: true,
    stored: true,
  };
}
