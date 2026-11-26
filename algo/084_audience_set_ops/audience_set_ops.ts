/**
 * `true` when `ids` is strictly increasing in default JavaScript string
 * order (`<`). Duplicates make it false.
 */
export function isSorted(ids: readonly string[]): boolean {
  for (let i = 0; i < ids.length; i++) {
    let next = Math.min(i + 1, ids.length);
    if (ids[next] <= ids[i]) return false;
  }

  return true;
}

function assertSorted(ids: readonly string[], label: string): void {
  if (!isSorted(ids)) {
    throw new TypeError(
      `${label} must be a sorted, de-duplicated array of ids`,
    );
  }
}

/** Ids in `a` or `b`. Throws TypeError if either input is not sorted/unique. */
export function union(a: readonly string[], b: readonly string[]): string[] {
  assertSorted(a, 'a');
  assertSorted(b, 'b');

  const out: string[] = [];
  let i = 0;
  let j = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      out.push(a[i]);
      i++;
      j++;
    } else if (a[i] < b[j]) {
      out.push(a[i++]);
    } else {
      out.push(b[j++]);
    }
  }

  while (i < a.length) out.push(a[i++]);
  while (j < b.length) out.push(b[j++]);
  return out;
}

/** Ids in both `a` and `b`. Throws TypeError if either input is not sorted/unique. */
export function intersect(
  a: readonly string[],
  b: readonly string[],
): string[] {
  assertSorted(a, 'a');
  assertSorted(b, 'b');

  const out: string[] = [];
  let i = 0;
  let j = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      out.push(a[i]);
      i++;
      j++;
    } else if (a[i] < b[j]) {
      i++;
    } else {
      j++;
    }
  }
  // Drain nothing: a leftover tail cannot be in both.
  return out;
}

/** Ids in `a` that are not in `b`. Throws TypeError if either input is not sorted/unique. */
export function difference(
  a: readonly string[],
  b: readonly string[],
): string[] {
  assertSorted(a, 'a');
  assertSorted(b, 'b');

  const out: string[] = [];
  let i = 0;
  let j = 0;

  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      i++;
      j++;
    } else if (a[i] < b[j]) {
      out.push(a[i++]);
    } else {
      j++;
    }
  }

  while (i < a.length) out.push(a[i++]);
  return out;
}

/**
 * Ids present in every list. Processes smallest list first and exits early
 * when the running result becomes empty. `[]` for no lists.
 * Throws TypeError if any list is not sorted/unique.
 */
export function intersectMany(lists: readonly (readonly string[])[]): string[] {
  lists.forEach((list, k) => assertSorted(list, `list ${k}`));
  if (lists.length === 0) return [];

  const ordered = [...lists].sort((x, y) => x.length - y.length);

  let result: string[] = [...ordered[0]];
  for (let k = 1; k < ordered.length; k++) {
    result = intersect(result, ordered[k]);
  }

  return result;
}
