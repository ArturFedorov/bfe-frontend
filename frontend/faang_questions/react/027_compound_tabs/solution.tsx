import {
  createContext,
  KeyboardEvent,
  ReactElement,
  ReactNode,
  useCallback,
  useContext,
  useId,
  useMemo,
  useState,
} from 'react';

export type TabsProps = { defaultValue: string; children: ReactNode };
export type TabListProps = { label: string; children: ReactNode };
export type TabProps = { value: string; children: ReactNode };
export type TabPanelProps = { value: string; children: ReactNode };

/**
 * Compound Tabs following the WAI-ARIA tabs pattern with automatic activation.
 *
 * - `Tabs` owns the selected value and exposes it through context, so any
 *   nesting of `TabList`/`Tab`/`TabPanel` works without prop drilling.
 * - A single `useId()` base in `Tabs` derives deterministic, matching ids for
 *   each tab/panel pair (`aria-controls` / `aria-labelledby`).
 * - Roving tabindex: only the selected tab is in the Tab order; arrow keys move
 *   focus AND selection, wrapping at the ends. The key handler lives on the
 *   tablist and reads the rendered `[role="tab"]` order from the DOM, so tabs
 *   need no registration step and reordering/conditional tabs "just work".
 */
type TabsContextValue = {
  selected: string;
  select: (value: string) => void;
  tabId: (value: string) => string;
  panelId: (value: string) => string;
};

const TabsContext = createContext<TabsContextValue | null>(null);

function useTabsContext(component: string): TabsContextValue {
  const ctx = useContext(TabsContext);
  if (!ctx) throw new Error(`${component} must be used within <Tabs>`);
  return ctx;
}

export function Tabs({ defaultValue, children }: TabsProps): ReactElement {
  const [selected, setSelected] = useState(defaultValue);
  const baseId = useId();

  const value = useMemo<TabsContextValue>(
    () => ({
      selected,
      select: setSelected,
      tabId: (v) => `${baseId}-tab-${v}`,
      panelId: (v) => `${baseId}-panel-${v}`,
    }),
    [selected, baseId],
  );

  return <TabsContext.Provider value={value}>{children}</TabsContext.Provider>;
}

export function TabList({ label, children }: TabListProps): ReactElement {
  const { select } = useTabsContext('TabList');

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;

      const tabs = Array.from(
        event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="tab"]'),
      );
      const currentIndex = tabs.indexOf(document.activeElement as HTMLButtonElement);
      if (currentIndex === -1) return;

      event.preventDefault();
      const delta = event.key === 'ArrowRight' ? 1 : -1;
      const next = tabs[(currentIndex + delta + tabs.length) % tabs.length];
      next.focus();
      // Automatic activation: focusing a tab also selects it.
      const value = next.dataset.value;
      if (value !== undefined) select(value);
    },
    [select],
  );

  return (
    <div role="tablist" aria-label={label} onKeyDown={handleKeyDown}>
      {children}
    </div>
  );
}

export function Tab({ value, children }: TabProps): ReactElement {
  const { selected, select, tabId, panelId } = useTabsContext('Tab');
  const isSelected = selected === value;

  return (
    <button
      type="button"
      role="tab"
      id={tabId(value)}
      data-value={value}
      aria-selected={isSelected}
      aria-controls={panelId(value)}
      tabIndex={isSelected ? 0 : -1}
      onClick={() => select(value)}
    >
      {children}
    </button>
  );
}

export function TabPanel({
  value,
  children,
}: TabPanelProps): ReactElement | null {
  const { selected, tabId, panelId } = useTabsContext('TabPanel');
  // Inactive panels render nothing at all (not just hidden).
  if (selected !== value) return null;

  return (
    <div role="tabpanel" id={panelId(value)} aria-labelledby={tabId(value)} tabIndex={0}>
      {children}
    </div>
  );
}
