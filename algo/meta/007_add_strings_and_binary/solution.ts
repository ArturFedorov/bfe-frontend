function addInBase(a: string, b: string, base: number): string {
  // Right-to-left digit addition with carry; build reversed, flip once.
  const digits: number[] = [];
  let i = a.length - 1;
  let j = b.length - 1;
  let carry = 0;
  while (i >= 0 || j >= 0 || carry > 0) {
    const sum =
      (i >= 0 ? a.charCodeAt(i--) - 48 : 0) +
      (j >= 0 ? b.charCodeAt(j--) - 48 : 0) +
      carry;
    digits.push(sum % base);
    carry = Math.floor(sum / base);
  }
  return digits.reverse().join('');
}

/** Returns the sum of two non-negative base-10 integers given as strings. */
export function addStrings(a: string, b: string): string {
  return addInBase(a, b, 10);
}

/** Returns the sum of two non-negative base-2 integers given as strings. */
export function addBinary(a: string, b: string): string {
  return addInBase(a, b, 2);
}
