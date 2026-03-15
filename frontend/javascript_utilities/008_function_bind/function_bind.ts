export function myBind(
  fn: Function,
  thisArg: any,
  ...boundArgs: any[]
): (...args: any[]) => any {
  function boundFn(this: any, ...newArgs: any[]) {
    const context = this instanceof boundFn ? this : thisArg;
    return fn.apply(context, [...boundArgs, ...newArgs]);
  }

  boundFn.prototype = Object.create(fn.prototype);

  return boundFn;
}
