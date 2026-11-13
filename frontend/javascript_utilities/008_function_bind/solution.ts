/**
 * Reference solution for 008 — Function.prototype.bind from scratch.
 *
 * Returns a new function that invokes `fn` with `this` fixed to `thisArg` and
 * `boundArgs` prepended to the call-time arguments (partial application).
 *
 * Bonus fidelity to the native bind: when the bound function is invoked with
 * `new`, the bound `this` is ignored and the freshly constructed instance is
 * used instead, with the prototype chain pointing at `fn.prototype`.
 */
export function myBind(
  fn: Function,
  thisArg: any,
  ...boundArgs: any[]
): (...args: any[]) => any {
  // Must be a `function` (not an arrow) so it has its own `this` and can be
  // detected as a construction target via `instanceof`.
  function boundFn(this: any, ...callArgs: any[]) {
    // `new boundFn()` → `this` is the new instance → use it instead of thisArg.
    const context = this instanceof boundFn ? this : thisArg;
    return fn.apply(context, [...boundArgs, ...callArgs]);
  }

  // Let instances created via `new boundFn()` inherit from fn.prototype
  // (arrow functions / already-bound functions have no prototype — guard it).
  if (fn.prototype) {
    boundFn.prototype = Object.create(fn.prototype);
  }

  return boundFn;
}
