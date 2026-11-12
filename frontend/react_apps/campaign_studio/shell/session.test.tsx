/** @jest-environment jsdom */
import '@testing-library/jest-dom';
import { act, render, renderHook, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  createSessionStore,
  SessionProvider,
  useFlag,
  useSession,
} from './session';

describe('shell/session', () => {
  it('useSession throws outside the provider', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => renderHook(() => useSession())).toThrow(
      /inside <SessionProvider>/,
    );
    spy.mockRestore();
  });

  it('exposes the default user, default flags and the session API', () => {
    const { result } = renderHook(() => useSession(), {
      wrapper: SessionProvider,
    });
    expect(result.current.user).toMatchObject({ id: 'u1', role: 'editor' });
    expect(result.current.flags.journeys).toBe(true);
    expect(typeof result.current.setFlag).toBe('function');
    expect(typeof result.current.setRole).toBe('function');
  });

  it('setFlag and setRole update every consumer of the same provider', async () => {
    const user = userEvent.setup();
    function Header() {
      const { user: me, setRole } = useSession();
      return (
        <div>
          <span data-testid="role">{me.role}</span>
          <button
            onClick={() =>
              setRole(me.role === 'editor' ? 'approver' : 'editor')
            }
          >
            Toggle role
          </button>
        </div>
      );
    }
    function Flag() {
      const { flags, setFlag } = useSession();
      return (
        <label>
          <input
            type="checkbox"
            checked={flags.smsCounter}
            onChange={(e) => setFlag('smsCounter', e.target.checked)}
          />
          SMS counter
        </label>
      );
    }
    render(
      <SessionProvider>
        <Header />
        <Flag />
      </SessionProvider>,
    );
    expect(screen.getByTestId('role')).toHaveTextContent('editor');
    await user.click(screen.getByRole('button', { name: 'Toggle role' }));
    expect(screen.getByTestId('role')).toHaveTextContent('approver');

    const box = screen.getByRole('checkbox', { name: 'SMS counter' });
    expect(box).toBeChecked();
    await user.click(box);
    expect(box).not.toBeChecked();
  });

  it('accepts an external store and reflects changes made to it directly', () => {
    const store = createSessionStore({
      user: { id: 'x', name: 'Test User', role: 'approver' },
      flags: { beta: false },
    });
    const { result } = renderHook(() => useSession(), {
      wrapper: ({ children }) => (
        <SessionProvider store={store}>{children}</SessionProvider>
      ),
    });
    expect(result.current.user.name).toBe('Test User');
    expect(result.current.flags).toMatchObject({ beta: false, journeys: true });
    act(() => store.setState((s) => ({ flags: { ...s.flags, beta: true } })));
    expect(result.current.flags.beta).toBe(true);
  });

  it('useFlag only re-renders for its own flag', () => {
    const store = createSessionStore();
    let renders = 0;
    function OnlyJourneys() {
      renders += 1;
      return <span>{String(useFlag('journeys'))}</span>;
    }
    render(
      <SessionProvider store={store}>
        <OnlyJourneys />
      </SessionProvider>,
    );
    const before = renders;
    act(() =>
      store.setState((s) => ({ flags: { ...s.flags, smsCounter: false } })),
    );
    expect(renders).toBe(before);
    act(() =>
      store.setState((s) => ({ flags: { ...s.flags, journeys: false } })),
    );
    expect(renders).toBe(before + 1);
    expect(screen.getByText('false')).toBeInTheDocument();
  });
});
