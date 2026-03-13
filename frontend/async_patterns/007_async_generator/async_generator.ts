export async function* streamData<T>(fetcher: () => Promise<{ data: T[]; done: boolean }>): AsyncGenerator<T> {
}
