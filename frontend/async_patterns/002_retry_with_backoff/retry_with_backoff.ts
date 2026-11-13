export function retry<T>(
  fn: () => Promise<T>,
  options: { retries: number; initialDelay: number; factor?: number },
): Promise<T> {
  return new Promise(() => {});
}
