/**
 * Placeholder marker. A symbol cannot collide with any real argument value.
 */
export const _: unique symbol = Symbol('partial.placeholder');

/**
 * Fixes leading arguments of `fn`. Each `_` in `presetArgs` is a gap that is
 * filled, left to right, from the call-time arguments; leftover call-time
 * arguments are appended after the presets.
 *
 * - A gap with nothing to fill it becomes `undefined` (same as lodash).
 * - `presetArgs` is never mutated, so the returned function is reusable.
 * - `this` from the call is forwarded to `fn`.
 */
export function partial<T extends (...args: any[]) => any>(
  fn: T,
  ...presetArgs: unknown[]
): (...args: unknown[]) => ReturnType<T> {
  return function (this: unknown, ...callArgs: unknown[]): ReturnType<T> {
    let next = 0;

    // Build a fresh argument list: presets with placeholders filled in order.
    const finalArgs = presetArgs.map((preset) =>
      preset === _ ? callArgs[next++] : preset,
    );

    // Anything the placeholders did not consume goes on the end.
    finalArgs.push(...callArgs.slice(next));

    return fn.apply(this, finalArgs);
  };
}
