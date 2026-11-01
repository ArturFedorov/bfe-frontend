/** @jest-environment jsdom */
import '@testing-library/jest-dom';
import { readFileSync } from 'fs';
import { join } from 'path';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DeliveryDashboard } from './derived_data_memo';

async function setQuery(user: ReturnType<typeof userEvent.setup>, text: string) {
  const input = screen.getByLabelText('Search');
  await user.click(input);
  await user.paste(text); // one change event → one derivation, keeps counts readable
}

describe('044 derived data memo — behavior (must keep passing)', () => {
  it('shows the match count and the first 20 rows', () => {
    render(<DeliveryDashboard />);
    expect(screen.getByText('10000 matches')).toBeVisible();
    expect(screen.getAllByRole('listitem')).toHaveLength(20);
  });

  it('filters by title substring', async () => {
    const user = userEvent.setup();
    render(<DeliveryDashboard />);
    await setQuery(user, 'Delivery 123');
    // Delivery 123, 1230..1239
    expect(screen.getByText('11 matches')).toBeVisible();
    expect(screen.getAllByRole('listitem')).toHaveLength(11);
    expect(screen.getAllByRole('listitem')[0]).toHaveTextContent('Delivery 123 — eta 551');
  });

  it('sorts by eta', async () => {
    const user = userEvent.setup();
    render(<DeliveryDashboard />);
    await setQuery(user, 'Delivery 123');
    await user.selectOptions(screen.getByLabelText('Sort by'), 'eta');
    expect(screen.getAllByRole('listitem')[0]).toHaveTextContent('Delivery 1230 — eta 510');
  });

  it('compact mode toggles the density line', async () => {
    const user = userEvent.setup();
    render(<DeliveryDashboard />);
    await user.click(screen.getByLabelText('Compact mode'));
    expect(screen.getByText('Density: compact')).toBeVisible();
  });
});

describe('044 derived data memo — derivation budget (fail until fixed)', () => {
  it('derives exactly once on mount', () => {
    const onDerive = jest.fn();
    render(<DeliveryDashboard onDerive={onDerive} />);
    expect(onDerive).toHaveBeenCalledTimes(1);
  });

  it('unrelated state changes do NOT re-run the derivation', async () => {
    const user = userEvent.setup();
    const onDerive = jest.fn();
    render(<DeliveryDashboard onDerive={onDerive} />);
    onDerive.mockClear();

    await user.click(screen.getByLabelText('Compact mode'));
    await user.click(screen.getByLabelText('Compact mode'));

    expect(screen.getByText('Density: comfortable')).toBeVisible();
    expect(onDerive).not.toHaveBeenCalled();
  });

  it('query and sort changes re-run the derivation exactly once each', async () => {
    const user = userEvent.setup();
    const onDerive = jest.fn();
    render(<DeliveryDashboard onDerive={onDerive} />);
    onDerive.mockClear();

    await setQuery(user, 'Delivery 123');
    expect(onDerive).toHaveBeenCalledTimes(1);

    await user.selectOptions(screen.getByLabelText('Sort by'), 'eta');
    expect(onDerive).toHaveBeenCalledTimes(2);
  });
});

describe('044 derived data memo — no derived data in state', () => {
  it('does not mirror the derivation into state via useEffect', () => {
    const source = readFileSync(join(__dirname, 'derived_data_memo.tsx'), 'utf8');
    // Matches a useEffect CALL (imports/comments may mention the name).
    expect(source).not.toMatch(/useEffect\s*\(/);
  });
});
