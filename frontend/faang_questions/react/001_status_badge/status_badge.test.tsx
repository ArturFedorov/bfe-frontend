/** @jest-environment jsdom */
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { StatusBadge } from './status_badge';

describe('StatusBadge', () => {
  it.each([
    ['connected', 'Connected', 'badge--success'],
    ['degraded', 'Degraded', 'badge--warning'],
    ['disconnected', 'Disconnected', 'badge--danger'],
    ['pending', 'Pending', 'badge--info'],
  ] as const)('renders %s as "%s" with %s', (status, label, variantClass) => {
    render(<StatusBadge status={status} />);
    const badge = screen.getByRole('status');
    expect(badge).toHaveTextContent(label);
    expect(badge).toHaveClass('badge', variantClass);
  });

  it('falls back to a neutral Unknown badge for an unrecognized status', () => {
    render(<StatusBadge status="EXPERIMENTAL_V2" />);
    const badge = screen.getByRole('status');
    expect(badge).toHaveTextContent('Unknown');
    expect(badge).toHaveClass('badge', 'badge--neutral');
  });

  it('falls back safely for an empty string status', () => {
    render(<StatusBadge status="" />);
    const badge = screen.getByRole('status');
    expect(badge).toHaveTextContent('Unknown');
    expect(badge).toHaveClass('badge--neutral');
  });

  it('exposes the label as visible text, not icon-only rendering', () => {
    render(<StatusBadge status="connected" />);
    expect(screen.getByText('Connected')).toBeVisible();
  });
});
