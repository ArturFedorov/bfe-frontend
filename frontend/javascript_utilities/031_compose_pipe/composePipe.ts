export type AnyFn = (...args: any[]) => any;

export function compose(...fns: AnyFn[]): AnyFn {
  return function () {} as any;
}

export function pipe(...fns: AnyFn[]): AnyFn {
  return function () {} as any;
}
