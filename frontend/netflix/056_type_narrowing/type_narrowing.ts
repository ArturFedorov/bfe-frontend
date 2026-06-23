export type Shape =
  | { kind: 'circle'; radius: number }
  | { kind: 'square'; side: number }
  | { kind: 'rect'; width: number; height: number };

/**
 * Compute the area of a shape using a discriminated-union switch. The default
 * branch must be exhaustive: assign the value to `never` so adding a new shape
 * without handling it becomes a compile error.
 */
export function area(shape: Shape): number {
  // TODO: implement with an exhaustive switch on `shape.kind`
  throw new Error('Not implemented');
}

/** A user-defined type guard narrowing `Shape` to the circle variant. */
export function isCircle(
  shape: Shape,
): shape is Extract<Shape, { kind: 'circle' }> {
  // TODO: implement
  throw new Error('Not implemented');
}
