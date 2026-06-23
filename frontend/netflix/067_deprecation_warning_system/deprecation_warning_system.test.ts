import { deprecate, reset } from './deprecation_warning_system';

describe('deprecate', () => {
  beforeEach(() => reset());

  it('warns once then delegates', () => {
    const logs: string[] = [];
    const add = deprecate(
      (a: number, b: number) => a + b,
      'use sum() instead',
      (m) => logs.push(m),
    );
    expect(add(1, 2)).toBe(3);
    expect(add(3, 4)).toBe(7);
    expect(logs).toEqual(['use sum() instead']);
  });
});
