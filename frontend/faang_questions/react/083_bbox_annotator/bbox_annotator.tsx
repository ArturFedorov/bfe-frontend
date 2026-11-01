import { ReactElement } from 'react';

export interface Point {
  x: number;
  y: number;
}

/** A bounding box in IMAGE space (pixels of the source image, independent of zoom/pan). */
export interface Box {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

export type Handle = 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | 'nw';

export interface BBoxAnnotatorProps {
  imageWidth: number;
  imageHeight: number;
  viewport: { width: number; height: number };
  value: Box[];
  onChange: (next: Box[]) => void;
  /** Screen px per image px. Default 1. */
  zoom?: number;
  /** Screen-space offset of the image origin inside the viewport. Default { x: 0, y: 0 }. */
  pan?: Point;
  /** Id factory for newly drawn boxes. Default: `box-1`, `box-2`, … */
  createId?: () => string;
}

/** Convert a point in screen space (relative to the svg origin) into image space. */
export function toImageSpace(point: Point, zoom: number, pan: Point): Point {
  throw new Error('Not implemented');
}

/** Keep a box (non-negative size) fully inside the image bounds. */
export function clampBox(box: Box, imageWidth: number, imageHeight: number): Box {
  throw new Error('Not implemented');
}

export function BBoxAnnotator(props: BBoxAnnotatorProps): ReactElement {
  throw new Error('Not implemented');
}
