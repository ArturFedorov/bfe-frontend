import * as harness from './test_harness';

describe('test_harness', () => {
  it('collects pass and fail results without aborting', () => {
    harness.describe('math', () => {
      harness.it('adds', () => harness.expect(1 + 1).toBe(2));
      harness.it('fails', () => harness.expect(1).toBe(2));
      harness.it('deep equals', () =>
        harness.expect({ a: 1 }).toEqual({ a: 1 }),
      );
    });
    const results = harness.run();
    expect(results).toHaveLength(3);
    expect(results[0].passed).toBe(true);
    expect(results[1].passed).toBe(false);
    expect(results[2].passed).toBe(true);
  });

  it('records descriptive failure messages', () => {
    harness.it('mismatch', () => harness.expect(1).toBe(2));
    const [result] = harness.run();
    expect(result.passed).toBe(false);
    expect(result.error).toContain('to be');
    expect(result.error).toContain('2');
  });

  it('omits error on passing tests', () => {
    harness.it('ok', () => harness.expect('x').toBe('x'));
    const [result] = harness.run();
    expect(result.passed).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('prefixes test names with their suite', () => {
    harness.describe('outer', () => {
      harness.it('inner', () => harness.expect(true).toBe(true));
    });
    const [result] = harness.run();
    expect(result.name).toBe('outer > inner');
  });

  it('nests describe blocks in the test name', () => {
    harness.describe('a', () => {
      harness.describe('b', () => {
        harness.it('c', () => harness.expect(1).toBe(1));
      });
    });
    const [result] = harness.run();
    expect(result.name).toBe('a > b > c');
  });

  it('resets the registry between runs', () => {
    harness.it('first', () => harness.expect(1).toBe(1));
    expect(harness.run()).toHaveLength(1);
    expect(harness.run()).toHaveLength(0);
  });

  it('catches thrown errors as failures', () => {
    harness.it('throws', () => {
      throw new Error('boom');
    });
    const [result] = harness.run();
    expect(result.passed).toBe(false);
    expect(result.error).toBe('boom');
  });

  it('handles non-Error throws', () => {
    harness.it('throws string', () => {
      throw 'nope';
    });
    const [result] = harness.run();
    expect(result.passed).toBe(false);
    expect(result.error).toBe('nope');
  });

  describe('toEqual deep equality', () => {
    it('compares nested objects and arrays', () => {
      harness.it('nested', () =>
        harness.expect({ a: [1, { b: 2 }] }).toEqual({ a: [1, { b: 2 }] }),
      );
      const [result] = harness.run();
      expect(result.passed).toBe(true);
    });

    it('fails on differing nested values', () => {
      harness.it('diff', () =>
        harness.expect({ a: [1, { b: 2 }] }).toEqual({ a: [1, { b: 3 }] }),
      );
      const [result] = harness.run();
      expect(result.passed).toBe(false);
    });

    it('fails when key counts differ', () => {
      harness.it('extra key', () =>
        harness.expect({ a: 1 }).toEqual({ a: 1, b: 2 }),
      );
      const [result] = harness.run();
      expect(result.passed).toBe(false);
    });

    it('distinguishes arrays from objects', () => {
      harness.it('array vs object', () => harness.expect([]).toEqual({}));
      const [result] = harness.run();
      expect(result.passed).toBe(false);
    });
  });

  describe('toBe strict equality', () => {
    it('fails for structurally equal but distinct objects', () => {
      harness.it('ref', () => harness.expect({}).toBe({}));
      const [result] = harness.run();
      expect(result.passed).toBe(false);
    });

    it('treats NaN as equal to itself', () => {
      harness.it('nan', () => harness.expect(NaN).toBe(NaN));
      const [result] = harness.run();
      expect(result.passed).toBe(true);
    });
  });
});
