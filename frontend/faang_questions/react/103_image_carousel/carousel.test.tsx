/** @jest-environment jsdom */
import '@testing-library/jest-dom';
import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { Carousel, type Slide } from './carousel';

// jsdom 20 has no PointerEvent; fireEvent.pointer* would drop clientX without it.
beforeAll(() => {
  if (!('PointerEvent' in window)) {
    class PointerEventPolyfill extends MouseEvent {
      pointerId: number;
      constructor(type: string, init: PointerEventInit = {}) {
        super(type, init);
        this.pointerId = init.pointerId ?? 1;
      }
    }
    Object.defineProperty(window, 'PointerEvent', { value: PointerEventPolyfill, configurable: true });
  }
});

const SLIDES: Slide[] = Array.from({ length: 5 }, (_, i) => ({
  id: `s${i + 1}`,
  src: `/art/${i + 1}.jpg`,
  alt: `Key art ${i + 1}`,
}));

const region = () => screen.getByRole('region', { name: 'Gallery' });
const visibleSlide = () => screen.getByRole('group');
const status = () => screen.getByRole('status');
const button = (name: string) => screen.getByRole('button', { name });
const renderedSlideLabels = () =>
  screen.getAllByRole('group', { hidden: true }).map((g) => g.getAttribute('aria-label'));

function ControlledHarness({ spy, start = 2 }: { spy: (i: number) => void; start?: number }) {
  const [index, setIndex] = useState(start);
  return (
    <Carousel
      slides={SLIDES}
      index={index}
      onChange={(i) => {
        spy(i);
        setIndex(i);
      }}
    />
  );
}

describe('1. region, slide, status', () => {
  it('renders a carousel region, one visible slide labelled by position, and a status line', () => {
    render(<Carousel slides={SLIDES} />);
    expect(region()).toHaveAttribute('aria-roledescription', 'carousel');
    expect(visibleSlide()).toHaveAttribute('aria-roledescription', 'slide');
    expect(visibleSlide()).toHaveAttribute('aria-label', '1 of 5');
    expect(screen.getByRole('img', { name: 'Key art 1' })).toBeVisible();
    expect(status()).toHaveTextContent('Slide 1 of 5');
    expect(screen.getAllByRole('group')).toHaveLength(1);
  });
});

describe('2. buttons and dots', () => {
  it('Next / Previous step by one and update the status', async () => {
    const user = userEvent.setup();
    render(<Carousel slides={SLIDES} />);
    await user.click(button('Next'));
    expect(visibleSlide()).toHaveAttribute('aria-label', '2 of 5');
    expect(status()).toHaveTextContent('Slide 2 of 5');
    await user.click(button('Previous'));
    expect(visibleSlide()).toHaveAttribute('aria-label', '1 of 5');
  });

  it('wraps at both ends when loop is on (default)', async () => {
    const user = userEvent.setup();
    render(<Carousel slides={SLIDES} />);
    await user.click(button('Previous'));
    expect(visibleSlide()).toHaveAttribute('aria-label', '5 of 5');
    await user.click(button('Next'));
    expect(visibleSlide()).toHaveAttribute('aria-label', '1 of 5');
  });

  it('disables the end buttons when loop is off and ignores ArrowRight on the last slide', async () => {
    const user = userEvent.setup();
    render(<Carousel slides={SLIDES} loop={false} defaultIndex={4} />);
    expect(button('Next')).toBeDisabled();
    expect(button('Previous')).toBeEnabled();
    act(() => region().focus());
    await user.keyboard('{ArrowRight}');
    expect(visibleSlide()).toHaveAttribute('aria-label', '5 of 5');
    await user.click(button('Go to slide 1'));
    expect(button('Previous')).toBeDisabled();
    expect(button('Next')).toBeEnabled();
  });

  it('dots jump to a slide and mark the active one with aria-current', async () => {
    const user = userEvent.setup();
    render(<Carousel slides={SLIDES} />);
    expect(screen.getAllByRole('button', { name: /^Go to slide \d$/ })).toHaveLength(5);
    expect(button('Go to slide 1')).toHaveAttribute('aria-current', 'true');
    await user.click(button('Go to slide 4'));
    expect(visibleSlide()).toHaveAttribute('aria-label', '4 of 5');
    expect(button('Go to slide 4')).toHaveAttribute('aria-current', 'true');
    expect(button('Go to slide 1')).not.toHaveAttribute('aria-current');
    const current = screen
      .getAllByRole('button', { name: /^Go to slide/ })
      .filter((b) => b.getAttribute('aria-current') === 'true');
    expect(current).toHaveLength(1);
  });
});

