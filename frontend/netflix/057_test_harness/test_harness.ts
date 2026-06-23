export interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
}

export interface Matchers {
  toBe(expected: unknown): void;
  toEqual(expected: unknown): void;
}

/**
 * Minimal test harness. `describe`/`it` register suites and tests; `expect`
 * returns matchers; `run` executes everything and returns per-test results,
 * collecting failures instead of throwing.
 */
export function expect(actual: unknown): Matchers {
  // TODO: implement
  throw new Error('Not implemented');
}

export function describe(name: string, fn: () => void): void {
  // TODO: implement
  throw new Error('Not implemented');
}

export function it(name: string, fn: () => void): void {
  // TODO: implement
  throw new Error('Not implemented');
}

/** Run all registered suites and return their results. */
export function run(): TestResult[] {
  // TODO: implement
  throw new Error('Not implemented');
}
