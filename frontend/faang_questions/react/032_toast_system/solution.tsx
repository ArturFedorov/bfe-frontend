import {
  createContext,
  ReactElement,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';

export type ShowToastOptions = {
  duration?: number;
};

export type ToastHandle = {
  show: (message: string, options?: ShowToastOptions) => string;
  dismiss: (id: string) => void;
};

export type ToastProviderProps = {
  maxVisible?: number;
  duration?: number;
  children: ReactNode;
};

/**
 * Toast system: provider owns the queue, `useToast()` exposes a stable
 * `{ show, dismiss }` handle, and `ToastViewport` portals the visible stack
 * into `document.body` inside a polite live region.
 *
 * Architecture notes:
 * - Two contexts: the *handle* context (`show`/`dismiss`, referentially stable
 *   for the provider's lifetime) and the *state* context (the queue). Buttons
 *   that only call `show` therefore never re-render when toasts come and go.
 * - The queue is one ordered array; the viewport renders `slice(0, maxVisible)`.
 *   Queued toasts are simply not mounted, so they cannot burn their timer, and
 *   a promoted toast mounts fresh and starts a full-duration timer.
 * - Each visible `ToastItem` owns its own timer in an effect keyed on `paused`:
 *   hovering (or focusing) pauses by clearing the timeout and banking the
 *   remaining time; leaving restarts a timeout for only what is left. Effect
 *   cleanup on unmount clears the timeout, so nothing leaks and no setState
 *   runs after unmount.
 * - The live region is always rendered (even when empty) so assistive tech has
 *   registered it before the first message is inserted.
 */
type Toast = {
  id: string;
  message: string;
  duration: number;
};

type ToastState = {
  toasts: readonly Toast[];
  maxVisible: number;
};

const ToastHandleContext = createContext<ToastHandle | null>(null);
const ToastStateContext = createContext<ToastState | null>(null);

export function ToastProvider({
  maxVisible = 3,
  duration = 5000,
  children,
}: ToastProviderProps): ReactElement {
  const [toasts, setToasts] = useState<readonly Toast[]>([]);
  const counterRef = useRef(0);

  // Read the default duration through a ref so `show` stays stable even if the
  // provider's `duration` prop changes.
  const durationRef = useRef(duration);
  durationRef.current = duration;

  const show = useCallback((message: string, options?: ShowToastOptions): string => {
    counterRef.current += 1;
    const id = `toast-${counterRef.current}`;
    const toast: Toast = {
      id,
      message,
      duration: options?.duration ?? durationRef.current,
    };
    setToasts((prev) => [...prev, toast]);
    return id;
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const handle = useMemo<ToastHandle>(() => ({ show, dismiss }), [show, dismiss]);
  const state = useMemo<ToastState>(() => ({ toasts, maxVisible }), [toasts, maxVisible]);

  return (
    <ToastHandleContext.Provider value={handle}>
      <ToastStateContext.Provider value={state}>{children}</ToastStateContext.Provider>
    </ToastHandleContext.Provider>
  );
}

export function useToast(): ToastHandle {
  const handle = useContext(ToastHandleContext);
  if (!handle) throw new Error('useToast must be used within <ToastProvider>');
  return handle;
}

export function ToastViewport(): ReactElement {
  const state = useContext(ToastStateContext);
  const { dismiss } = useToast();
  if (!state) throw new Error('ToastViewport must be used within <ToastProvider>');

  const visible = state.toasts.slice(0, state.maxVisible);

  return createPortal(
    <div
      role="status"
      aria-live="polite"
      aria-label="Notifications"
      style={{ position: 'fixed', bottom: 16, right: 16, display: 'grid', gap: 8 }}
    >
      {visible.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={dismiss} />
      ))}
    </div>,
    document.body,
  );
}

type ToastItemProps = {
  toast: Toast;
  onDismiss: (id: string) => void;
};

/** One visible toast. Owns its auto-dismiss timer, including pause/resume. */
function ToastItem({ toast, onDismiss }: ToastItemProps): ReactElement {
  const [paused, setPaused] = useState(false);
  // Time left on the clock; only decremented while a timer was actually running.
  const remainingRef = useRef(toast.duration);

  useEffect(() => {
    if (paused) return;

    const startedAt = Date.now();
    const timeoutId = setTimeout(() => onDismiss(toast.id), remainingRef.current);

    return () => {
      clearTimeout(timeoutId);
      // Bank whatever was left so a resume continues, not restarts.
      remainingRef.current = Math.max(0, remainingRef.current - (Date.now() - startedAt));
    };
  }, [paused, toast.id, onDismiss]);

  const pause = () => setPaused(true);
  const resume = () => setPaused(false);

  return (
    <div
      onMouseEnter={pause}
      onMouseLeave={resume}
      onFocus={pause}
      onBlur={resume}
      style={{ display: 'flex', gap: 8, alignItems: 'center' }}
    >
      <span>{toast.message}</span>
      <button type="button" aria-label="Dismiss" onClick={() => onDismiss(toast.id)}>
        ×
      </button>
    </div>
  );
}
