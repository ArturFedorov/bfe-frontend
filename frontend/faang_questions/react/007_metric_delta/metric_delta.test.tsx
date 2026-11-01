/** @jest-environment jsdom */
import '@testing-library/jest-dom';
import { render, renderHook, screen } from '@testing-library/react';
import { MetricDelta, usePrevious } from './metric_delta';

describe('usePrevious', () => {
  it('returns undefined on the first render', () => {
    const { result } = renderHook(() => usePrevious(10));
    expect(result.current).toBeUndefined();
  });

  it('returns the value from the immediately preceding render', () => {
    const { result, rerender } = renderHook(({ value }) => usePrevious(value), {
      initialProps: { value: 10 },
    });
    rerender({ value: 20 });
    expect(result.current).toBe(10);
    rerender({ value: 30 });
    expect(result.current).toBe(20);
  });

  it('tracks the previous render, not the previous distinct value', () => {
    const { result, rerender } = renderHook(({ value }) => usePrevious(value), {
      initialProps: { value: 10 },
    });
    rerender({ value: 20 });
    rerender({ value: 20 });
    expect(result.current).toBe(20);
  });
});

describe('MetricDelta', () => {
  it('renders a group named after the label with the current value', () => {
    render(<MetricDelta label="Assets delivered" value={128} />);
    const group = screen.getByRole('group', { name: 'Assets delivered' });
    expect(group).toHaveTextContent('Assets delivered');
    expect(group).toHaveTextContent('128');
  });

  it('shows an em dash on the first render (no previous data)', () => {
    render(<MetricDelta label="Assets delivered" value={128} />);
    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('shows a positive delta after the value increases', () => {
    const { rerender } = render(<MetricDelta label="Assets delivered" value={128} />);
    rerender(<MetricDelta label="Assets delivered" value={131} />);
    const group = screen.getByRole('group', { name: 'Assets delivered' });
    expect(group).toHaveTextContent('131');
    expect(screen.getByText('+3')).toBeInTheDocument();
  });

  it('shows a negative delta after the value decreases', () => {
    const { rerender } = render(<MetricDelta label="Assets delivered" value={128} />);
    rerender(<MetricDelta label="Assets delivered" value={126} />);
    expect(screen.getByText('-2')).toBeInTheDocument();
  });

  it('shows 0 when a rerender delivers the same value', () => {
    const { rerender } = render(<MetricDelta label="Assets delivered" value={128} />);
    rerender(<MetricDelta label="Assets delivered" value={131} />);
    rerender(<MetricDelta label="Assets delivered" value={131} />);
    expect(screen.getByText('0')).toBeInTheDocument();
    expect(screen.queryByText('+3')).not.toBeInTheDocument();
  });
});
