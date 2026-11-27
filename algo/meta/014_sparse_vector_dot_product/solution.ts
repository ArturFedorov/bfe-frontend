/** A vector that stores only its non-zero entries. */
export class SparseVector {
  private readonly indices: number[] = [];
  private readonly values: number[] = [];

  constructor(nums: number[]) {
    for (let i = 0; i < nums.length; i++) {
      if (nums[i] !== 0) {
        this.indices.push(i);
        this.values.push(nums[i]);
      }
    }
  }

  /** Returns the dot product of this vector and other. */
  dotProduct(other: SparseVector): number {
    // Two-pointer merge over the sorted non-zero index lists.
    let i = 0;
    let j = 0;
    let sum = 0;
    while (i < this.indices.length && j < other.indices.length) {
      if (this.indices[i] === other.indices[j]) {
        sum += this.values[i] * other.values[j];
        i++;
        j++;
      } else if (this.indices[i] < other.indices[j]) {
        i++;
      } else {
        j++;
      }
    }
    return sum;
  }
}
