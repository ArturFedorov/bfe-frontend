import { myPow } from './pow_x_n';

describe('myPow', () => {
  it('2^10 = 1024', () => {
    expect(myPow(2, 10)).toBeCloseTo(1024, 6);
  });

  it('2.1^3 = 9.261', () => {
    expect(myPow(2.1, 3)).toBeCloseTo(9.261, 6);
  });

  it('negative exponent: 2^-2 = 0.25', () => {
    expect(myPow(2, -2)).toBeCloseTo(0.25, 10);
  });

  it('n = 0 gives 1', () => {
    expect(myPow(5, 0)).toBe(1);
    expect(myPow(-3.7, 0)).toBe(1);
  });

  it('n = 1 gives x', () => {
    expect(myPow(-7.5, 1)).toBeCloseTo(-7.5, 10);
  });

  it('negative base with odd and even exponents', () => {
    expect(myPow(-2, 3)).toBeCloseTo(-8, 10);
    expect(myPow(-2, 4)).toBeCloseTo(16, 10);
    expect(myPow(-2, -3)).toBeCloseTo(-0.125, 10);
  });

  it('base 1 and -1 with huge exponents', () => {
    expect(myPow(1, 2147483647)).toBeCloseTo(1, 10);
    expect(myPow(-1, 2147483647)).toBeCloseTo(-1, 10);
    expect(myPow(-1, -2147483648)).toBeCloseTo(1, 10);
  });

  it('fractional base', () => {
    expect(myPow(0.5, 10)).toBeCloseTo(0.0009765625, 12);
    expect(myPow(0.5, -10)).toBeCloseTo(1024, 6);
  });

  it('matches Math.pow on a range of inputs', () => {
    for (const x of [1.5, -1.1, 3, 0.9]) {
      for (const n of [7, 13, -5, 20]) {
        expect(myPow(x, n)).toBeCloseTo(Math.pow(x, n), 6);
      }
    }
  });

  it('huge exponents in logarithmic time (underflow to 0)', () => {
    expect(myPow(2, -2147483648)).toBeCloseTo(0, 10);
    expect(myPow(0.99999, 2147483647)).toBeCloseTo(0, 10);
    expect(
      myPow(1.0000001, 2147483647) / Math.pow(1.0000001, 2147483647),
    ).toBeCloseTo(1, 4);
  });
});
