export interface Spy<Args extends unknown[] = unknown[]> {
  calls: Args[];
  restore(): void;
}

/**
 * Implement a `jest.spyOn`-style spy: wrap `obj[method]`, record its calls while
 * still invoking the original, and expose `restore()` to put the original back.
 */
export function spyOn<T extends object, K extends keyof T>(
  obj: T,
  method: K,
): Spy {
  const originalMethod = obj[method] as unknown as Function;
  const calls: unknown[][] = [];

  (obj as any)[method] = function (this: any, ...args: unknown[]) {
    calls.push(args);
    return originalMethod.apply(this, args);
  };

  return {
    calls,
    restore: () => {
      (obj as any)[method] = originalMethod;
    },
  };
}
