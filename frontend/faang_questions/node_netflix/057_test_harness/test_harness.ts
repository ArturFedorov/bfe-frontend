export interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
}

export interface Matchers {
  toBe(expected: unknown): void;
  toEqual(expected: unknown): void;
}

interface RegisteredTest {
  name: string;
  fn: () => void;
}

const registry: RegisteredTest[] = [];
const suiteStack: string[] = [];

function deepEqual(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true;

  if (
    typeof a !== 'object' ||
    typeof b !== 'object' ||
    a === null ||
    b === null
  ) {
    return false;
  }

  if (Array.isArray(a) !== Array.isArray(b)) return false;

  const aKeys = Object.keys(a as object);
  const bKeys = Object.keys(b as object);

  if (aKeys.length !== bKeys.length) return false;

  return aKeys.every(
    (key) =>
      Object.prototype.hasOwnProperty.call(b, key) &&
      deepEqual(
        (a as Record<string, unknown>)[key],
        (b as Record<string, unknown>)[key],
      ),
  );
}

function stringify(value: unknown): string {
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

/**
 * Minimal test harness. `describe`/`it` register suites and tests; `expect`
 * returns matchers; `run` executes everything and returns per-test results,
 * collecting failures instead of throwing.
 */
export function expect(actual: unknown): Matchers {
  return {
    toBe(expected: unknown): void {
      if (!Object.is(actual, expected)) {
        throw new Error(
          `expected ${stringify(actual)} to be ${stringify(expected)}`,
        );
      }
    },
    toEqual(expected: unknown): void {
      if (!deepEqual(actual, expected)) {
        throw new Error(
          `expected ${stringify(actual)} to equal ${stringify(expected)}`,
        );
      }
    },
  };
}

export function describe(name: string, fn: () => void): void {
  suiteStack.push(name);
  try {
    fn();
  } finally {
    suiteStack.pop();
  }
}

export function it(name: string, fn: () => void): void {
  const fullName = [...suiteStack, name].join(' > ');
  registry.push({ name: fullName, fn });
}

/** Run all registered suites and return their results. */
export function run(): TestResult[] {
  const results: TestResult[] = registry.map(({ name, fn }) => {
    try {
      fn();
      return { name, passed: true };
    } catch (err) {
      return {
        name,
        passed: false,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  });
  registry.length = 0;

  return results;
}
