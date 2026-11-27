/** Returns the k-th positive integer missing from the strictly increasing `arr`. */
export function findKthPositive(arr: number[], k: number): number {
  let lo = 0;
  let hi = arr.length;
  // arr[i] - (i + 1) positives are missing before arr[i]; find the first i where that is >= k.
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (arr[mid] - (mid + 1) < k) lo = mid + 1;
    else hi = mid;
  }
  // Exactly lo array values lie below the answer.
  return lo + k;
}
