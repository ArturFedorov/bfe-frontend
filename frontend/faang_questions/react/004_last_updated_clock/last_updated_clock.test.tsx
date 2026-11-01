/** @jest-environment jsdom */
import '@testing-library/jest-dom';
import { act, render, screen } from '@testing-library/react';
import { LastUpdatedClock } from './last_updated_clock';

const BASE = new Date('2026-08-18T12:00:00Z').getTime();

describe('LastUpdatedClock', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(BASE);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders the elapsed seconds since updatedAt', () => {
    render(<LastUpdatedClock updatedAt={BASE - 5000} />);
    expect(screen.getByRole('timer')).toHaveTextContent('Updated 5s ago');
  });

  it('counts up as the interval ticks', () => {
    render(<LastUpdatedClock updatedAt={BASE - 5000} />);
    act(() => {
      jest.advanceTimersByTime(3000);
    });
    expect(screen.getByRole('timer')).toHaveTextContent('Updated 8s ago');
  });

  it('respects a custom tickMs', () => {
    render(<LastUpdatedClock updatedAt={BASE} tickMs={500} />);
    act(() => {
      jest.advanceTimersByTime(1500);
    });
    expect(screen.getByRole('timer')).toHaveTextContent('Updated 1s ago');
  });

  it('never shows a negative elapsed time', () => {
    render(<LastUpdatedClock updatedAt={BASE + 60_000} />);
    expect(screen.getByRole('timer')).toHaveTextContent('Updated 0s ago');
  });

  it('picks up a new updatedAt without stale-closure leftovers', () => {
    const { rerender } = render(<LastUpdatedClock updatedAt={BASE - 30_000} />);
    act(() => {
      jest.advanceTimersByTime(2000);
    });
    expect(screen.getByRole('timer')).toHaveTextContent('Updated 32s ago');
    rerender(<LastUpdatedClock updatedAt={BASE + 2000} />);
    expect(screen.getByRole('timer')).toHaveTextContent('Updated 0s ago');
    act(() => {
      jest.advanceTimersByTime(4000);
    });
    expect(screen.getByRole('timer')).toHaveTextContent('Updated 4s ago');
  });

  it('clears its interval on unmount', () => {
    const { unmount } = render(<LastUpdatedClock updatedAt={BASE} />);
    expect(jest.getTimerCount()).toBeGreaterThan(0);
    unmount();
    expect(jest.getTimerCount()).toBe(0);
  });

  it('does not update state after unmount', () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const { unmount } = render(<LastUpdatedClock updatedAt={BASE} />);
    unmount();
    act(() => {
      jest.advanceTimersByTime(5000);
    });
    expect(errorSpy).not.toHaveBeenCalled();
    errorSpy.mockRestore();
  });
});
