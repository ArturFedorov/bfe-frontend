/**
 * Finds every distinct triple of VM instance sizes summing exactly to the
 * reserved capacity.
 *
 * Sort the catalog, pin one value, and converge two pointers over the rest,
 * skipping duplicate values to avoid repeated triples.
 *
 * @param sizes - available instance sizes, unsorted, may repeat (may be mutated by sorting)
 * @param capacity - the reserved capacity to hit exactly
 * @returns distinct triples, each sorted ascending, in ascending lexicographic order
 */
export function capacityTriplet(sizes: number[], capacity: number): number[][] {
  // TODO: implement
  throw new Error('Not implemented');
}
