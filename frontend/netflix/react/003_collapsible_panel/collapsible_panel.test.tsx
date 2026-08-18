/** @jest-environment jsdom */
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CollapsiblePanel } from './collapsible_panel';

describe('CollapsiblePanel', () => {
  it('starts closed by default with aria-expanded=false', () => {
    render(
      <CollapsiblePanel title="Delivery history">
        <p>10 deliveries</p>
      </CollapsiblePanel>,
    );
    const header = screen.getByRole('button', { name: 'Delivery history' });
    expect(header).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByText('10 deliveries')).not.toBeInTheDocument();
  });

  it('starts open when defaultOpen is set', () => {
    render(
      <CollapsiblePanel title="QC notes" defaultOpen>
        <p>All checks passed</p>
      </CollapsiblePanel>,
    );
    expect(screen.getByRole('button', { name: 'QC notes' })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
    expect(screen.getByRole('region', { name: 'QC notes' })).toBeVisible();
    expect(screen.getByText('All checks passed')).toBeVisible();
  });

  it('toggles open and closed on header clicks', async () => {
    const user = userEvent.setup();
    render(
      <CollapsiblePanel title="Encoding profile">
        <p>H.264 main</p>
      </CollapsiblePanel>,
    );
    const header = screen.getByRole('button', { name: 'Encoding profile' });
    await user.click(header);
    expect(header).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('H.264 main')).toBeVisible();
    await user.click(header);
    expect(header).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByText('H.264 main')).not.toBeInTheDocument();
  });

  it('points aria-controls at the content region', () => {
    render(
      <CollapsiblePanel title="QC notes" defaultOpen>
        <p>notes</p>
      </CollapsiblePanel>,
    );
    const header = screen.getByRole('button', { name: 'QC notes' });
    const region = screen.getByRole('region', { name: 'QC notes' });
    expect(header.getAttribute('aria-controls')).toBe(region.id);
  });

  it('unmount mode destroys child state on collapse', async () => {
    const user = userEvent.setup();
    render(
      <CollapsiblePanel title="QC notes" defaultOpen mode="unmount">
        <input aria-label="Notes" />
      </CollapsiblePanel>,
    );
    const header = screen.getByRole('button', { name: 'QC notes' });
    await user.type(screen.getByRole('textbox', { name: 'Notes' }), 'draft note');
    await user.click(header);
    expect(screen.queryByRole('textbox', { name: 'Notes' })).not.toBeInTheDocument();
    await user.click(header);
    expect(screen.getByRole('textbox', { name: 'Notes' })).toHaveValue('');
  });

  it('hidden mode keeps the content mounted and preserves child state', async () => {
    const user = userEvent.setup();
    render(
      <CollapsiblePanel title="QC notes" defaultOpen mode="hidden">
        <input aria-label="Notes" />
      </CollapsiblePanel>,
    );
    const header = screen.getByRole('button', { name: 'QC notes' });
    const notes = screen.getByRole('textbox', { name: 'Notes' });
    await user.type(notes, 'draft note');
    await user.click(header);
    expect(notes).toBeInTheDocument();
    expect(notes).not.toBeVisible();
    await user.click(header);
    expect(screen.getByRole('textbox', { name: 'Notes' })).toHaveValue('draft note');
    expect(notes).toBeVisible();
  });
});
