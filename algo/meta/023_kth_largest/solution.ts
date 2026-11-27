/** Returns the k-th largest element of `nums` (may reorder `nums`). */
export function findKthLargest(nums: number[], k: number): number {
  // The k-th largest sits at index n - k in ascending order.
  const want = nums.length - k;
  let lo = 0;
  let hi = nums.length - 1;

  while (lo < hi) {
    const pivot = nums[lo + Math.floor(Math.random() * (hi - lo + 1))];
    // Three-way partition: [lo, lt) < pivot, [lt, i) === pivot, (gt, hi] > pivot.
    let lt = lo;
    let gt = hi;
    let i = lo;
    while (i <= gt) {
      if (nums[i] < pivot) {
        [nums[i], nums[lt]] = [nums[lt], nums[i]];
        i++;
        lt++;
      } else if (nums[i] > pivot) {
        [nums[i], nums[gt]] = [nums[gt], nums[i]];
        gt--;
      } else {
        i++;
      }
    }
    if (want < lt) hi = lt - 1;
    else if (want > gt) lo = gt + 1;
    else return pivot;
  }
  return nums[want];
}
