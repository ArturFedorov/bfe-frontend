export function errorVarietyWindow(codes: string[], k: number): number {
  const counts = new Map<string, number>();
  let left = 0;
  let best = 0;

  for (let right = 0; right < codes.length; right++) {
    counts.set(codes[right], (counts.get(codes[right]) ?? 0) + 1);

    while (counts.size > k) {
      const code = codes[left++];
      const remaining = counts.get(code)! - 1;
      if (remaining === 0) counts.delete(code);
      else counts.set(code, remaining);
    }

    best = Math.max(best, right - left + 1);
  }

  return best;
}
