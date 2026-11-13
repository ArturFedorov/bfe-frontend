import { MouseEvent, ReactElement, ReactNode, useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';

export type ModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
};

/**
 * Controlled modal dialog rendered through a portal into `document.body`.
 *
 * Why a portal: rendering into body escapes any ancestor `overflow: hidden` /
 * `transform` / `z-index` stacking context that would otherwise clip the dialog.
 *
 * Dialog contract (all driven by one effect keyed on `open`, so every side
 * effect has a matching cleanup and nothing leaks between opens or on unmount):
 * - focus moves to the dialog (`tabIndex={-1}`) on open and returns to the
 *   previously focused element (the trigger) on close/unmount;
 * - Escape calls `onClose` (document-level keydown so it works wherever focus is
 *   inside the dialog);
 * - `document.body.style.overflow` is forced to `hidden` while open and the
 *   previous value is restored afterwards (scroll lock);
 * - backdrop click closes; clicks inside the dialog content do not (checked via
 *   `event.target === event.currentTarget`, so bubbling from children is ignored).
 */
export function Modal({
  open,
  onClose,
  title,
  children,
}: ModalProps): ReactElement | null {
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

  // Keep the latest onClose in a ref so the effect does not re-subscribe on
  // every parent render (callers often pass inline arrow functions).
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return;

    // 1. Remember who had focus, then move focus into the dialog.
    const previouslyFocused = document.activeElement as HTMLElement | null;
    dialogRef.current?.focus();

    // 2. Scroll lock, remembering the previous inline value.
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // 3. Escape to close.
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onCloseRef.current();
      }
    };
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
      // Restore focus only if the trigger is still in the document.
      if (previouslyFocused && previouslyFocused.isConnected) {
        previouslyFocused.focus();
      }
    };
  }, [open]);

  if (!open) return null;

  const handleBackdropClick = (event: MouseEvent<HTMLDivElement>) => {
    // Only a click that started AND ended on the backdrop itself counts.
    if (event.target === event.currentTarget) onClose();
  };

  return createPortal(
    <div
      data-testid="modal-backdrop"
      onClick={handleBackdropClick}
      style={{
        position: 'fixed',
        inset: 0,
        display: 'grid',
        placeItems: 'center',
        background: 'rgba(0, 0, 0, 0.4)',
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
      >
        <h2 id={titleId}>{title}</h2>
        {children}
      </div>
    </div>,
    document.body,
  );
}
