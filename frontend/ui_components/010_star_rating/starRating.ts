export interface StarRatingOptions {
  container: HTMLElement;
  maxStars?: number;
  initialRating?: number;
  onChange?: (rating: number) => void;
  readonly?: boolean;
}

export function createStarRating(options: StarRatingOptions): {
  getRating: () => number;
  setRating: (rating: number) => void;
  destroy: () => void;
} {
  return { getRating: () => 0, setRating() {}, destroy() {} };
}
