/**
 * @jest-environment jsdom
 */
import { createCarousel, CarouselOptions } from './carousel';

const IMAGES = ['/img1.jpg', '/img2.jpg', '/img3.jpg'];

function setup(overrides: Partial<CarouselOptions> = {}) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const options: CarouselOptions = {
    container,
    images: IMAGES,
    ...overrides,
  };
  const carousel = createCarousel(options);
  return { container, carousel };
}

function getVisibleImage(container: HTMLElement): HTMLImageElement | null {
  const images = container.querySelectorAll('img');
  for (const img of images) {
    const el = img as HTMLImageElement;
    if (
      el.style.display !== 'none' &&
      !el.classList.contains('hidden') &&
      el.getAttribute('data-active') !== 'false'
    ) {
      return el;
    }
  }
  return null;
}

afterEach(() => {
  document.body.innerHTML = '';
  jest.useRealTimers();
});

describe('createCarousel', () => {
  test('renders images in container', () => {
    const { container } = setup();
    const images = container.querySelectorAll('img');
    expect(images.length).toBe(3);
  });

  test('shows first image initially', () => {
    const { container, carousel } = setup();
    expect(carousel.getCurrentIndex()).toBe(0);
    const visible = getVisibleImage(container);
    expect(visible).toBeTruthy();
    expect(visible!.src).toContain('img1.jpg');
  });

  test('next advances to next image', () => {
    const { container, carousel } = setup();
    carousel.next();
    expect(carousel.getCurrentIndex()).toBe(1);
    const visible = getVisibleImage(container);
    expect(visible!.src).toContain('img2.jpg');
  });

  test('prev goes to previous image', () => {
    const { carousel } = setup();
    carousel.next();
    carousel.next();
    carousel.prev();
    expect(carousel.getCurrentIndex()).toBe(1);
  });

  test('next wraps around from last to first', () => {
    const { carousel } = setup();
    carousel.next();
    carousel.next();
    carousel.next();
    expect(carousel.getCurrentIndex()).toBe(0);
  });

  test('prev wraps around from first to last', () => {
    const { carousel } = setup();
    carousel.prev();
    expect(carousel.getCurrentIndex()).toBe(2);
  });

  test('goTo jumps to specific index', () => {
    const { carousel } = setup();
    carousel.goTo(2);
    expect(carousel.getCurrentIndex()).toBe(2);
  });

  test('getCurrentIndex returns correct index', () => {
    const { carousel } = setup();
    expect(carousel.getCurrentIndex()).toBe(0);
    carousel.next();
    expect(carousel.getCurrentIndex()).toBe(1);
    carousel.goTo(2);
    expect(carousel.getCurrentIndex()).toBe(2);
  });

  test('autoPlay advances on interval', () => {
    jest.useFakeTimers();
    const { carousel } = setup({ autoPlay: true, interval: 1000 });
    expect(carousel.getCurrentIndex()).toBe(0);
    jest.advanceTimersByTime(1000);
    expect(carousel.getCurrentIndex()).toBe(1);
    jest.advanceTimersByTime(1000);
    expect(carousel.getCurrentIndex()).toBe(2);
  });

  test('destroy stops autoPlay', () => {
    jest.useFakeTimers();
    const { carousel } = setup({ autoPlay: true, interval: 1000 });
    carousel.destroy();
    jest.advanceTimersByTime(3000);
    expect(carousel.getCurrentIndex()).toBe(0);
  });
});
