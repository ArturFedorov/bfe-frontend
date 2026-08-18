/** @jest-environment jsdom */
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DeliveryTable, DELIVERIES } from './memo_boundaries';

function rowRenderIds(probe: jest.Mock): string[] {
  return probe.mock.calls
    .map((call) => call[0] as string)
    .filter((id) => id.startsWith('row-'));
}

describe('041 memo boundaries — behavior (must keep passing)', () => {
  it('renders all 100 rows', () => {
    render(<DeliveryTable />);
    expect(screen.getAllByRole('listitem')).toHaveLength(100);
    expect(screen.getByText(/Delivery 0 · EMEA/)).toBeInTheDocument();
    expect(screen.getByText(/Delivery 99 · NA/)).toBeInTheDocument();
  });

  it('selecting a row marks it selected; selecting another moves the mark', async () => {
    const user = userEvent.setup();
    render(<DeliveryTable />);

    await user.click(screen.getByRole('button', { name: 'Select Delivery 5' }));
    expect(screen.getByText(/Delivery 5 · .+ \(selected\)/)).toBeVisible();

    await user.click(screen.getByRole('button', { name: 'Select Delivery 7' }));
    expect(screen.getByText(/Delivery 7 · .+ \(selected\)/)).toBeVisible();
    expect(screen.queryByText(/Delivery 5 · .+ \(selected\)/)).not.toBeInTheDocument();
  });

  it('the notes field stays a normal controlled input', async () => {
    const user = userEvent.setup();
    render(<DeliveryTable />);
    const input = screen.getByLabelText('Shift notes');
    await user.type(input, 'abc');
    expect(input).toHaveValue('abc');
    expect(screen.getByText('Note length: 3')).toBeVisible();
  });
});

describe('041 memo boundaries — render counts (fail until fixed)', () => {
  it('typing in the unrelated notes field re-renders ZERO rows', async () => {
    const user = userEvent.setup();
    const probe = jest.fn();
    render(<DeliveryTable onRender={probe} />);
    probe.mockClear();

    await user.type(screen.getByLabelText('Shift notes'), 'abc');

    // The table itself re-renders (its state changed) …
    expect(probe.mock.calls.filter((c) => c[0] === 'table')).toHaveLength(3);
    // … but no row prop changed, so no row may re-render.
    expect(rowRenderIds(probe)).toHaveLength(0);
  });

  it('selecting a row re-renders ONLY that row', async () => {
    const user = userEvent.setup();
    const probe = jest.fn();
    render(<DeliveryTable onRender={probe} />);
    probe.mockClear();

    await user.click(screen.getByRole('button', { name: 'Select Delivery 5' }));
    expect(rowRenderIds(probe)).toEqual(['row-d-5']);
  });

  it('moving the selection re-renders only the two affected rows', async () => {
    const user = userEvent.setup();
    const probe = jest.fn();
    render(<DeliveryTable onRender={probe} />);
    await user.click(screen.getByRole('button', { name: 'Select Delivery 5' }));
    probe.mockClear();

    await user.click(screen.getByRole('button', { name: 'Select Delivery 7' }));
    expect(rowRenderIds(probe).sort()).toEqual(['row-d-5', 'row-d-7']);
  });

  it('sanity: every row still renders exactly once on mount', () => {
    const probe = jest.fn();
    render(<DeliveryTable />);
    render(<DeliveryTable onRender={probe} />);
    expect(rowRenderIds(probe)).toHaveLength(DELIVERIES.length);
  });
});
