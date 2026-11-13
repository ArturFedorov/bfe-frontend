/**
 * Transforms `fn` into a curried function: arguments may be supplied in any
 * grouping across successive calls, and `fn` is invoked as soon as at least
 * `fn.length` arguments have been accumulated.
 *
 * `fn.length` counts declared parameters before the first default/rest param,
 * so a zero-arity function is invoked on the very first call.
 *
 * `this` from the final call is forwarded to `fn`.
 */
export function curry(fn: Function): Function {
  const arity = fn.length;

  return function curried(this: any, ...args: any[]): any {
    if (args.length >= arity) {
      return fn.apply(this, args);
    }

    // Not enough arguments yet: return a collector that prepends what we have.
    return (...rest: any[]) => curried.apply(this, [...args, ...rest]);
  };
}
