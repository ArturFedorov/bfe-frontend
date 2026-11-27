/** Returns, in increasing order, the indices of buildings that can see the ocean on the right. */
export function findBuildings(heights: number[]): number[] {
  // Scan right-to-left, tracking the tallest building seen so far.
  const result: number[] = [];
  let tallest = 0;
  for (let i = heights.length - 1; i >= 0; i--) {
    if (heights[i] > tallest) {
      result.push(i);
      tallest = heights[i];
    }
  }
  return result.reverse();
}
