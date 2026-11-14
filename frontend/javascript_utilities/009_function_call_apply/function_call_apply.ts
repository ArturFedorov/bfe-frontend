export function myCall(fn: Function, thisArg: any, ...args: any[]): any {
  const context = thisArg === null ? globalThis : Object(thisArg);
  const key = Symbol('myCall');

  context[key] = fn;

  try {
    return context[key](...args);
  } finally {
    delete context[key];
  }
}

export function myApply(fn: Function, thisArg: any, args?: any[]): any {
  return myCall(fn, thisArg, ...(args ?? []));
}
