export const _: unique symbol = Symbol('partial.placeholder');

export function partial<T extends (...args: any[]) => any>(
  fn: T,
  ...presetArgs: unknown[]
): (...args: unknown[]) => ReturnType<T> {
  return function () {} as any;
}
