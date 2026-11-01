/** @jest-environment jsdom */
import '@testing-library/jest-dom';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { OptimisticToggle } from './optimistic_toggle';

function deferred<T = void>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

function setup(initialEnabled = false) {
  const calls: Array<ReturnType<typeof deferred<void>>> = [];
  const updateFlag = jest.fn((_enabled: boolean) => {
    const d = deferred();
    calls.push(d);
    return d.promise;
  });
  render(
    <OptimisticToggle
      label="Enable auto-QC"
      initialEnabled={initialEnabled}
      updateFlag={updateFlag}
    />
  );
  const toggle = () => screen.getByRole('switch', { name: 'Enable auto-QC' });
  return { calls, updateFlag, toggle };
}

describe('OptimisticToggle', () => {
  it('renders a labelled switch reflecting initialEnabled', () => {
    const { toggle } = setup(true);
    expect(toggle()).toHaveAttribute('aria-checked', 'true');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('flips optimistically before the save settles and calls updateFlag with the new value', async () => {
    const user = userEvent.setup();
    const { calls, updateFlag, toggle } = setup(false);

    await user.click(toggle());

    // the promise has NOT settled yet — the flip is already visible
    expect(toggle()).toHaveAttribute('aria-checked', 'true');
    expect(updateFlag).toHaveBeenCalledTimes(1);
    expect(updateFlag).toHaveBeenCalledWith(true);

    await act(async () => {
      calls[0].resolve();
    });

    // no flicker: still on after success, no error
    expect(toggle()).toHaveAttribute('aria-checked', 'true');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('rolls back and announces the error when the save rejects', async () => {
    const user = userEvent.setup();
    const { calls, toggle } = setup(false);

    await user.click(toggle());
    expect(toggle()).toHaveAttribute('aria-checked', 'true');

    await act(async () => {
      calls[0].reject(new Error('409 conflict'));
    });

    expect(toggle()).toHaveAttribute('aria-checked', 'false');
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Could not update Enable auto-QC'
    );
  });

  it('ignores clicks while a save is in flight', async () => {
    const user = userEvent.setup();
    const { calls, updateFlag, toggle } = setup(false);

    await user.click(toggle());
    await user.click(toggle());
    await user.dblClick(toggle());

    expect(updateFlag).toHaveBeenCalledTimes(1);
    expect(toggle()).toHaveAttribute('aria-checked', 'true');

    await act(async () => {
      calls[0].resolve();
    });
    expect(updateFlag).toHaveBeenCalledTimes(1);
    expect(toggle()).toHaveAttribute('aria-checked', 'true');
  });

  it('clears the error on retry and keeps the optimistic value on success', async () => {
    const user = userEvent.setup();
    const { calls, updateFlag, toggle } = setup(false);

    await user.click(toggle());
    await act(async () => {
      calls[0].reject(new Error('boom'));
    });
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(toggle()).toHaveAttribute('aria-checked', 'false');

    await user.click(toggle());
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(toggle()).toHaveAttribute('aria-checked', 'true');
    expect(updateFlag).toHaveBeenCalledTimes(2);
    expect(updateFlag).toHaveBeenLastCalledWith(true);

    await act(async () => {
      calls[1].resolve();
    });
    expect(toggle()).toHaveAttribute('aria-checked', 'true');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('toggles off optimistically from an enabled start', async () => {
    const user = userEvent.setup();
    const { calls, updateFlag, toggle } = setup(true);

    await user.click(toggle());
    expect(toggle()).toHaveAttribute('aria-checked', 'false');
    expect(updateFlag).toHaveBeenCalledWith(false);

    await act(async () => {
      calls[0].reject(new Error('boom'));
    });
    // rollback restores the enabled state
    expect(toggle()).toHaveAttribute('aria-checked', 'true');
  });
});
