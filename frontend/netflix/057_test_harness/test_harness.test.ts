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
});
