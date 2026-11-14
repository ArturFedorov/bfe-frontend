export function curry(fn: Function): Function {
  const arity = fn.length;

  return function curried(this: any, ...args: any[]): any {
    if (args.length >= arity) {
      return fn.apply(this, args);
    }

    return (...rest: any[]) => curried.apply(this, [...args, ...rest]);
  };
}
