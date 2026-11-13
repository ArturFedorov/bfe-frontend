import {
  Component,
  lazy,
  Suspense,
  useRef,
  useState,
  type ComponentType,
  type ErrorInfo,
  type LazyExoticComponent,
  type ReactElement,
  type ReactNode,
} from 'react';

export interface EventBus {
  emit<T>(type: string, payload: T): void;
  /** Returns an unsubscribe function. */
  on<T>(type: string, handler: (payload: T) => void): () => void;
}

export interface RemoteUser {
  id: string;
  name: string;
}

export type Theme = 'light' | 'dark';

export interface RemoteProps {
  bus: EventBus;
  user: RemoteUser;
  theme: Theme;
}

export interface RemoteModule {
  default: ComponentType<RemoteProps>;
}

export interface RemoteManifest {
  id: string;
  name: string;
  route: string;
  /** Like `() => import('./remote')`. */
  load: () => Promise<RemoteModule>;
}

export interface ShellProps {
  remotes: readonly RemoteManifest[];
  user: RemoteUser;
  theme: Theme;
  /** Route of the initially active remote. Defaults to the first remote's route. */
  initialRoute?: string;
  /** Shared bus. The shell creates one per instance when omitted. */
  bus?: EventBus;
}

/* -------------------------------------------------------------------------- */
/* Event bus                                                                  */
/* -------------------------------------------------------------------------- */

type AnyHandler = (payload: unknown) => void;

export function createEventBus(): EventBus {
  const handlers = new Map<string, Set<AnyHandler>>();

  return {
    on<T>(type: string, handler: (payload: T) => void) {
      let set = handlers.get(type);
      if (!set) {
        set = new Set();
        handlers.set(type, set);
      }
      const entry = handler as AnyHandler;
      set.add(entry);
      // Idempotent: a second call finds nothing to delete.
      return () => {
        set.delete(entry);
        if (set.size === 0) handlers.delete(type);
      };
    },

    emit<T>(type: string, payload: T) {
      const set = handlers.get(type);
      if (!set) return; // no subscribers → no-op
      // Iterate a snapshot so a handler subscribed *during* this emit is not
      // called for it; re-check membership so one unsubscribed mid-emit is skipped.
      for (const handler of Array.from(set)) {
        if (set.has(handler)) handler(payload);
      }
    },
  };
}

/* -------------------------------------------------------------------------- */
/* Error boundary (per remote)                                                */
/* -------------------------------------------------------------------------- */

interface RemoteBoundaryProps {
  /** Remote display name for the alert text. */
  name: string;
  onRetry: () => void;
  children: ReactNode;
}

interface RemoteBoundaryState {
  error: Error | null;
}

/**
 * Isolates one remote: a rejected `load` (thrown by `React.lazy` during
 * render) becomes an alert with a Retry button instead of taking the whole
 * shell down. The shell remounts it (new `key`) on Retry so the error state resets.
 */
class RemoteBoundary extends Component<RemoteBoundaryProps, RemoteBoundaryState> {
  state: RemoteBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): RemoteBoundaryState {
    return { error };
  }

  componentDidCatch(_error: Error, _info: ErrorInfo): void {
    // Hook for reporting to telemetry; React has already logged the error.
  }

  render(): ReactNode {
    if (this.state.error) {
      return (
        <div role="alert">
          <p>{this.props.name} failed to load</p>
          <button type="button" onClick={this.props.onRetry}>
            Retry
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

/* -------------------------------------------------------------------------- */
/* Shell                                                                      */
/* -------------------------------------------------------------------------- */

type LazyRemote = LazyExoticComponent<ComponentType<RemoteProps>>;

export function Shell({ remotes, user, theme, initialRoute, bus: sharedBus }: ShellProps): ReactElement {
  // One bus per shell instance when none is injected; created exactly once.
  const [ownBus] = useState(() => createEventBus());
  const bus = sharedBus ?? ownBus;

  const [route, setRoute] = useState<string | undefined>(
    () => remotes.find((remote) => remote.route === initialRoute)?.route ?? remotes[0]?.route,
  );

  // Single-flight cache: one lazy component per remote id for the lifetime of
  // this shell. `React.lazy` calls `load` once on first render and memoises
  // the module (or the rejection) — which is why Retry must drop the entry.
  const cacheRef = useRef(new Map<string, LazyRemote>());
  // Bumped per remote on Retry; part of the boundary `key` so it remounts with a clean state.
  const [attempts, setAttempts] = useState<Record<string, number>>({});

  const getLazyRemote = (manifest: RemoteManifest): LazyRemote => {
    let component = cacheRef.current.get(manifest.id);
    if (!component) {
      component = lazy(manifest.load);
      cacheRef.current.set(manifest.id, component);
    }
    return component;
  };

  const retry = (id: string) => {
    cacheRef.current.delete(id); // a rejected lazy is poisoned forever → fresh one next render
    setAttempts((previous) => ({ ...previous, [id]: (previous[id] ?? 0) + 1 }));
  };

  const active = remotes.find((remote) => remote.route === route);
  const ActiveRemote = active ? getLazyRemote(active) : null;

  return (
    <div>
      <nav aria-label="Micro-frontends">
        {remotes.map((remote) => (
          <button
            key={remote.id}
            type="button"
            aria-current={remote.route === route ? 'page' : undefined}
            onClick={() => setRoute(remote.route)}
          >
            {remote.name}
          </button>
        ))}
      </nav>

      {active && ActiveRemote && (
        <RemoteBoundary
          key={`${active.id}:${attempts[active.id] ?? 0}`}
          name={active.name}
          onRetry={() => retry(active.id)}
        >
          <Suspense fallback={<p role="status">Loading {active.name}…</p>}>
            <ActiveRemote bus={bus} user={user} theme={theme} />
          </Suspense>
        </RemoteBoundary>
      )}
    </div>
  );
}
