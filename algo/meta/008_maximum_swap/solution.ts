/** Returns the largest number obtainable by swapping two digits of `num` at most once. */
export function maximumSwap(num: number): number {
  const digits = String(num).split('').map(Number);
  const last = new Array<number>(10).fill(-1);
  digits.forEach((d, i) => {
    last[d] = i;
  });

  // Leftmost position that has a larger digit later; swap with its last occurrence.
  for (let i = 0; i < digits.length; i++) {
    for (let d = 9; d > digits[i]; d--) {
      if (last[d] > i) {
        [digits[i], digits[last[d]]] = [digits[last[d]], digits[i]];
        return Number(digits.join(''));
      }
    }
  }
  return num;
}
