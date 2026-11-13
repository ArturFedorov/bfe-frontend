/**
 * Reference solution for 009 — Function.prototype.call / apply from scratch.
 *
 * Trick: `this` inside a function is determined by how it is invoked, so we
 * temporarily attach `fn` as a method of `thisArg`, invoke it as
 * `thisArg[key](...)`, and remove it afterwards. A unique Symbol key avoids
 * clobbering existing properties, and `try/finally` guarantees cleanup even
 * if `fn` throws.
 */
export function myCall(fn: Function, thisArg: any, ...args: any[]): any {
  // null/undefined → global object (sloppy-mode semantics per the README);
  // primitives are boxed so a property can be attached to them.
  const context: any = thisArg == null ? globalThis : Object(thisArg);
  const key = Symbol('myCall');

  context[key] = fn;
  try {
    return context[key](...args);
  } finally {
    // Never leave a trace on the caller's object.
    delete context[key];
  }
}

export function myApply(fn: Function, thisArg: any, args?: any[]): any {
  // apply is call with the arguments supplied as an (optional) array.
  return myCall(fn, thisArg, ...(args ?? []));
}
