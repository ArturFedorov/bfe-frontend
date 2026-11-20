/**
 * 080. Request Batcher — reference solution
 *
 * The open batch is a Map from key to the callers waiting on it (Map keeps
 * first-insertion order and deduplicates). The first key arms a maxWaitMs
 * timer; reaching maxSize unique keys flushes immediately and clears it.
 * Flushing detaches the batch before calling batchFn, so later calls start a
 * fresh batch even while the previous one is in flight.
 */
export interface BatcherOptions {
  /** Flush a batch this many ms after it opens (unless size flushes it first). */
  maxWaitMs: number;
  /** Flush immediately once a batch holds this many unique keys. */
  maxSize: number;
}

/** Bulk endpoint: receives unique keys in first-call order, returns values by key. */
export type BatchFn<K, V> = (keys: K[]) => Promise<Map<K, V>>;

/** Single-key loader returned by createBatcher. */
export type Loader<K, V> = (key: K) => Promise<V>;

interface Pending<V> {
  resolve: (value: V) => void;
  reject: (reason: unknown) => void;
}

export function createBatcher<K, V>(
  batchFn: BatchFn<K, V>,
  options: BatcherOptions,
): Loader<K, V> {
  const { maxWaitMs, maxSize } = options;
  let batch = new Map<K, Pending<V>[]>();
  let timer: ReturnType<typeof setTimeout> | null = null;

  const flush = (): void => {
    if (timer !== null) {
      clearTimeout(timer);
      timer = null;
    }
    const current = batch;
    batch = new Map();

    const fail = (error: unknown): void => {
      for (const waiters of current.values()) {
        for (const w of waiters) w.reject(error);
      }
    };

    let result: Promise<Map<K, V>>;
    try {
      result = Promise.resolve(batchFn([...current.keys()]));
    } catch (error) {
      fail(error);
      return;
    }

    result.then((values) => {
      for (const [key, waiters] of current) {
        if (values.has(key)) {
          const value = values.get(key) as V;
          for (const w of waiters) w.resolve(value);
        } else {
          const error = new Error(`No result for key "${String(key)}"`);
          for (const w of waiters) w.reject(error);
        }
      }
    }, fail);
  };

  return (key: K) =>
    new Promise<V>((resolve, reject) => {
      const waiters = batch.get(key);
      if (waiters) {
        waiters.push({ resolve, reject });
        return;
      }

      batch.set(key, [{ resolve, reject }]);
      if (batch.size >= maxSize) {
        flush();
      } else if (timer === null) {
        timer = setTimeout(flush, maxWaitMs);
      }
    });
}
