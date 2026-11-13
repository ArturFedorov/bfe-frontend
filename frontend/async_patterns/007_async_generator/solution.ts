/**
 * Reference solution for 007 — async generator over a batched fetcher.
 *
 * `streamData` turns a "give me the next batch" API into a flat stream of
 * items that the consumer can `for await` over. Each `yield` suspends the
 * generator until the consumer asks for the next item, so the next batch is
 * only fetched when the current one is exhausted (lazy, back-pressured).
 *
 * Errors thrown by `fetcher` propagate out of `next()` and therefore out of
 * the consumer's `for await` loop — no special handling needed.
 */
export async function* streamData<T>(
  fetcher: () => Promise<{ data: T[]; done: boolean }>,
): AsyncGenerator<T> {
  while (true) {
    const { data, done } = await fetcher();

    // Yield the batch item by item (also for the final batch where done=true).
    for (const item of data) {
      yield item;
    }

    if (done) return; // `return` ends the stream: for-await exits cleanly
  }
}
