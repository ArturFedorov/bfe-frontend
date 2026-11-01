/** @jest-environment jsdom */
import '@testing-library/jest-dom';
import { act, renderHook } from '@testing-library/react';
import { useLocalStorage } from './use_local_storage';

describe('useLocalStorage', () => {
  beforeEach(() => {
    window.localStorage.clear();
    jest.restoreAllMocks();
  });

  it('falls back to the initial value when the key is absent', () => {
    const { result } = renderHook(() => useLocalStorage('pageSize', 25));
    expect(result.current[0]).toBe(25);
  });

  it('reads and JSON-parses an existing stored value', () => {
    window.localStorage.setItem('pageSize', JSON.stringify(50));
    const getItem = jest.spyOn(Storage.prototype, 'getItem');

    const { result } = renderHook(() => useLocalStorage('pageSize', 25));

    expect(result.current[0]).toBe(50);
    expect(getItem).toHaveBeenCalledWith('pageSize');
  });

  it('round-trips objects through JSON', () => {
    window.localStorage.setItem(
      'columns',
      JSON.stringify({ status: true, region: false })
    );
    const { result } = renderHook(() =>
      useLocalStorage<Record<string, boolean>>('columns', {})
    );
    expect(result.current[0]).toEqual({ status: true, region: false });
  });

  it('falls back to the initial value on corrupt JSON without throwing', () => {
    window.localStorage.setItem('pageSize', '{definitely not json');
    const { result } = renderHook(() => useLocalStorage('pageSize', 25));
    expect(result.current[0]).toBe(25);
  });

  it('calls a lazy initializer at most once', () => {
    const init = jest.fn(() => 'dark');
    const { result, rerender } = renderHook(() =>
      useLocalStorage('theme', init)
    );

    expect(result.current[0]).toBe('dark');
    rerender();
    rerender();
    expect(init).toHaveBeenCalledTimes(1);
  });

  it('does not call the lazy initializer when a stored value exists', () => {
    window.localStorage.setItem('theme', JSON.stringify('light'));
    const init = jest.fn(() => 'dark');

    const { result } = renderHook(() => useLocalStorage('theme', init));

    expect(result.current[0]).toBe('light');
    expect(init).not.toHaveBeenCalled();
  });

  it('setValue updates state and persists JSON to localStorage', () => {
    const setItem = jest.spyOn(Storage.prototype, 'setItem');
    const { result } = renderHook(() => useLocalStorage('pageSize', 25));

    act(() => result.current[1](50));

    expect(result.current[0]).toBe(50);
    expect(setItem).toHaveBeenCalledWith('pageSize', JSON.stringify(50));
    expect(window.localStorage.getItem('pageSize')).toBe('50');
  });

  it('supports functional updates and persists the computed value', () => {
    const { result } = renderHook(() => useLocalStorage('pageSize', 25));

    act(() => result.current[1]((prev) => prev * 2));

    expect(result.current[0]).toBe(50);
    expect(window.localStorage.getItem('pageSize')).toBe('50');
  });

  it('keeps a stable setValue identity across re-renders and updates', () => {
    const { result, rerender } = renderHook(() =>
      useLocalStorage('pageSize', 25)
    );
    const set = result.current[1];

    rerender();
    act(() => result.current[1](99));

    expect(result.current[1]).toBe(set);
  });
});
