/** @jest-environment jsdom */
import '@testing-library/jest-dom';
import { act, renderHook } from '@testing-library/react';
import { useEventListener } from './use_event_listener';

describe('useEventListener', () => {
  let addSpy: jest.SpyInstance;
  let removeSpy: jest.SpyInstance;

  beforeEach(() => {
    addSpy = jest.spyOn(window, 'addEventListener');
    removeSpy = jest.spyOn(window, 'removeEventListener');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('subscribes once on mount and invokes the handler with the event', () => {
    const handler = jest.fn();
    renderHook(() => useEventListener(window, 'keydown', handler));

    expect(addSpy).toHaveBeenCalledTimes(1);
    expect(addSpy).toHaveBeenCalledWith('keydown', expect.any(Function));

    const event = new KeyboardEvent('keydown', { key: '?' });
    act(() => {
      window.dispatchEvent(event);
    });

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith(event);
  });

  it('removes the exact same listener reference on unmount', () => {
    const handler = jest.fn();
    const { unmount } = renderHook(() =>
      useEventListener(window, 'resize', handler)
    );

    const [addedType, addedListener] = addSpy.mock.calls[0];

    unmount();

    expect(removeSpy).toHaveBeenCalledTimes(1);
    const [removedType, removedListener] = removeSpy.mock.calls[0];
    expect(removedType).toBe(addedType);
    expect(removedListener).toBe(addedListener);

    act(() => {
      window.dispatchEvent(new Event('resize'));
    });
    expect(handler).not.toHaveBeenCalled();
  });

  it('does not re-subscribe when the handler changes, yet calls the new handler', () => {
    const oldHandler = jest.fn();
    const newHandler = jest.fn();
    const { rerender } = renderHook(
      ({ handler }) => useEventListener(window, 'keydown', handler),
      { initialProps: { handler: oldHandler } }
    );

    rerender({ handler: newHandler });

    expect(addSpy).toHaveBeenCalledTimes(1);
    expect(removeSpy).not.toHaveBeenCalled();

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }));
    });

    expect(newHandler).toHaveBeenCalledTimes(1);
    expect(oldHandler).not.toHaveBeenCalled();
  });

  it('re-subscribes when the event type changes', () => {
    const handler = jest.fn();
    const { rerender } = renderHook(
      ({ type }) => useEventListener(window, type, handler),
      { initialProps: { type: 'keydown' } }
    );

    rerender({ type: 'keyup' });

    expect(removeSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
    expect(addSpy).toHaveBeenLastCalledWith('keyup', expect.any(Function));

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }));
    });
    expect(handler).not.toHaveBeenCalled();

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keyup', { key: 'a' }));
    });
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('moves the subscription when the target changes', () => {
    const handler = jest.fn();
    const button = document.createElement('button');
    document.body.appendChild(button);

    const { rerender } = renderHook(
      ({ target }: { target: EventTarget }) =>
        useEventListener(target, 'click', handler),
      { initialProps: { target: window as EventTarget } }
    );

    rerender({ target: button });

    // old target no longer notifies (dispatch a non-bubbling event on window)
    act(() => {
      window.dispatchEvent(new Event('click'));
    });
    expect(handler).not.toHaveBeenCalled();

    act(() => {
      button.dispatchEvent(new Event('click'));
    });
    expect(handler).toHaveBeenCalledTimes(1);

    button.remove();
  });

  it('does nothing when target is null', () => {
    const handler = jest.fn();
    expect(() =>
      renderHook(() => useEventListener(null, 'resize', handler))
    ).not.toThrow();

    expect(addSpy).not.toHaveBeenCalled();
  });
});
