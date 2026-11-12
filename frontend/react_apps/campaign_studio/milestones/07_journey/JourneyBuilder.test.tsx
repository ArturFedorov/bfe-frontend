/** @jest-environment jsdom */
import '@testing-library/jest-dom';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createApi } from '../../shell/api';
import { customers, journeys } from '../../shell/fixtures';
import { JourneyBuilder } from './JourneyBuilder';

const [welcome, winBack] = journeys;

async function renderBuilder(journeyId: string) {
  const api = createApi({ latencyMs: 0 });
  render(<JourneyBuilder api={api} journeyId={journeyId} />);
  await screen.findByRole('list', { name: 'Journey outline' });
  return api;
}

describe('JourneyBuilder', () => {
  it('loads the journey and renders an outline item per node with label, type and outgoing edges', async () => {
    await renderBuilder('j1');
    expect(
      screen.getByRole('heading', { name: welcome.name }),
    ).toBeInTheDocument();
    const items = within(
      screen.getByRole('list', { name: 'Journey outline' }),
    ).getAllByRole('listitem');
    expect(items).toHaveLength(welcome.nodes.length);
    welcome.nodes.forEach((node, i) => {
      expect(items[i]).toHaveTextContent(node.label);
      expect(items[i]).toHaveTextContent(node.type);
    });
    // the branch node lists both labelled outcomes with the target's label
    const branch = items[welcome.nodes.findIndex((n) => n.id === 'opened')];
    expect(branch).toHaveTextContent(/yes.*Send offer/);
    expect(branch).toHaveTextContent(/no.*Send push nudge/);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Simulate' })).toBeEnabled();
  });

  it('shows validation problems for j2 (cycle + unreachable) and disables Simulate', async () => {
    await renderBuilder('j2');
    expect(
      screen.getByRole('heading', { name: winBack.name }),
    ).toBeInTheDocument();
    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('CYCLE');
    expect(alert).toHaveTextContent('UNREACHABLE');
    expect(alert).toHaveTextContent('legacy_sms');
    expect(screen.getByRole('button', { name: 'Simulate' })).toBeDisabled();
  });

  it('Add node appends to the outline and the validation alert follows', async () => {
    const user = userEvent.setup();
    await renderBuilder('j1');
    await user.selectOptions(
      screen.getByRole('combobox', { name: 'Node type' }),
      'send',
    );
    await user.type(
      screen.getByRole('textbox', { name: 'Label' }),
      'Follow-up email',
    );
    await user.click(screen.getByRole('button', { name: 'Add node' }));

    const items = within(
      screen.getByRole('list', { name: 'Journey outline' }),
    ).getAllByRole('listitem');
    expect(items).toHaveLength(welcome.nodes.length + 1);
    expect(items[items.length - 1]).toHaveTextContent('Follow-up email');
    expect(items[items.length - 1]).toHaveTextContent('send');

    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('UNREACHABLE');
    expect(alert).toHaveTextContent('DEAD_END');
    expect(alert).toHaveTextContent('MISSING_CONFIG');
    expect(screen.getByRole('button', { name: 'Simulate' })).toBeDisabled();
    expect(screen.getByRole('textbox', { name: 'Label' })).toHaveValue('');
  });

  it('Simulate runs the first four customers through the journey; Save persists through the api', async () => {
    const user = userEvent.setup();
    const api = await renderBuilder('j1');
    await user.click(screen.getByRole('button', { name: 'Simulate' }));

    // j1: every customer passes exactly two `send` nodes (welcome, then offer or nudge) and exits once.
    const sample = Math.min(4, customers.length);
    const sendsPerCustomer = 2;
    const status = await screen.findByRole('status');
    expect(status).toHaveTextContent(new RegExp(`${sample} entered`));
    expect(status).toHaveTextContent(
      new RegExp(`${sample * sendsPerCustomer} sent`),
    );
    expect(status).toHaveTextContent(new RegExp(`${sample} exited`));
    expect(api.calls.listCustomers).toBe(1);

    expect(api.calls.saveJourney).toBe(0);
    await user.click(screen.getByRole('button', { name: 'Save' }));
    await screen.findByText(/saved/i);
    expect(api.calls.saveJourney).toBe(1);
    const persisted = await api.getJourney('j1');
    expect(persisted.nodes).toHaveLength(welcome.nodes.length);
    expect(persisted.updatedAt).not.toBe(welcome.updatedAt);
  });
});
