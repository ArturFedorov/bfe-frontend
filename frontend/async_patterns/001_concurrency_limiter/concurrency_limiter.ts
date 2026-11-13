export function asyncPool<T>(
  limit: number,
  tasks: (() => Promise<T>)[],
): Promise<T[]> {
  return new Promise(() => {});
}
