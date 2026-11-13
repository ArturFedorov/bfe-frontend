import type { ReactElement } from 'react';

export interface Slide {
  id: string;
  src: string;
  alt: string;
}

export interface CarouselProps {
  slides: Slide[];
  /** Milliseconds between automatic advances. 0 (default) disables autoplay. */
  autoPlayMs?: number;
  /** Wrap at both ends. Default true. When false, the end buttons are disabled. */
  loop?: boolean;
  /** Controlled active index. */
  index?: number;
  /** Uncontrolled start index. Default 0. */
  defaultIndex?: number;
  onChange?: (index: number) => void;
  /** Accessible name of the region. Default 'Gallery'. */
  label?: string;
}

export function Carousel(props: CarouselProps): ReactElement {
  throw new Error('Not implemented');
}
