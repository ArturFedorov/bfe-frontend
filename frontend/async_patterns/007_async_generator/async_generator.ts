export async function* streamData<T>(
  fetcher: () => Promise<{ data: T[]; done: boolean }>,
): AsyncGenerator<T> {
  while (true) {
    const { data, done } = await fetcher();

    for (const task of data) {
      yield task;
    }

    if (done) return;
  }
}
