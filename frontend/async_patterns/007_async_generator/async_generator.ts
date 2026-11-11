export async function* streamData<T>(
  fetcher: () => Promise<{ data: T[]; done: boolean }>,
): AsyncGenerator<T> {
  while (true) {
    const { data, done } = await fetcher();

    yield* data;
    if (done) return;
  }
}
