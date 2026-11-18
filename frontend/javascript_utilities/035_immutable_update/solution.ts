export type Path = (string | number)[];

/**
 * Reads `path` from `obj`. Returns `defaultValue` if any step is
 * `null`/`undefined`, or if the final value is `undefined`.
 */
export function getIn<T = unknown>(
  obj: unknown,
  path: Path,
  defaultValue?: T,
): T | undefined {
  let current: any = obj;

  for (const key of path) {
    if (current === null || current === undefined) {
      return defaultValue;
    }

    current = current[key];
  }

  return current === undefined ? defaultValue : current;
}

/**
 * Shallow-copies a container, preserving its array-ness. A missing container
 * is created based on the key that will be written into it: numeric keys get
 * an array, string keys a plain object.
 */
function copyContainer(current: unknown, nextKey: string | number): any {
  if (Array.isArray(current)) {
    return current.slice();
  }

  if (current !== null && typeof current === 'object') {
    return { ...(current as object) };
  }

  return typeof nextKey === 'number' ? [] : {};
}

/**
 * Returns a new root with `value` written at `path`. Only containers on the
 * path are copied; every other reference is shared with the input, which is
 * never mutated.
 */
export function setIn<T>(obj: T, path: Path, value: unknown): T {
  if (path.length === 0) {
    return value as T;
  }

  const [head, ...rest] = path;
  const copy = copyContainer(obj, head);

  // Recurse into the child first, then assign into our fresh copy.
  copy[head] = setIn((obj as any)?.[head], rest, value);

  return copy;
}

/**
 * Like `setIn`, but the new value is derived from the current one. A missing
 * path yields `updater(undefined)`.
 */
export function updateIn<T>(
  obj: T,
  path: Path,
  updater: (current: unknown) => unknown,
): T {
  return setIn(obj, path, updater(getIn(obj, path)));
}
