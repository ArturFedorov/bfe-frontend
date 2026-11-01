/** @jest-environment jsdom */
import '@testing-library/jest-dom';
import { memo } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  DashboardProvider,
  LaggyDashboardProvider,
  dashboardReducer,
  initialDashboardState,
  useDashboardDispatch,
  useDashboardState,
  useLaggyDashboard,
} from './context_splitting';

describe('dashboardReducer', () => {
  it('refresh increments refreshCount', () => {
    const next = dashboardReducer(initialDashboardState, { type: 'refresh' });
    expect(next.refreshCount).toBe(1);
    expect(next.region).toBe('all');
  });

  it('setRegion updates the region', () => {
    const next = dashboardReducer(initialDashboardState, { type: 'setRegion', region: 'emea' });
    expect(next.region).toBe('emea');
  });
});

describe('laggy baseline (given): one context for state + dispatch', () => {
  it('re-renders dispatch-only consumers on every state change', async () => {
    const renders = { panel: 0, button: 0 };

    const Panel = memo(function Panel() {
      renders.panel += 1;
      const { state } = useLaggyDashboard();
      return <p>refreshes: {state.refreshCount}</p>;
    });

    const RefreshButton = memo(function RefreshButton() {
      renders.button += 1;
      const { dispatch } = useLaggyDashboard();
      return <button onClick={() => dispatch({ type: 'refresh' })}>Refresh</button>;
    });

    const user = userEvent.setup();
    render(
      <LaggyDashboardProvider>
        <Panel />
        <RefreshButton />
      </LaggyDashboardProvider>,
    );
    expect(renders).toEqual({ panel: 1, button: 1 });

    await user.click(screen.getByRole('button', { name: 'Refresh' }));
    await user.click(screen.getByRole('button', { name: 'Refresh' }));

    expect(screen.getByText('refreshes: 2')).toBeInTheDocument();
    // The flaw this task exists to fix: the button re-rendered with every update.
    expect(renders.button).toBe(3);
    expect(renders.panel).toBe(3);
  });
});

describe('split contexts: DashboardProvider', () => {
  function setup() {
    const renders = { panel: 0, button: 0 };

    const Panel = memo(function Panel() {
      renders.panel += 1;
      const state = useDashboardState();
      return (
        <p>
          refreshes: {state.refreshCount} in {state.region}
        </p>
      );
    });

    const RefreshButton = memo(function RefreshButton() {
      renders.button += 1;
      const dispatch = useDashboardDispatch();
      return <button onClick={() => dispatch({ type: 'refresh' })}>Refresh</button>;
    });

    render(
      <DashboardProvider>
        <Panel />
        <RefreshButton />
      </DashboardProvider>,
    );
    return renders;
  }

  it('state consumers see fresh data after dispatch', async () => {
    const user = userEvent.setup();
    setup();
    expect(screen.getByText('refreshes: 0 in all')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Refresh' }));
    await user.click(screen.getByRole('button', { name: 'Refresh' }));
    expect(screen.getByText('refreshes: 2 in all')).toBeInTheDocument();
  });

  it('dispatch-only consumers do NOT re-render on state changes', async () => {
    const user = userEvent.setup();
    const renders = setup();
    expect(renders).toEqual({ panel: 1, button: 1 });

    await user.click(screen.getByRole('button', { name: 'Refresh' }));
    await user.click(screen.getByRole('button', { name: 'Refresh' }));

    expect(renders.panel).toBe(3); // state consumer tracked both updates
    expect(renders.button).toBe(1); // dispatch identity is stable — no re-render
  });

  it('useDashboardState throws a helpful error outside the provider', () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    function Orphan() {
      useDashboardState();
      return null;
    }
    expect(() => render(<Orphan />)).toThrow(/useDashboardState.*DashboardProvider/);
    consoleError.mockRestore();
  });

  it('useDashboardDispatch throws a helpful error outside the provider', () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    function Orphan() {
      useDashboardDispatch();
      return null;
    }
    expect(() => render(<Orphan />)).toThrow(/useDashboardDispatch.*DashboardProvider/);
    consoleError.mockRestore();
  });
});
