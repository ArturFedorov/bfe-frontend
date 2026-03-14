export function myBind(
  fn: Function,
  thisArg: any,
  ...boundArgs: any[]
): (...args: any[]) => any {
  return function () {};
}
