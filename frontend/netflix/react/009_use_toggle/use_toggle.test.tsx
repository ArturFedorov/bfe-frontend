/** @jest-environment jsdom */
import '@testing-library/jest-dom';
import { act, renderHook } from '@testing-library/react';
import { useToggle } from './use_toggle';

describe('useToggle', () => {
  it('defaults to false when no initial value is given', () => {
    const { result } = renderHook(() => useToggle());
    expect(result.current[0]).toBe(false);
  });

  it('respects the provided initial value', () => {
    const { result } = renderHook(() => useToggle(true));
    expect(result.current[0]).toBe(true);
  });

  it('toggle flips the value back and forth', () => {
    const { result } = renderHook(() => useToggle());

    act(() => result.current[1]());
    expect(result.current[0]).toBe(true);

    act(() => result.current[1]());
    expect(result.current[0]).toBe(false);
  });

  it('toggle uses a functional update (two calls in one act flip twice)', () => {
    const { result } = renderHook(() => useToggle());

    act(() => {
      result.current[1]();
      result.current[1]();
      result.current[1]();
    });
    expect(result.current[0]).toBe(true);
  });

  it('setOn forces true and is idempotent', () => {
    const { result } = renderHook(() => useToggle());

    act(() => result.current[2]());
    expect(result.current[0]).toBe(true);

    act(() => result.current[2]());
    expect(result.current[0]).toBe(true);
  });

  it('setOff forces false and is idempotent', () => {
    const { result } = renderHook(() => useToggle(true));

    act(() => result.current[3]());
    expect(result.current[0]).toBe(false);

    act(() => result.current[3]());
    expect(result.current[0]).toBe(false);
  });

  it('keeps the same function references across re-renders', () => {
    const { result, rerender } = renderHook(() => useToggle());
    const [, toggle, setOn, setOff] = result.current;

    rerender();

    expect(result.current[1]).toBe(toggle);
    expect(result.current[2]).toBe(setOn);
    expect(result.current[3]).toBe(setOff);
  });

  it('keeps the same function references across state changes', () => {
    const { result } = renderHook(() => useToggle());
    const [, toggle, setOn, setOff] = result.current;

    act(() => result.current[1]());
    act(() => result.current[2]());
    act(() => result.current[3]());

    expect(result.current[1]).toBe(toggle);
    expect(result.current[2]).toBe(setOn);
    expect(result.current[3]).toBe(setOff);
  });
});
