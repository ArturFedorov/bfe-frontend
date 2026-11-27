/** Returns x raised to the integer power n, in O(log n) multiplications. */
export function myPow(x: number, n: number): number {
  // Binary exponentiation: square the base, multiply it in for every set bit of |n|.
  let base = n < 0 ? 1 / x : x;
  let exp = Math.abs(n);
  let result = 1;
  while (exp > 0) {
    if (exp % 2 === 1) result *= base;
    base *= base;
    exp = Math.floor(exp / 2);
  }
  return result;
}
