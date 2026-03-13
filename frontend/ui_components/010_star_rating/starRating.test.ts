/**
 * @jest-environment jsdom
 */
import { createStarRating, StarRatingOptions } from './starRating';

function setup(overrides: Partial<StarRatingOptions> = {}) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const onChange = jest.fn();
  const options: StarRatingOptions = {
    container,
    onChange,
    ...overrides,
  };
  const rating = createStarRating(options);
  return { container, onChange, rating };
}

function getStars(container: HTMLElement) {
  return container.querySelectorAll('[data-star]');
}

function getFilledStars(container: HTMLElement) {
  return container.querySelectorAll('[data-star].filled, [data-star].active, [data-star][data-filled="true"]');
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('createStarRating', () => {
  test('renders 5 stars by default', () => {
    const { container } = setup();
    expect(getStars(container).length).toBe(5);
  });

  test('renders configurable number of stars', () => {
    const { container } = setup({ maxStars: 10 });
    expect(getStars(container).length).toBe(10);
  });

  test('click sets rating', () => {
    const { container, rating } = setup();
    const stars = getStars(container);
    (stars[2] as HTMLElement).click();
    expect(rating.getRating()).toBe(3);
  });

  test('click highlights correct number of stars', () => {
    const { container } = setup();
    const stars = getStars(container);
    (stars[3] as HTMLElement).click();
    const filled = getFilledStars(container);
    expect(filled.length).toBe(4);
  });

  test('hover highlights stars', () => {
    const { container } = setup();
    const stars = getStars(container);
    (stars[1] as HTMLElement).dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
    const highlighted = container.querySelectorAll('[data-star].hover, [data-star].active, [data-star][data-hover="true"]');
    expect(highlighted.length).toBeGreaterThanOrEqual(2);
  });

  test('getRating returns current rating', () => {
    const { rating } = setup({ initialRating: 4 });
    expect(rating.getRating()).toBe(4);
  });

  test('setRating updates rating', () => {
    const { container, rating } = setup();
    rating.setRating(3);
    expect(rating.getRating()).toBe(3);
    const filled = getFilledStars(container);
    expect(filled.length).toBe(3);
  });

  test('onChange callback fires on click', () => {
    const { container, onChange } = setup();
    const stars = getStars(container);
    (stars[4] as HTMLElement).click();
    expect(onChange).toHaveBeenCalledWith(5);
  });

  test('readonly prevents click from changing rating', () => {
    const { container, rating, onChange } = setup({ readonly: true, initialRating: 2 });
    const stars = getStars(container);
    (stars[4] as HTMLElement).click();
    expect(rating.getRating()).toBe(2);
    expect(onChange).not.toHaveBeenCalled();
  });

  test('initialRating sets starting value', () => {
    const { container, rating } = setup({ initialRating: 3 });
    expect(rating.getRating()).toBe(3);
    const filled = getFilledStars(container);
    expect(filled.length).toBe(3);
  });

  test('destroy cleans up DOM', () => {
    const { container, rating } = setup();
    rating.destroy();
    expect(getStars(container).length).toBe(0);
  });
});
