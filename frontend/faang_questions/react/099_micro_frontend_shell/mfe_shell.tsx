import type { ComponentType, ReactElement } from 'react';

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

export function createEventBus(): EventBus {
  throw new Error('Not implemented');
}

export function Shell(props: ShellProps): ReactElement {
  throw new Error('Not implemented');
}
