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
  // TODO: implement
  throw new Error('Not implemented');
}
