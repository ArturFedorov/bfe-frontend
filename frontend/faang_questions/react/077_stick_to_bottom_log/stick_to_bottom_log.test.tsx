/** @jest-environment jsdom */
import '@testing-library/jest-dom';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FakeResizeObserver, installFakeObservers, restoreObservers } from '../_helpers/fake_observers';
import { StickToBottomLog } from './stick_to_bottom_log';

/**
 * jsdom has no layout: fake the scroll geometry of the container.
 * `scrollTop` becomes a real stored value, `scrollTo` is shimmed onto it.
 */
function makeScrollable(el: HTMLElement, geometry: { scrollHeight: number; clientHeight: number }) {
  let top = 0;
  Object.defineProperty(el, 'scrollTop', {
    configurable: true,
    get: () => top,
    set: (v: number) => {
      top = v;
    },
  });
  el.scrollTo = ((a: number | ScrollToOptions, b?: number) => {
    top = typeof a === 'number' ? (b as number) : (a.top as number);
  }) as HTMLElement['scrollTo'];
  setGeometry(el, geometry);
}

function setGeometry(el: HTMLElement, geometry: { scrollHeight?: number; clientHeight?: number }) {
  if (geometry.scrollHeight !== undefined) {
    Object.defineProperty(el, 'scrollHeight', { configurable: true, value: geometry.scrollHeight });
  }
  if (geometry.clientHeight !== undefined) {
    Object.defineProperty(el, 'clientHeight', { configurable: true, value: geometry.clientHeight });
  }
}

/** The element inside the log that the component observes with ResizeObserver. */
function observed(log: HTMLElement): { ro: FakeResizeObserver; target: Element } {
  for (const ro of FakeResizeObserver.instances) {
    const target = Array.from(log.querySelectorAll('*')).find((el) => ro.observes(el));
    if (target) return { ro, target };
  }
  throw new Error('No ResizeObserver observes an element inside the log');
}

/** Content grew: update the container's scrollHeight and notify the observer. */
function grow(log: HTMLElement, scrollHeight: number) {
  setGeometry(log, { scrollHeight });
  const { ro, target } = observed(log);
  act(() => {
    ro.trigger(target, { height: scrollHeight });
  });
}

/** The user scrolls the container to `top`. */
function scrollTo(log: HTMLElement, top: number) {
  log.scrollTop = top;
  fireEvent.scroll(log);
}

const lineList = (n: number, from = 1) => Array.from({ length: n }, (_, i) => `line ${from + i}`);

function setup(opts: { lines?: string[]; streaming?: boolean; threshold?: number } = {}) {
  const onFollowChange = jest.fn();
  const lines = opts.lines ?? lineList(5);
  const streaming = opts.streaming ?? true;
  const utils = render(
    <StickToBottomLog lines={lines} streaming={streaming} threshold={opts.threshold} onFollowChange={onFollowChange} />,
  );
  const log = screen.getByRole('log');
  // 500px of content in a 200px viewport, currently pinned to the bottom
  makeScrollable(log, { scrollHeight: 500, clientHeight: 200 });
  log.scrollTop = 300;
  const rerenderLines = (next: string[], nextStreaming = streaming) =>
    utils.rerender(
      <StickToBottomLog
        lines={next}
        streaming={nextStreaming}
        threshold={opts.threshold}
        onFollowChange={onFollowChange}
      />,
    );
  return { ...utils, log, onFollowChange, rerenderLines, lines };
}

const jumpButton = () => screen.queryByRole('button', { name: /Jump to latest/ });

beforeEach(() => {
  installFakeObservers();
});

afterEach(() => {
  restoreObservers();
});

describe('rendering and a11y', () => {
  it('renders every line in order inside a polite live log', () => {
    const { log } = setup({ lines: ['fetch_items started', 'model: 30 predictions', 'validate: ok'] });

    expect(log).toHaveAttribute('aria-live', 'polite');
    const texts = Array.from(log.querySelectorAll('*'))
      .filter((el) => el.children.length === 0)
      .map((el) => el.textContent);
    expect(texts).toEqual(['fetch_items started', 'model: 30 predictions', 'validate: ok']);
    expect(within(log).getByText('model: 30 predictions')).toBeInTheDocument();
  });

  it('mirrors the streaming prop as aria-busy', () => {
    const { log, rerenderLines, lines } = setup({ streaming: true });
    expect(log).toHaveAttribute('aria-busy', 'true');

    rerenderLines(lines, false);
    expect(log).not.toHaveAttribute('aria-busy', 'true');
  });

  it('observes an element inside the log with ResizeObserver and disconnects on unmount', () => {
    const { log, unmount } = setup();
    const { ro, target } = observed(log);

    expect(log.contains(target)).toBe(true);
    expect(target).not.toBe(log);

    unmount();
    expect(ro.observes(target)).toBe(false);
  });
});

describe('following mode (auto-scroll)', () => {
  it('starts following: no Jump button and onFollowChange is not called on mount', () => {
    const { onFollowChange } = setup();
    expect(jumpButton()).not.toBeInTheDocument();
    expect(onFollowChange).not.toHaveBeenCalled();
  });

  it('keeps the view pinned when content resizes while following (senior)', () => {
    const { log, rerenderLines, lines } = setup();

    rerenderLines([...lines, 'line 6', 'line 7']);
    grow(log, 700);
    expect(log.scrollTop).toBe(700 - 200);

    // content grows again without new lines (e.g. a wrapped line re-flowed)
    grow(log, 760);
    expect(log.scrollTop).toBe(760 - 200);
    expect(jumpButton()).not.toBeInTheDocument();
  });
});

