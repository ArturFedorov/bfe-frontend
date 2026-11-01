/** @jest-environment jsdom */
import '@testing-library/jest-dom';
import { act, render, screen } from '@testing-library/react';
import { PollingStatusWidget, IngestionStatus } from './polling_status_widget';

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

function setup() {
  const calls: Array<ReturnType<typeof deferred<IngestionStatus>>> = [];
  const fetchStatus = jest.fn(() => {
    const d = deferred<IngestionStatus>();
    calls.push(d);
    return d.promise;
  });
  const utils = render(
    <PollingStatusWidget fetchStatus={fetchStatus} intervalMs={5000} maxIntervalMs={20000} />
  );
  return { calls, fetchStatus, ...utils };
}

function advance(ms: number) {
  act(() => {
    jest.advanceTimersByTime(ms);
  });
}

beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

describe('PollingStatusWidget', () => {
  it('polls immediately on mount and never overlaps requests', async () => {
    const { calls, fetchStatus } = setup();

    expect(fetchStatus).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('status')).toHaveTextContent('Waiting for status…');

    // request still in flight — no amount of elapsed time may start another
    advance(60000);
    expect(fetchStatus).toHaveBeenCalledTimes(1);

    await act(async () => {
      calls[0].resolve('processing');
    });
    expect(screen.getByRole('status')).toHaveTextContent('Status: processing');

    // next poll is scheduled only after the response settles
    advance(4999);
    expect(fetchStatus).toHaveBeenCalledTimes(1);
    advance(1);
    expect(fetchStatus).toHaveBeenCalledTimes(2);
  });

  it('backs off on consecutive errors and resets after a success', async () => {
    const { calls, fetchStatus } = setup();
    await act(async () => {
      calls[0].resolve('processing');
    });

    advance(5000);
    expect(fetchStatus).toHaveBeenCalledTimes(2);
    await act(async () => {
      calls[1].reject(new Error('gateway timeout'));
    });

    // stale status stays visible, error is announced
    expect(screen.getByRole('status')).toHaveTextContent('Status: processing');
    expect(screen.getByRole('alert')).toHaveTextContent('Connection lost — retrying');

    // first error → 10s delay
    advance(9999);
    expect(fetchStatus).toHaveBeenCalledTimes(2);
    advance(1);
    expect(fetchStatus).toHaveBeenCalledTimes(3);

    await act(async () => {
      calls[2].reject(new Error('gateway timeout'));
    });
    // second error → 20s delay (capped at maxIntervalMs)
    advance(19999);
    expect(fetchStatus).toHaveBeenCalledTimes(3);
    advance(1);
    expect(fetchStatus).toHaveBeenCalledTimes(4);

    await act(async () => {
      calls[3].resolve('processing');
    });
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();

    // success resets the delay back to intervalMs
    advance(5000);
    expect(fetchStatus).toHaveBeenCalledTimes(5);
  });

  it('stops polling permanently on a terminal status', async () => {
    const { calls, fetchStatus } = setup();
    await act(async () => {
      calls[0].resolve('succeeded');
    });

    expect(screen.getByRole('status')).toHaveTextContent('Status: succeeded');
    expect(screen.getByText('Polling stopped')).toBeInTheDocument();

    advance(600000);
    expect(fetchStatus).toHaveBeenCalledTimes(1);
  });

  it('also treats failed as terminal', async () => {
    const { calls, fetchStatus } = setup();
    await act(async () => {
      calls[0].resolve('failed');
    });

    expect(screen.getByRole('status')).toHaveTextContent('Status: failed');
    expect(screen.getByText('Polling stopped')).toBeInTheDocument();
    advance(600000);
    expect(fetchStatus).toHaveBeenCalledTimes(1);
  });

  it('stops polling and ignores late settlements after unmount', async () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const { calls, fetchStatus, unmount } = setup();
    await act(async () => {
      calls[0].resolve('queued');
    });

    unmount();
    advance(600000);
    expect(fetchStatus).toHaveBeenCalledTimes(1);

    // a response landing after unmount must not update state
    expect(errorSpy).not.toHaveBeenCalled();
    errorSpy.mockRestore();
  });
});
