export type AnyFn = (...args: any[]) => any;

/**
 * Left-to-right composition: `pipe(f, g, h)(...args)` is `h(g(f(...args)))`.
 *
 * - The first function receives every argument of the call.
 * - Each following function receives exactly one argument: the previous
 *   return value. An array result is passed as one array, never spread.
 * - With no functions the result is an identity on the first argument.
 */
export function pipe(...fns: AnyFn[]): AnyFn {
  if (fns.length === 0) {
    return (value: unknown) => value;
  }

  const [first, ...rest] = fns;

  return (...args: unknown[]) =>
    rest.reduce((acc, fn) => fn(acc), first(...args));
}

/**
 * Right-to-left composition: `compose(f, g, h)(...args)` is `f(g(h(...args)))`.
 *
 * Implemented by reversing the list and delegating to `pipe`, so the two share
 * one set of rules (variadic first call, unary afterwards, identity on empty).
 */
export function compose(...fns: AnyFn[]): AnyFn {
  return pipe(...[...fns].reverse());
}
