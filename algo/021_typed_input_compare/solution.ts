// Returns the index of the next surviving character at or before i, or -1.
function nextSurvivor(s: string, i: number): number {
  let skip = 0;

  while (i >= 0) {
    if (s[i] === '#') {
      skip++;
    } else if (skip > 0) {
      skip--;
    } else {
      return i;
    }
    i--;
  }

  return -1;
}

export function typedInputsEqual(a: string, b: string): boolean {
  let i = a.length - 1;
  let j = b.length - 1;

  while (true) {
    i = nextSurvivor(a, i);
    j = nextSurvivor(b, j);

    if (i < 0 || j < 0) return i < 0 && j < 0;
    if (a[i] !== b[j]) return false;

    i--;
    j--;
  }
}
