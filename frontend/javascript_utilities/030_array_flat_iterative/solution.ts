/**
 * Iterative `Array.prototype.flat`.
 *
 * Each stack frame is `[value, remainingDepth]`. The input is pushed in
 * reverse so the LIFO stack pops elements in their original left-to-right
 * order. Popping an array with `remainingDepth > 0` pushes its children
 * (again reversed) with `remainingDepth - 1`; anything else is emitted.
 *
 * `Infinity - 1 === Infinity`, so depth Infinity flattens completely with no
 * special casing. Depth 0 copies the top level untouched. Holes are skipped,
 * like the native method.
 */
export function flatIterative(arr: any[], depth: number = 1): any[] {
  const result: any[] = [];
  const stack: Array<[any, number]> = [];

  // Seed stack in reverse so index 0 is on top.
  for (let i = arr.length - 1; i >= 0; i--) {
    if (i in arr) stack.push([arr[i], depth]);
  }

  while (stack.length > 0) {
    const [value, remaining] = stack.pop()!;

    if (Array.isArray(value) && remaining > 0) {
      for (let i = value.length - 1; i >= 0; i--) {
        if (i in value) stack.push([value[i], remaining - 1]);
      }
    } else {
      result.push(value);
    }
  }

  return result;
}
