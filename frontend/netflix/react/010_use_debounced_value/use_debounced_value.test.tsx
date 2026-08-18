/** @jest-environment jsdom */
import '@testing-library/jest-dom';
import { act, renderHook } from '@testing-library/react';
import { useDebouncedValue } from './use_debounced_value';

describe('useDebouncedValue', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('returns the initial value immediately', () => {
    const { result } = renderHook(() => useDebouncedValue('warner', 300));
    expect(result.current).toBe('warner');
  });

  it('updates only after ms elapsed, not before', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebouncedValue(value, 300),
      { initialProps: { value: 'w' } }
    );

    rerender({ value: 'wa' });
    expect(result.current).toBe('w');

    act(() => {
      jest.advanceTimersByTime(299);
    });
    expect(result.current).toBe('w');

    act(() => {
      jest.advanceTimersByTime(1);
    });
    expect(result.current).toBe('wa');
  });

  it('resets the timer on rapid changes and emits only the latest value', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebouncedValue(value, 300),
      { initialProps: { value: 'w' } }
    );

    rerender({ value: 'wa' });
    act(() => {
      jest.advanceTimersByTime(200);
    });
    rerender({ value: 'war' });
    act(() => {
      jest.advanceTimersByTime(200);
    });
    rerender({ value: 'warner' });

    // 400ms have passed but no change ever survived 300ms uninterrupted
    expect(result.current).toBe('w');

    act(() => {
      jest.advanceTimersByTime(300);
    });
    expect(result.current).toBe('warner');
  });

  it('is generic over non-string values', () => {
    const first = { page: 1 };
    const second = { page: 2 };
    const { result, rerender } = renderHook(
      ({ value }) => useDebouncedValue(value, 100),
      { initialProps: { value: first } }
    );

    rerender({ value: second });
    act(() => {
      jest.advanceTimersByTime(100);
    });
    expect(result.current).toBe(second);
  });

  it('clears the pending timer on unmount', () => {
    const { rerender, unmount } = renderHook(
      ({ value }) => useDebouncedValue(value, 300),
      { initialProps: { value: 'w' } }
    );

    rerender({ value: 'wa' });
    expect(jest.getTimerCount()).toBeGreaterThan(0);

    unmount();
    expect(jest.getTimerCount()).toBe(0);

    // advancing after unmount must not blow up or update anything
    act(() => {
      jest.advanceTimersByTime(1000);
    });
  });
});
