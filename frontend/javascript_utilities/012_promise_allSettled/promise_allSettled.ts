export function promiseAllSettled<T>(
  promises: (T | Promise<T>)[],
): Promise<
  Array<{ status: 'fulfilled'; value: T } | { status: 'rejected'; reason: any }>
> {
  return new Promise(() => {});
}