describe('scrolling away stops following', () => {
  it('scrolling up beyond the threshold stops auto-scroll and shows Jump to latest (0 new)', () => {
    const { log, onFollowChange } = setup();

    scrollTo(log, 100); // distance 200 > 16

    expect(onFollowChange).toHaveBeenCalledTimes(1);
    expect(onFollowChange).toHaveBeenLastCalledWith(false);
    expect(screen.getByRole('button', { name: 'Jump to latest (0 new)' })).toBeInTheDocument();
  });

  it('a distance equal to the threshold still counts as at the bottom; a custom threshold is honoured', () => {
    const { log, onFollowChange } = setup({ threshold: 40 });

    scrollTo(log, 260); // distance 40 == threshold
    expect(onFollowChange).not.toHaveBeenCalled();
    expect(jumpButton()).not.toBeInTheDocument();

    scrollTo(log, 259); // distance 41 > threshold
    expect(onFollowChange).toHaveBeenCalledTimes(1);
    expect(onFollowChange).toHaveBeenLastCalledWith(false);
    expect(jumpButton()).toBeInTheDocument();
  });

  it('uses 16px as the default threshold', () => {
    const { log, onFollowChange } = setup();

    scrollTo(log, 284); // distance 16
    expect(onFollowChange).not.toHaveBeenCalled();

    scrollTo(log, 283); // distance 17
    expect(onFollowChange).toHaveBeenCalledWith(false);
  });

  it('appending lines while scrolled up leaves scrollTop alone and counts the new lines (senior)', () => {
    const { log, rerenderLines, lines } = setup();
    scrollTo(log, 100);

    rerenderLines([...lines, 'line 6', 'line 7']);
    grow(log, 700);

    expect(log.scrollTop).toBe(100);
    expect(screen.getByRole('button', { name: 'Jump to latest (2 new)' })).toBeInTheDocument();

    rerenderLines([...lines, 'line 6', 'line 7', 'line 8']);
    grow(log, 800);

    expect(log.scrollTop).toBe(100);
    expect(screen.getByRole('button', { name: 'Jump to latest (3 new)' })).toBeInTheDocument();
    expect(within(log).getByText('line 8')).toBeInTheDocument();
  });

  it('repeated scroll events far from the bottom report the change exactly once', () => {
    const { log, onFollowChange } = setup();

    scrollTo(log, 100);
    scrollTo(log, 80);
    scrollTo(log, 120);

    expect(onFollowChange).toHaveBeenCalledTimes(1);
    expect(onFollowChange).toHaveBeenCalledWith(false);
  });
});

describe('Jump to latest', () => {
  it('pins to the bottom, resumes following, and removes the button', async () => {
    const user = userEvent.setup();
    const { log, onFollowChange, rerenderLines, lines } = setup();
    scrollTo(log, 100);
    rerenderLines([...lines, 'line 6']);
    grow(log, 600);
    expect(screen.getByRole('button', { name: 'Jump to latest (1 new)' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Jump to latest (1 new)' }));

    expect(log.scrollTop).toBe(600 - 200);
    expect(jumpButton()).not.toBeInTheDocument();
    expect(onFollowChange).toHaveBeenCalledTimes(2);
    expect(onFollowChange).toHaveBeenLastCalledWith(true);

    // following again: the next growth pins
    rerenderLines([...lines, 'line 6', 'line 7']);
    grow(log, 700);
    expect(log.scrollTop).toBe(700 - 200);
    expect(jumpButton()).not.toBeInTheDocument();
  });

  it('is operable from the keyboard', async () => {
    const user = userEvent.setup();
    const { log, onFollowChange } = setup();
    scrollTo(log, 100);

    const button = screen.getByRole('button', { name: 'Jump to latest (0 new)' });
    button.focus();
    await user.keyboard('{Enter}');

    expect(log.scrollTop).toBe(300);
    expect(jumpButton()).not.toBeInTheDocument();
    expect(onFollowChange).toHaveBeenLastCalledWith(true);
  });
});

describe('returning to the bottom manually', () => {
  it('scrolling back within the threshold resumes following and clears the count', () => {
    const { log, onFollowChange, rerenderLines, lines } = setup();
    scrollTo(log, 100);
    rerenderLines([...lines, 'line 6', 'line 7']);
    grow(log, 700);
    expect(screen.getByRole('button', { name: 'Jump to latest (2 new)' })).toBeInTheDocument();

    scrollTo(log, 700 - 200 - 10); // distance 10 <= 16

    expect(jumpButton()).not.toBeInTheDocument();
    expect(onFollowChange).toHaveBeenCalledTimes(2);
    expect(onFollowChange).toHaveBeenLastCalledWith(true);

    // scrolling away again restarts the count from zero
    scrollTo(log, 50);
    expect(screen.getByRole('button', { name: 'Jump to latest (0 new)' })).toBeInTheDocument();
    expect(onFollowChange).toHaveBeenCalledTimes(3);
  });
});
