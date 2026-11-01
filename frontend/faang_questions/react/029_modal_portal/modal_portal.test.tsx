/** @jest-environment jsdom */
import '@testing-library/jest-dom';
import { useState } from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Modal } from './modal_portal';

function Harness() {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button onClick={() => setOpen(true)}>Edit settings</button>
      <Modal open={open} onClose={() => setOpen(false)} title="Partner settings">
        <p>Webhook configuration</p>
        <button>Save</button>
      </Modal>
    </div>
  );
}

describe('029 Modal portal', () => {
  it('renders nothing while closed', () => {
    render(<Harness />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders the dialog into document.body via a portal, outside the root container', async () => {
    const user = userEvent.setup();
    const { container, baseElement } = render(<Harness />);
    await user.click(screen.getByRole('button', { name: 'Edit settings' }));

    expect(container.querySelector('[role="dialog"]')).toBeNull();
    const dialog = within(baseElement).getByRole('dialog', {
      name: 'Partner settings',
    });
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(
      within(dialog).getByRole('heading', { name: 'Partner settings' }),
    ).toBeInTheDocument();
  });

  it('moves focus to the dialog on open', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(screen.getByRole('button', { name: 'Edit settings' }));
    expect(screen.getByRole('dialog')).toHaveFocus();
  });

  it('closes on Escape and returns focus to the trigger', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const trigger = screen.getByRole('button', { name: 'Edit settings' });
    await user.click(trigger);
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it('closes on backdrop click but not on clicks inside the dialog', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(screen.getByRole('button', { name: 'Edit settings' }));
    const dialog = screen.getByRole('dialog');

    await user.click(within(dialog).getByText('Webhook configuration'));
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    await user.click(dialog.parentElement as HTMLElement);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Edit settings' }),
    ).toHaveFocus();
  });

  it('locks body scroll while open and restores it on close', async () => {
    const user = userEvent.setup();
    document.body.style.overflow = 'auto';
    render(<Harness />);
    await user.click(screen.getByRole('button', { name: 'Edit settings' }));
    expect(document.body.style.overflow).toBe('hidden');

    await user.keyboard('{Escape}');
    expect(document.body.style.overflow).toBe('auto');
    document.body.style.overflow = '';
  });

  it('restores body scroll and focus when unmounted while open', async () => {
    const user = userEvent.setup();
    const { unmount } = render(<Harness />);
    await user.click(screen.getByRole('button', { name: 'Edit settings' }));
    expect(document.body.style.overflow).toBe('hidden');

    unmount();
    expect(document.body.style.overflow).toBe('');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