describe('3. keyboard', () => {
  it('ArrowRight / ArrowLeft navigate from the region and from a button inside it', async () => {
    const user = userEvent.setup();
    render(<Carousel slides={SLIDES} />);
    act(() => region().focus());
    await user.keyboard('{ArrowRight}');
    expect(visibleSlide()).toHaveAttribute('aria-label', '2 of 5');
    await user.keyboard('{ArrowRight}');
    expect(visibleSlide()).toHaveAttribute('aria-label', '3 of 5');

    act(() => button('Next').focus());
    await user.keyboard('{ArrowLeft}');
    expect(visibleSlide()).toHaveAttribute('aria-label', '2 of 5');
  });
});

describe('4. autoplay', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('advances every autoPlayMs and reports onChange', () => {
    const onChange = jest.fn();
    render(<Carousel slides={SLIDES} autoPlayMs={1000} onChange={onChange} />);
    act(() => jest.advanceTimersByTime(1000));
    expect(visibleSlide()).toHaveAttribute('aria-label', '2 of 5');
    expect(onChange).toHaveBeenLastCalledWith(1);
    act(() => jest.advanceTimersByTime(1000));
    expect(visibleSlide()).toHaveAttribute('aria-label', '3 of 5');
    expect(onChange).toHaveBeenCalledTimes(2);
  });

  it('senior: pauses while the pointer is over the region and resumes with a full interval', () => {
    render(<Carousel slides={SLIDES} autoPlayMs={1000} />);
    act(() => jest.advanceTimersByTime(1000));
    expect(visibleSlide()).toHaveAttribute('aria-label', '2 of 5');

    fireEvent.pointerEnter(region());
    act(() => jest.advanceTimersByTime(3000));
    expect(visibleSlide()).toHaveAttribute('aria-label', '2 of 5');

    fireEvent.pointerLeave(region());
    act(() => jest.advanceTimersByTime(999));
    expect(visibleSlide()).toHaveAttribute('aria-label', '2 of 5');
    act(() => jest.advanceTimersByTime(1));
    expect(visibleSlide()).toHaveAttribute('aria-label', '3 of 5');
  });

  it('pauses while focus is inside the region and resumes on blur out', () => {
    render(
      <>
        <Carousel slides={SLIDES} autoPlayMs={1000} />
        <button type="button">Outside</button>
      </>,
    );
    act(() => button('Next').focus());
    act(() => jest.advanceTimersByTime(2500));
    expect(visibleSlide()).toHaveAttribute('aria-label', '1 of 5');

    act(() => button('Outside').focus());
    act(() => jest.advanceTimersByTime(1000));
    expect(visibleSlide()).toHaveAttribute('aria-label', '2 of 5');
  });

  it('stops at the last slide when loop is off', () => {
    render(<Carousel slides={SLIDES} autoPlayMs={500} loop={false} defaultIndex={3} />);
    act(() => jest.advanceTimersByTime(500));
    expect(visibleSlide()).toHaveAttribute('aria-label', '5 of 5');
    act(() => jest.advanceTimersByTime(2000));
    expect(visibleSlide()).toHaveAttribute('aria-label', '5 of 5');
  });

  it('senior: unmount clears the timer and stops calling onChange', () => {
    const onChange = jest.fn();
    const { unmount } = render(<Carousel slides={SLIDES} autoPlayMs={1000} onChange={onChange} />);
    act(() => jest.advanceTimersByTime(1000));
    expect(onChange).toHaveBeenCalledTimes(1);
    unmount();
    expect(jest.getTimerCount()).toBe(0);
    act(() => jest.advanceTimersByTime(5000));
    expect(onChange).toHaveBeenCalledTimes(1);
  });
});

