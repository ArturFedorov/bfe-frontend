/** @jest-environment jsdom */
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AsyncButton } from './async_button';

function deferred<T = void>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe('AsyncButton', () => {
  it('renders the idle label and no error initially', () => {
    render(<AsyncButton label="Sync now" onSync={jest.fn()} />);
    expect(screen.getByRole('button', { name: 'Sync now' })).toBeEnabled();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('shows the pending label and disables the button while onSync is in flight', async () => {
    const user = userEvent.setup();
    const d = deferred();
    const onSync = jest.fn(() => d.promise);
    render(<AsyncButton label="Sync now" onSync={onSync} />);

    await user.click(screen.getByRole('button', { name: 'Sync now' }));

    const pendingButton = screen.getByRole('button', { name: 'Syncing…' });
    expect(pendingButton).toBeDisabled();
    expect(onSync).toHaveBeenCalledTimes(1);

    d.resolve();
    const idleButton = await screen.findByRole('button', { name: 'Sync now' });
    expect(idleButton).toBeEnabled();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('supports a custom pending label', async () => {
    const user = userEvent.setup();
    const d = deferred();
    render(
      <AsyncButton label="Sync now" pendingLabel="Working…" onSync={() => d.promise} />
    );

    await user.click(screen.getByRole('button', { name: 'Sync now' }));
    expect(screen.getByRole('button', { name: 'Working…' })).toBeDisabled();

    d.resolve();
    expect(await screen.findByRole('button', { name: 'Sync now' })).toBeEnabled();
  });

  it('fires onSync only once when double-clicked while pending', async () => {
    const user = userEvent.setup();
    const d = deferred();
    const onSync = jest.fn(() => d.promise);
    render(<AsyncButton label="Sync now" onSync={onSync} />);

    const button = screen.getByRole('button', { name: 'Sync now' });
    await user.click(button);
    await user.click(screen.getByRole('button', { name: 'Syncing…' }));
    await user.dblClick(screen.getByRole('button', { name: 'Syncing…' }));

    expect(onSync).toHaveBeenCalledTimes(1);

    d.resolve();
    expect(await screen.findByRole('button', { name: 'Sync now' })).toBeEnabled();
    expect(onSync).toHaveBeenCalledTimes(1);
  });

  it('announces an error via role=alert and re-enables the button on rejection', async () => {
    const user = userEvent.setup();
    const d = deferred();
    render(<AsyncButton label="Sync now" onSync={() => d.promise} />);

    await user.click(screen.getByRole('button', { name: 'Sync now' }));
    d.reject(new Error('pipeline unavailable'));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Sync failed. Try again.');
    expect(screen.getByRole('button', { name: 'Sync now' })).toBeEnabled();
  });

  it('clears the previous error when a retry starts and succeeds', async () => {
    const user = userEvent.setup();
    const first = deferred();
    const second = deferred();
    const onSync = jest
      .fn<Promise<void>, []>()
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise);
    render(
      <AsyncButton label="Sync now" errorMessage="Sync blew up" onSync={onSync} />
    );

    await user.click(screen.getByRole('button', { name: 'Sync now' }));
    first.reject(new Error('boom'));
    expect(await screen.findByRole('alert')).toHaveTextContent('Sync blew up');

    await user.click(screen.getByRole('button', { name: 'Sync now' }));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();

    second.resolve();
    expect(await screen.findByRole('button', { name: 'Sync now' })).toBeEnabled();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(onSync).toHaveBeenCalledTimes(2);
  });
});
