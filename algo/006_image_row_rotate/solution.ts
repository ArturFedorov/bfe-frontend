export type RotateDirection = 'left' | 'right';

function reverse(arr: number[], from: number, to: number): void {
  while (from < to) {
    [arr[from], arr[to]] = [arr[to], arr[from]];
    from++;
    to--;
  }
}

export function rotateRow(
  pixels: number[],
  k: number,
  direction: RotateDirection,
): void {
  if (!Number.isInteger(k) || k < 0) throw new RangeError('Invalid k');

  const n = pixels.length;
  if (n < 2) return;

  // A right rotation by k is a left rotation by n - k.
  const shift = direction === 'left' ? k % n : (n - (k % n)) % n;
  if (shift === 0) return;

  reverse(pixels, 0, shift - 1);
  reverse(pixels, shift, n - 1);
  reverse(pixels, 0, n - 1);
}
