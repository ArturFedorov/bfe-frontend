/**
 * 084. Audience Set Ops — reference solution
 *
 * Approach: every operation is a two-pointer merge over two sorted, unique
 * string arrays. At each step compare a[i] and b[j]:
 *   - equal      → the id is in both       (i++, j++)
 *   - a[i] < b[j] → the id is only in `a`  (i++)
 *   - otherwise  → the id is only in `b`   (j++)
 * Each operation decides which of the three cases it emits and which tails it
 * drains once one side is exhausted:
 *   - union      emits all three cases, drains BOTH tails
 *   - intersect  emits only "equal", drains NEITHER tail
 *   - difference emits only "only in a", drains only `a`'s tail
 *
 * intersectMany sorts the lists by length (smallest first) so the running
 * result can only shrink, and bails out as soon as it becomes empty. With a
 * single list it returns a copy (outputs are always fresh arrays).
 *
 * isSorted is a single pass checking strict `<` on adjacent elements — this
 * doubles as the uniqueness check. Every public operation validates its
 * inputs with it and throws TypeError, because a silently wrong merge on
 * unsorted data is the worst possible failure mode.
 *
 * No hash sets, no linear-scan membership helpers: that is the whole point —
 * two sorted sequences merge in one pass.
 *
 * Time: O(n + m) per binary op; O(total ids) for intersectMany (dominated by
 * validation of every list + the shrinking merges). Space: O(output).
 */

/**
 * `true` when `ids` is strictly increasing in default JavaScript string
 * order (`<`). Duplicates make it false.
 */
export function isSorted(ids: readonly string[]): boolean {
  for (let i = 1; i < ids.length; i++) {
    if (!(ids[i - 1] < ids[i])) return false;
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
  // Drain both tails: whatever is left is in exactly one side, so it belongs.
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
      i++; // present in b → excluded
      j++;
    } else if (a[i] < b[j]) {
      out.push(a[i++]); // only in a → kept
    } else {
      j++; // only in b → irrelevant
    }
  }
  // Drain only a's tail: once b is exhausted nothing else can be excluded.
  while (i < a.length) out.push(a[i++]);
  return out;
}

/**
 * Ids present in every list. Processes smallest list first and exits early
 * when the running result becomes empty. `[]` for no lists.
 * Throws TypeError if any list is not sorted/unique.
 */
export function intersectMany(lists: readonly (readonly string[])[]): string[] {
  lists.forEach((list, k) => assertSorted(list, `lists[${k}]`));
  if (lists.length === 0) return [];

  // Smallest first: the running result is bounded by the smallest list and
  // can only shrink, so later merges touch as few elements as possible.
  const ordered = [...lists].sort((x, y) => x.length - y.length);

  let result: string[] = [...ordered[0]]; // always return a fresh array
  for (let k = 1; k < ordered.length && result.length > 0; k++) {
    result = intersect(result, ordered[k]);
  }
  return result;
}
