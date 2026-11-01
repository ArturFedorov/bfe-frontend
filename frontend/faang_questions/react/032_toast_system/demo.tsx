import { ToastProvider, ToastViewport, useToast } from './toast_system';

/**
 * Demo harness for the toast system — auto-discovered by the playground
 * (playground/App.tsx). This file is not part of the task: the spec lives in
 * README.md and the grader is toast_system.test.tsx.
 */

// Must live inside <ToastProvider> so useToast() can reach the context.
function ToastTriggers() {
  const toast = useToast();

  return (
    <div className="demo-controls">
      <button onClick={() => toast.show('Sync complete — 14 assets delivered')}>
        Show success toast
      </button>
      <button
        onClick={() =>
          toast.show('Delivery failed: manifest rejected by partner')
        }
      >
        Show error toast
      </button>
      <button
        onClick={() =>
          toast.show('Long read: webhook retries exhausted for Acme Studios', {
            duration: 10000,
          })
        }
      >
        Show slow toast (10s)
      </button>
    </div>
  );
}

export default function Demo() {
  return (
    <div className="demo">
      <h2>Toast System</h2>
      <p className="demo-note">
        Implement <code>ToastProvider</code>/<code>useToast</code>/
        <code>ToastViewport</code> in <code>toast_system.tsx</code> — a
        portalled live-region stack with auto-dismiss, hover-pause, and a max
        of 2 visible toasts here (fire several quickly to see the queue drain
        as slots free up).
      </p>
      <div className="demo-stage">
        <ToastProvider maxVisible={2} duration={4000}>
          <ToastTriggers />
          <ToastViewport />
        </ToastProvider>
      </div>
    </div>
  );
}
