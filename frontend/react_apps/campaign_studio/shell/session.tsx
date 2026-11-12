import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { createStore, useStore, type Store } from './store';
import type { Role, User } from './types';
import { USERS } from './fixtures';

/**
 * Who is using the tool and which feature flags are on. Backed by the mini
 * store so any component can subscribe to just the slice it needs; the header
 * reads `user`, a page might read a single flag.
 */

export interface SessionState {
  user: User;
  flags: Record<string, boolean>;
}

export interface Session extends SessionState {
  setFlag(name: string, value: boolean): void;
  setRole(role: Role): void;
}

export const DEFAULT_FLAGS: Record<string, boolean> = {
  journeys: true,
  smsCounter: true,
  optimisticApprove: true,
};

export function createSessionStore(
  initial: Partial<SessionState> = {},
): Store<SessionState> {
  return createStore<SessionState>({
    user: initial.user ?? USERS[0],
    flags: { ...DEFAULT_FLAGS, ...initial.flags },
  });
}

const SessionContext = createContext<Store<SessionState> | null>(null);

export interface SessionProviderProps {
  children: ReactNode;
  /** Pass a store to share it with tests; otherwise one is created from `initial`. */
  store?: Store<SessionState>;
  initial?: Partial<SessionState>;
}

export function SessionProvider({
  children,
  store,
  initial,
}: SessionProviderProps) {
  const value = useMemo(
    () => store ?? createSessionStore(initial),
    [store, initial],
  );
  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}

export function useSessionStore(): Store<SessionState> {
  const store = useContext(SessionContext);
  if (!store)
    throw new Error('useSession must be used inside <SessionProvider>');
  return store;
}

export function useSession(): Session {
  const store = useSessionStore();
  const user = useStore(store, (s) => s.user);
  const flags = useStore(store, (s) => s.flags);
  return useMemo<Session>(
    () => ({
      user,
      flags,
      setFlag: (name, value) =>
        store.setState((s) =>
          s.flags[name] === value
            ? {}
            : { flags: { ...s.flags, [name]: value } },
        ),
      setRole: (role) =>
        store.setState((s) =>
          s.user.role === role ? {} : { user: { ...s.user, role } },
        ),
    }),
    [user, flags, store],
  );
}

/** Subscribe to one flag only — components using this do not re-render for unrelated changes. */
export function useFlag(name: string): boolean {
  const store = useSessionStore();
  return useStore(store, (s) => s.flags[name] === true);
}
