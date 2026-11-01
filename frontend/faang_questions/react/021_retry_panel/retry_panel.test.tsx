/** @jest-environment jsdom */
import '@testing-library/jest-dom';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RetryPanel } from './retry_panel';

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

function setup(props: { initialDelayMs?: number; maxDelayMs?: number } = {}) {
  const calls: Array<ReturnType<typeof deferred<string>>> = [];
  const runCheck = jest.fn(() => {
    const d = deferred<string>();
    calls.push(d);
    return d.promise;
  });
  const utils = render(
    <RetryPanel runCheck={runCheck} initialDelayMs={3000} {...props} />
  );
  return { calls, runCheck, ...utils };
}

function tickSeconds(seconds: number) {
  for (let i = 0; i < seconds; i++) {
    act(() => {
      jest.advanceTimersByTime(1000);
    });
  }
}

beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

describe('RetryPanel', () => {
  it('runs the check on mount and shows the success message', async () => {
    const { calls, runCheck } = setup();

    expect(runCheck).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('status')).toHaveTextContent('Checking integration…');

    await act(async () => {
      calls[0].resolve('Connected to partner-42');
    });

    expect(screen.getByRole('status')).toHaveTextContent('Connected to partner-42');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.queryByText(/Retrying in/)).not.toBeInTheDocument();

    tickSeconds(120);
    expect(runCheck).toHaveBeenCalledTimes(1);
  });

  it('announces the failure and counts down before auto-retrying', async () => {
    const { calls, runCheck } = setup();

    await act(async () => {
      calls[0].reject(new Error('Connection refused'));
    });

    expect(screen.getByRole('alert')).toHaveTextContent('Connection refused');
    expect(screen.getByText('Retrying in 3s')).toBeInTheDocument();

    tickSeconds(1);
    expect(screen.getByText('Retrying in 2s')).toBeInTheDocument();
    expect(runCheck).toHaveBeenCalledTimes(1);

    tickSeconds(2);
    expect(runCheck).toHaveBeenCalledTimes(2);
    expect(screen.getByRole('status')).toHaveTextContent('Checking integration…');
  });

  it('doubles the delay per consecutive failure and caps it at maxDelayMs', async () => {
    const { calls, runCheck } = setup({ maxDelayMs: 10000 });

    await act(async () => {
      calls[0].reject(new Error('Connection refused'));
    });
    expect(screen.getByText('Retrying in 3s')).toBeInTheDocument();

    tickSeconds(3);
    expect(runCheck).toHaveBeenCalledTimes(2);
    await act(async () => {
      calls[1].reject(new Error('Connection refused'));
    });
    expect(screen.getByText('Retrying in 6s')).toBeInTheDocument();

    tickSeconds(6);
    expect(runCheck).toHaveBeenCalledTimes(3);
    await act(async () => {
      calls[2].reject(new Error('Connection refused'));
    });
    // 3s → 6s → 12s, capped at 10s
    expect(screen.getByText('Retrying in 10s')).toBeInTheDocument();
  });

  it('retries immediately when Retry now is clicked and success clears the alert', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    const { calls, runCheck } = setup();

    await act(async () => {
      calls[0].reject(new Error('Connection refused'));
    });
    expect(screen.getByText('Retrying in 3s')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Retry now' }));
    expect(runCheck).toHaveBeenCalledTimes(2);
    expect(screen.getByRole('status')).toHaveTextContent('Checking integration…');

    await act(async () => {
      calls[1].resolve('Connected to partner-42');
    });
    expect(screen.getByRole('status')).toHaveTextContent('Connected to partner-42');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.queryByText(/Retrying in/)).not.toBeInTheDocument();
  });

  it('cancels the auto-retry on unmount', async () => {
    const { calls, runCheck, unmount } = setup();

    await act(async () => {
      calls[0].reject(new Error('Connection refused'));
    });
    expect(screen.getByText('Retrying in 3s')).toBeInTheDocument();

    unmount();
    tickSeconds(30);
    expect(runCheck).toHaveBeenCalledTimes(1);
  });

  it('does not update state when the check settles after unmount', async () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const { calls, unmount } = setup();

    unmount();
    await act(async () => {
      calls[0].reject(new Error('Connection refused'));
    });

    expect(errorSpy).not.toHaveBeenCalled();
    errorSpy.mockRestore();
  });
});
