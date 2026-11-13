import {
  createContext,
  ReactElement,
  ReactNode,
  useCallback,
  useContext,
  useId,
  useMemo,
  useState,
} from 'react';

export type AccordionMode = 'single' | 'multiple';

export type AccordionProps = {
  mode?: AccordionMode;
  expanded?: string[];
  defaultExpanded?: string[];
  onExpandedChange?: (expanded: string[]) => void;
  children: ReactNode;
};

export type AccordionItemProps = {
  id: string;
  title: string;
  children: ReactNode;
};

/**
 * Accordion supporting single/multiple mode and controlled/uncontrolled state.
 *
 * - The open set lives in `Accordion` and is shared via context; each item only
 *   knows whether it is open and how to ask for a toggle.
 * - Controlled when `expanded !== undefined`: the display follows the prop and
 *   user toggles merely report the would-be next array via `onExpandedChange`.
 *   Uncontrolled: internal state is updated first, then `onExpandedChange` fires.
 * - `single` mode: toggling an open item yields `[]`, toggling a closed one
 *   yields `[id]` (so at most one item is open). `multiple`: add/remove freely.
 * - Each header is a `<button>` inside an `<h3>` (keyboard-operable for free),
 *   with `aria-expanded`/`aria-controls`; the panel is a `role="region"`
 *   labelled by its header. Collapsed panels are not rendered at all.
 */
type AccordionContextValue = {
  isExpanded: (id: string) => boolean;
  toggle: (id: string) => void;
  headerId: (id: string) => string;
  panelId: (id: string) => string;
};

const AccordionContext = createContext<AccordionContextValue | null>(null);

export function Accordion({
  mode = 'single',
  expanded,
  defaultExpanded,
  onExpandedChange,
  children,
}: AccordionProps): ReactElement {
  const isControlled = expanded !== undefined;
  const [internalExpanded, setInternalExpanded] = useState<string[]>(
    () => defaultExpanded ?? [],
  );
  const current = isControlled ? expanded : internalExpanded;
  const baseId = useId();

  const toggle = useCallback(
    (id: string) => {
      const isOpen = current.includes(id);
      let next: string[];
      if (mode === 'single') {
        next = isOpen ? [] : [id];
      } else {
        next = isOpen ? current.filter((x) => x !== id) : [...current, id];
      }
      if (!isControlled) setInternalExpanded(next);
      onExpandedChange?.(next);
    },
    [current, mode, isControlled, onExpandedChange],
  );

  const value = useMemo<AccordionContextValue>(
    () => ({
      isExpanded: (id) => current.includes(id),
      toggle,
      headerId: (id) => `${baseId}-header-${id}`,
      panelId: (id) => `${baseId}-panel-${id}`,
    }),
    [current, toggle, baseId],
  );

  return (
    <AccordionContext.Provider value={value}>
      <div>{children}</div>
    </AccordionContext.Provider>
  );
}

export function AccordionItem({
  id,
  title,
  children,
}: AccordionItemProps): ReactElement {
  const ctx = useContext(AccordionContext);
  if (!ctx) throw new Error('AccordionItem must be used within <Accordion>');

  const { isExpanded, toggle, headerId, panelId } = ctx;
  const open = isExpanded(id);

  return (
    <div>
      <h3>
        <button
          type="button"
          id={headerId(id)}
          aria-expanded={open}
          aria-controls={panelId(id)}
          onClick={() => toggle(id)}
        >
          {title}
        </button>
      </h3>
      {open && (
        <div role="region" id={panelId(id)} aria-labelledby={headerId(id)}>
          {children}
        </div>
      )}
    </div>
  );
}
