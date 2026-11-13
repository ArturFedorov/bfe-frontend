import {
  KeyboardEvent,
  ReactElement,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react';

export type DropdownMenuItem = {
  id: string;
  label: string;
  disabled?: boolean;
};

export type DropdownMenuProps = {
  label: string;
  items: DropdownMenuItem[];
  onSelect?: (id: string) => void;
};

/**
 * Menu button (WAI-ARIA "menu button" pattern) with no positioning library.
 *
 * Mechanics worth calling out in an interview:
 * - Focus is managed programmatically: items are `tabIndex={-1}` and we move
 *   `focus()` between them. The current item is derived from
 *   `document.activeElement`, so there is no separate "active index" state to
 *   drift out of sync with the DOM.
 * - Arrow navigation walks the list in a loop and skips `disabled` items,
 *   wrapping at both ends.
 * - Items are `<li role="menuitem">`, not `<button>`s, so Enter/Space are
 *   handled once in `onKeyDown` (a native button would also synthesize a click
 *   on Enter and double-fire `onSelect`).
 * - Outside press: a `pointerdown` listener on `document` is attached only
 *   while open and removed on close/unmount. It tests containment against a
 *   ref to the component's root node, which is robust to re-renders and to
 *   the menu being portaled later (unlike `closest('.menu')` class matching).
 * - Escape closes and returns focus to the trigger.
 */
export function DropdownMenu({
  label,
  items,
  onSelect,
}: DropdownMenuProps): ReactElement {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLUListElement>(null);
  const baseId = useId();
  const triggerId = `${baseId}-trigger`;
  const menuId = `${baseId}-menu`;

  const getItemElements = useCallback(
    () =>
      Array.from(
        menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? [],
      ),
    [],
  );

  /** Move focus `delta` steps from the current item, wrapping and skipping disabled items. */
  const moveFocus = useCallback(
    (delta: 1 | -1) => {
      const elements = getItemElements();
      if (elements.length === 0) return;
      const currentIndex = elements.indexOf(document.activeElement as HTMLElement);
      let index = currentIndex;
      // At most `length` hops so an all-disabled menu cannot loop forever.
      for (let hops = 0; hops < elements.length; hops++) {
        index = (index + delta + elements.length) % elements.length;
        if (!items[index]?.disabled) {
          elements[index].focus();
          return;
        }
      }
    },
    [getItemElements, items],
  );

  const close = useCallback((returnFocus: boolean) => {
    setOpen(false);
    if (returnFocus) triggerRef.current?.focus();
  }, []);

  const select = (item: DropdownMenuItem) => {
    if (item.disabled) return;
    onSelect?.(item.id);
    close(true);
  };

  // On open, focus the first enabled item.
  useEffect(() => {
    if (!open) return;
    const elements = getItemElements();
    const firstEnabled = items.findIndex((item) => !item.disabled);
    if (firstEnabled !== -1) elements[firstEnabled]?.focus();
  }, [open, items, getItemElements]);

  // Outside press closes. Listener exists only while open.
  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (event: PointerEvent) => {
      const root = rootRef.current;
      if (root && event.target instanceof Node && !root.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [open]);

  const handleMenuKeyDown = (event: KeyboardEvent<HTMLUListElement>) => {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        moveFocus(1);
        break;
      case 'ArrowUp':
        event.preventDefault();
        moveFocus(-1);
        break;
      case 'Home':
      case 'End': {
        event.preventDefault();
        const elements = getItemElements();
        const order = event.key === 'Home' ? items.keys() : [...items.keys()].reverse();
        for (const i of order) {
          if (!items[i].disabled) {
            elements[i]?.focus();
            break;
          }
        }
        break;
      }
      case 'Enter':
      case ' ': {
        event.preventDefault();
        const index = getItemElements().indexOf(document.activeElement as HTMLElement);
        if (index !== -1) select(items[index]);
        break;
      }
      case 'Escape':
        event.preventDefault();
        close(true);
        break;
      case 'Tab':
        // Tabbing away dismisses the menu (focus moves naturally).
        setOpen(false);
        break;
    }
  };

  return (
    <div ref={rootRef} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        ref={triggerRef}
        type="button"
        id={triggerId}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => setOpen((prev) => !prev)}
        onKeyDown={(event) => {
          // ArrowDown on a closed trigger opens and focuses the first item.
          if (!open && (event.key === 'ArrowDown' || event.key === 'ArrowUp')) {
            event.preventDefault();
            setOpen(true);
          }
        }}
      >
        {label}
      </button>

      {open && (
        <ul
          ref={menuRef}
          id={menuId}
          role="menu"
          aria-labelledby={triggerId}
          onKeyDown={handleMenuKeyDown}
          style={{ position: 'absolute', margin: 0, padding: 0, listStyle: 'none' }}
        >
          {items.map((item) => (
            <li
              key={item.id}
              role="menuitem"
              tabIndex={-1}
              aria-disabled={item.disabled ? 'true' : undefined}
              onClick={() => select(item)}
            >
              {item.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
