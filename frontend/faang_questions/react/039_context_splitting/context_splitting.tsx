import { Dispatch, ReactElement, ReactNode, createContext, useContext, useReducer } from 'react';

export interface DashboardState {
  refreshCount: number;
  region: string;
}

export type DashboardAction = { type: 'refresh' } | { type: 'setRegion'; region: string };

export const initialDashboardState: DashboardState = {
  refreshCount: 0,
  region: 'all',
};

export function dashboardReducer(
  state: DashboardState,
  action: DashboardAction,
): DashboardState {
  switch (action.type) {
    case 'refresh':
      return { ...state, refreshCount: state.refreshCount + 1 };
    case 'setRegion':
      return { ...state, region: action.region };
  }
}

// ---------------------------------------------------------------------------
// Laggy baseline — GIVEN, do not fix. One context carries { state, dispatch },
// rebuilt as a fresh object on every provider render, so every consumer
// re-renders on every state change, even ones that only need dispatch.
// ---------------------------------------------------------------------------

export interface LaggyDashboardValue {
  state: DashboardState;
  dispatch: Dispatch<DashboardAction>;
}

const LaggyDashboardContext = createContext<LaggyDashboardValue | null>(null);

export function LaggyDashboardProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(dashboardReducer, initialDashboardState);
  // The flaw: a new object identity every render.
  const value = { state, dispatch };
  return (
    <LaggyDashboardContext.Provider value={value}>{children}</LaggyDashboardContext.Provider>
  );
}

export function useLaggyDashboard(): LaggyDashboardValue {
  const context = useContext(LaggyDashboardContext);
  if (context === null) {
    throw new Error('useLaggyDashboard must be used within a <LaggyDashboardProvider>');
  }
  return context;
}

// ---------------------------------------------------------------------------
// Your fix: split state and dispatch into separate contexts so that
// dispatch-only consumers stop re-rendering on state changes.
// ---------------------------------------------------------------------------

export function DashboardProvider({ children }: { children: ReactNode }): ReactElement {
  // TODO: implement — same reducer, two nested context providers: one for the
  // state value, one for the (stable) dispatch function.
  throw new Error('Not implemented');
}

export function useDashboardState(): DashboardState {
  // TODO: implement — throw a helpful error naming DashboardProvider when
  // called outside of one.
  throw new Error('Not implemented');
}

export function useDashboardDispatch(): Dispatch<DashboardAction> {
  // TODO: implement — throw a helpful error naming DashboardProvider when
  // called outside of one.
  throw new Error('Not implemented');
}
