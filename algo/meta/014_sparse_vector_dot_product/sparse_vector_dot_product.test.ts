import { SparseVector } from './sparse_vector_dot_product';

const dot = (a: number[], b: number[]): number =>
  new SparseVector(a).dotProduct(new SparseVector(b));

describe('SparseVector', () => {
  it('example 1 -> 8', () => {
    expect(dot([1, 0, 0, 2, 3], [0, 3, 0, 4, 0])).toBe(8);
  });

  it('example 2: no overlapping non-zeros -> 0', () => {
    expect(dot([0, 1, 0, 0, 0], [0, 0, 0, 0, 2])).toBe(0);
  });

  it('example 3 -> 6', () => {
    expect(dot([0, 1, 0, 0, 2, 0, 0], [1, 0, 0, 0, 3, 0, 4])).toBe(6);
  });

  it('single element', () => {
    expect(dot([7], [6])).toBe(42);
    expect(dot([0], [6])).toBe(0);
  });

  it('all zeros', () => {
    expect(dot([0, 0, 0], [0, 0, 0])).toBe(0);
  });

  it('dense vectors', () => {
    expect(dot([1, 2, 3], [4, 5, 6])).toBe(32);
  });

  it('negative values', () => {
    expect(dot([-1, 0, 3, -2], [4, 9, -2, -5])).toBe(-4 - 6 + 10);
  });

  it('is symmetric', () => {
    const a = new SparseVector([0, 5, 0, 0, 1, 2]);
    const b = new SparseVector([3, 2, 0, 7, 0, 4]);
    expect(a.dotProduct(b)).toBe(18);
    expect(b.dotProduct(a)).toBe(18);
  });

  it('dot product with itself is the squared norm', () => {
    const a = new SparseVector([0, 3, 0, 4]);
    expect(a.dotProduct(a)).toBe(25);
  });

  it('vectors are reusable across many calls', () => {
    const a = new SparseVector([1, 0, 2]);
    expect(a.dotProduct(new SparseVector([1, 1, 1]))).toBe(3);
    expect(a.dotProduct(new SparseVector([0, 9, 0]))).toBe(0);
    expect(a.dotProduct(new SparseVector([0, 0, 10]))).toBe(20);
  });

  it('large sparse vectors: dotProduct scales with non-zeros, not length', () => {
    const n = 100_000;
    const a = new Array<number>(n).fill(0);
    const b = new Array<number>(n).fill(0);
    for (let i = 0; i < n; i += 1000) {
      a[i] = 2;
      b[i] = 3;
    }
    b[n - 1] = 99;
    const va = new SparseVector(a);
    const vb = new SparseVector(b);
    let total = 0;
    for (let r = 0; r < 50_000; r++) total += va.dotProduct(vb);
    expect(total).toBe(50_000 * 100 * 6);
  });
});
