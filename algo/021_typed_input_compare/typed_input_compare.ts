/**
 * Compares two keystroke recordings for equality of their rendered text,
 * where `#` means backspace (a no-op on an empty input).
 *
 * Must not materialize the rendered strings — walk both recordings from
 * the end with two pointers in O(1) extra space.
 *
 * @param a - first recording (lowercase letters and `#`)
 * @param b - second recording (lowercase letters and `#`)
 * @returns true when both recordings render the same final text
 */
export function typedInputsEqual(a: string, b: string): boolean {
  // TODO: implement
  throw new Error('Not implemented');
}
