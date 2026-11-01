/** @jest-environment jsdom */
import '@testing-library/jest-dom';
import { act, renderHook } from '@testing-library/react';
import { useInterval } from './use_interval';

describe('useInterval', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('invokes the callback every ms milliseconds', () => {
    const cb = jest.fn();
    renderHook(() => useInterval(cb, 1000));

    expect(cb).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(999);
    });
    expect(cb).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(1);
    });
    expect(cb).toHaveBeenCalledTimes(1);

    act(() => {
      jest.advanceTimersByTime(3000);
    });
    expect(cb).toHaveBeenCalledTimes(4);
  });

  it('uses the latest callback without resetting the interval schedule', () => {
    const oldCb = jest.fn();
    const newCb = jest.fn();
    const { rerender } = renderHook(({ cb }) => useInterval(cb, 1000), {
      initialProps: { cb: oldCb },
    });

    act(() => {
      jest.advanceTimersByTime(500);
    });
    rerender({ cb: newCb });

    // only 500ms remain on the original schedule — if the swap reset the
    // interval, nothing would fire here
    act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(newCb).toHaveBeenCalledTimes(1);
    expect(oldCb).not.toHaveBeenCalled();
  });

  it('does not schedule anything when ms is null', () => {
    const cb = jest.fn();
    renderHook(() => useInterval(cb, null));

    act(() => {
      jest.advanceTimersByTime(60000);
    });

    expect(cb).not.toHaveBeenCalled();
    expect(jest.getTimerCount()).toBe(0);
  });

  it('pauses when ms changes from a number to null', () => {
    const cb = jest.fn();
    const { rerender } = renderHook(
      ({ ms }: { ms: number | null }) => useInterval(cb, ms),
      { initialProps: { ms: 1000 as number | null } }
    );

    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(cb).toHaveBeenCalledTimes(1);

    rerender({ ms: null });

    act(() => {
      jest.advanceTimersByTime(10000);
    });
    expect(cb).toHaveBeenCalledTimes(1);
    expect(jest.getTimerCount()).toBe(0);
  });

  it('restarts with the new period when ms changes', () => {
    const cb = jest.fn();
    const { rerender } = renderHook(({ ms }) => useInterval(cb, ms), {
      initialProps: { ms: 1000 },
    });

    rerender({ ms: 200 });

    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(cb).toHaveBeenCalledTimes(5);
  });

  it('clears the interval on unmount', () => {
    const cb = jest.fn();
    const { unmount } = renderHook(() => useInterval(cb, 1000));

    unmount();
    expect(jest.getTimerCount()).toBe(0);

    act(() => {
      jest.advanceTimersByTime(5000);
    });
    expect(cb).not.toHaveBeenCalled();
  });
});
