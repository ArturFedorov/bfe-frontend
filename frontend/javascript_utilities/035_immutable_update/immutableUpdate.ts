export type Path = (string | number)[];

export function getIn<T = unknown>(
  obj: unknown,
  path: Path,
  defaultValue?: T,
): T | undefined {
  return undefined as any;
}

export function setIn<T>(obj: T, path: Path, value: unknown): T {
  return {} as T;
}

export function updateIn<T>(
  obj: T,
  path: Path,
  updater: (current: unknown) => unknown,
): T {
  return {} as T;
}