describe('5. lazy rendering', () => {
  it('senior: mounts only the active slide and its two neighbours (wrapping with loop)', async () => {
    const user = userEvent.setup();
    render(<Carousel slides={SLIDES} />);
    expect(document.querySelectorAll('img')).toHaveLength(3);
    expect(renderedSlideLabels().sort()).toEqual(['1 of 5', '2 of 5', '5 of 5']);

    await user.click(button('Go to slide 3'));
    expect(document.querySelectorAll('img')).toHaveLength(3);
    expect(renderedSlideLabels().sort()).toEqual(['2 of 5', '3 of 5', '4 of 5']);
    expect(screen.getAllByRole('group')).toHaveLength(1);
  });

  it('renders only two images on the first slide when loop is off', () => {
    render(<Carousel slides={SLIDES} loop={false} />);
    expect(document.querySelectorAll('img')).toHaveLength(2);
    expect(renderedSlideLabels().sort()).toEqual(['1 of 5', '2 of 5']);
  });
});

describe('6. swipe', () => {
  it('a horizontal drag of 40px or more changes the slide; a shorter one does not', () => {
    render(<Carousel slides={SLIDES} />);
    const r = region();
    fireEvent.pointerDown(r, { clientX: 200, pointerId: 1 });
    fireEvent.pointerMove(r, { clientX: 150, pointerId: 1 });
    fireEvent.pointerUp(r, { clientX: 150, pointerId: 1 });
    expect(visibleSlide()).toHaveAttribute('aria-label', '2 of 5');

    fireEvent.pointerDown(r, { clientX: 200, pointerId: 1 });
    fireEvent.pointerMove(r, { clientX: 180, pointerId: 1 });
    fireEvent.pointerUp(r, { clientX: 180, pointerId: 1 });
    expect(visibleSlide()).toHaveAttribute('aria-label', '2 of 5');

    fireEvent.pointerDown(r, { clientX: 100, pointerId: 1 });
    fireEvent.pointerMove(r, { clientX: 160, pointerId: 1 });
    fireEvent.pointerUp(r, { clientX: 160, pointerId: 1 });
    expect(visibleSlide()).toHaveAttribute('aria-label', '1 of 5');
  });
});

describe('7. controlled and uncontrolled', () => {
  it('starts at defaultIndex and owns the index when uncontrolled', async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    render(<Carousel slides={SLIDES} defaultIndex={1} onChange={onChange} />);
    expect(visibleSlide()).toHaveAttribute('aria-label', '2 of 5');
    await user.click(button('Next'));
    expect(onChange).toHaveBeenCalledWith(2);
    expect(visibleSlide()).toHaveAttribute('aria-label', '3 of 5');
  });

  it('senior: with index it only reports onChange and follows the prop', async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    const { rerender } = render(<Carousel slides={SLIDES} index={2} onChange={onChange} />);
    expect(visibleSlide()).toHaveAttribute('aria-label', '3 of 5');
    await user.click(button('Next'));
    expect(onChange).toHaveBeenCalledWith(3);
    expect(visibleSlide()).toHaveAttribute('aria-label', '3 of 5');
    expect(button('Go to slide 3')).toHaveAttribute('aria-current', 'true');

    rerender(<Carousel slides={SLIDES} index={3} onChange={onChange} />);
    expect(visibleSlide()).toHaveAttribute('aria-label', '4 of 5');
    expect(status()).toHaveTextContent('Slide 4 of 5');
  });

  it('follows a parent that applies onChange', async () => {
    const user = userEvent.setup();
    const spy = jest.fn();
    render(<ControlledHarness spy={spy} />);
    await user.click(button('Previous'));
    expect(spy).toHaveBeenCalledWith(1);
    expect(visibleSlide()).toHaveAttribute('aria-label', '2 of 5');
  });
});
