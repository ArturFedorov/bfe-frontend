/** @jest-environment jsdom */
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AdminPanelLoader, type PanelModule } from './lazy_admin_panel';

function HeavyPanel() {
  return <h2>Admin controls</h2>;
}

function deferred() {
  let resolve!: (value: PanelModule) => void;
  let reject!: (reason: Error) => void;
  const promise = new Promise<PanelModule>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe('046 lazy admin panel — behavior (must keep passing)', () => {
  it('opens and eventually shows the panel once the module arrives', async () => {
    const user = userEvent.setup();
    const d = deferred();
    render(<AdminPanelLoader loadPanel={() => d.promise} />);

    expect(screen.queryByText('Admin controls')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Open admin panel' }));
    d.resolve({ default: HeavyPanel });

    expect(await screen.findByText('Admin controls')).toBeVisible();
  });
});

describe('046 lazy admin panel — lazy loading contract (fail until fixed)', () => {
  it('does NOT import the panel on mount — only on demand', () => {
    const factory = jest.fn(() => deferred().promise);
    render(<AdminPanelLoader loadPanel={factory} />);
    expect(factory).not.toHaveBeenCalled();
  });

  it('shows the Suspense fallback while the chunk is in flight', async () => {
    const user = userEvent.setup();
    const d = deferred();
    render(<AdminPanelLoader loadPanel={() => d.promise} />);

    await user.click(screen.getByRole('button', { name: 'Open admin panel' }));
    expect(screen.getByText('Loading admin panel…')).toBeVisible();

    d.resolve({ default: HeavyPanel });
    expect(await screen.findByText('Admin controls')).toBeVisible();
    expect(screen.queryByText('Loading admin panel…')).not.toBeInTheDocument();
  });

  it('shows the error fallback when the chunk fails to load', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    try {
      const user = userEvent.setup();
      const d = deferred();
      render(<AdminPanelLoader loadPanel={() => d.promise} />);

      await user.click(screen.getByRole('button', { name: 'Open admin panel' }));
      d.reject(new Error('ChunkLoadError'));

      expect(await screen.findByRole('alert')).toHaveTextContent('Failed to load admin panel');
      expect(screen.queryByText('Admin controls')).not.toBeInTheDocument();
    } finally {
      consoleError.mockRestore();
    }
  });

  it('hovering the trigger preloads the chunk exactly once', async () => {
    const user = userEvent.setup();
    const d = deferred();
    const factory = jest.fn(() => d.promise);
    render(<AdminPanelLoader loadPanel={factory} />);

    const button = screen.getByRole('button', { name: 'Open admin panel' });
    expect(factory).not.toHaveBeenCalled();

    await user.hover(button);
    expect(factory).toHaveBeenCalledTimes(1);

    // Re-hovering and clicking reuse the in-flight promise.
    await user.unhover(button);
    await user.hover(button);
    await user.click(button);
    expect(factory).toHaveBeenCalledTimes(1);

    d.resolve({ default: HeavyPanel });
    expect(await screen.findByText('Admin controls')).toBeVisible();
    expect(factory).toHaveBeenCalledTimes(1);
  });
});
