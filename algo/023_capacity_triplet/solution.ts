export function capacityTriplet(sizes: number[], capacity: number): number[][] {
  const result: number[][] = [];
  const n = sizes.length;

  sizes.sort((x, y) => x - y);

  for (let i = 0; i < n - 2; i++) {
    if (i > 0 && sizes[i] === sizes[i - 1]) continue;
    if (sizes[i] * 3 > capacity) break;

    let left = i + 1;
    let right = n - 1;

    while (left < right) {
      const sum = sizes[i] + sizes[left] + sizes[right];

      if (sum < capacity) {
        left++;
      } else if (sum > capacity) {
        right--;
      } else {
        result.push([sizes[i], sizes[left], sizes[right]]);
        left++;
        right--;
        while (left < right && sizes[left] === sizes[left - 1]) left++;
        while (left < right && sizes[right] === sizes[right + 1]) right--;
      }
    }
  }

  return result;
}
