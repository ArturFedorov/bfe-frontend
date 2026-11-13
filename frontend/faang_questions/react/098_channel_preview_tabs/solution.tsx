import { Children, createContext, isValidElement, useContext, useId, useState } from 'react';
import type { KeyboardEvent, ReactElement, ReactNode } from 'react';
import { channelWidth, color, cx, radius, space } from './tokens';
import type { Channel } from './tokens';

export interface ChannelTabsProps {
  /** Accessible name of the tablist. */
  label: string;
  /** Controlled active tab value. */
  value?: string;
  /** Initial active tab value (uncontrolled). Defaults to the first Tab. */
  defaultValue?: string;
  onChange?: (value: string) => void;
  children: ReactNode;
  className?: string;
}

export interface TabListProps {
  children: ReactNode;
}

export interface TabProps {
  value: string;
  children: ReactNode;
}

export interface PanelProps {
  value: string;
  /** Picks the preview frame width from `channelWidth`. */
  channel: Channel;
  children: ReactNode;
}

// ---------------------------------------------------------------------------
// Context — the compound parts never receive index props; they read the
// shared selection and the id scheme from here.
// ---------------------------------------------------------------------------

interface TabsContextValue {
  label: string;
  /** The selected value (controlled prop or internal state). */
  active: string | undefined;
  /** Request a selection change; in controlled mode this only notifies the parent. */
  select: (value: string) => void;
  tabId: (value: string) => string;
  panelId: (value: string) => string;
}

const TabsContext = createContext<TabsContextValue | null>(null);

function useTabsContext(part: string): TabsContextValue {
  const ctx = useContext(TabsContext);
  if (!ctx) throw new Error(`<ChannelTabs.${part}> must be rendered inside <ChannelTabs>`);
  return ctx;
}

/** Ids may not contain whitespace; everything else in a tab value is fine. */
const idSafe = (value: string): string => value.replace(/\s+/g, '_');

/**
 * Finds the first `<ChannelTabs.Tab>` in the element tree so the uncontrolled
 * default can be known on the very first render (no flash of "nothing
 * selected", no registration effect). Walks through plain wrappers such as
 * `<List>` or fragments; a Tab hidden inside a custom component would not be
 * seen — pass `defaultValue` in that case.
 */
function findFirstTabValue(children: ReactNode): string | undefined {
  for (const child of Children.toArray(children)) {
    if (!isValidElement<{ value?: unknown; children?: ReactNode }>(child)) continue;
    if (child.type === Tab && typeof child.props.value === 'string') return child.props.value;
    const nested = findFirstTabValue(child.props.children);
    if (nested !== undefined) return nested;
  }
  return undefined;
}

// ---------------------------------------------------------------------------
// Root
// ---------------------------------------------------------------------------

function ChannelTabsRoot({ label, value, defaultValue, onChange, children, className }: ChannelTabsProps): ReactElement {
  const baseId = useId();
  const isControlled = value !== undefined;
  // Internal selection is only consulted in uncontrolled mode. Lazily seeded so
  // the first-Tab scan runs once, not on every render.
  const [internal, setInternal] = useState<string | undefined>(() => defaultValue ?? findFirstTabValue(children));
  const active = isControlled ? value : internal;

  const select = (next: string) => {
    if (next === active) return; // re-clicking the active tab is not a change
    if (!isControlled) setInternal(next);
    onChange?.(next);
  };

  const ctx: TabsContextValue = {
    label,
    active,
    select,
    tabId: (v) => `${baseId}-tab-${idSafe(v)}`,
    panelId: (v) => `${baseId}-panel-${idSafe(v)}`,
  };

  return (
    <TabsContext.Provider value={ctx}>
      <div className={cx('channel-tabs', className)}>{children}</div>
    </TabsContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// List + Tab
// ---------------------------------------------------------------------------

function List({ children }: TabListProps): ReactElement {
  const { label } = useTabsContext('List');
  return (
    <div
      role="tablist"
      aria-label={label}
      className="channel-tabs__list"
      style={{ display: 'flex', gap: space[1], borderBottom: `1px solid ${color.border}` }}
    >
      {children}
    </div>
  );
}

const TAB_SELECTOR = '[role="tab"]';

function Tab({ value, children }: TabProps): ReactElement {
  const { active, select, tabId, panelId } = useTabsContext('Tab');
  const selected = active === value;

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    // Position is discovered from DOM order at keydown time, so there is no
    // registration array to keep in sync when tabs mount/unmount.
    const list = event.currentTarget.closest('[role="tablist"]');
    if (!list) return;
    const tabs = Array.from(list.querySelectorAll<HTMLButtonElement>(TAB_SELECTOR));
    const index = tabs.indexOf(event.currentTarget);
    if (index === -1) return;

    let nextIndex: number;
    switch (event.key) {
      case 'ArrowRight':
        nextIndex = (index + 1) % tabs.length;
        break;
      case 'ArrowLeft':
        nextIndex = (index - 1 + tabs.length) % tabs.length;
        break;
      case 'Home':
        nextIndex = 0;
        break;
      case 'End':
        nextIndex = tabs.length - 1;
        break;
      default:
        return; // let Tab / Enter / Space behave natively
    }

    event.preventDefault();
    const next = tabs[nextIndex];
    // Focus moves even in controlled mode — if the parent rejects the change
    // the keyboard user must not be stranded on a tab the list no longer owns.
    next.focus();
    // Automatic activation: moving focus also selects.
    const nextValue = next.dataset.value;
    if (nextValue !== undefined) select(nextValue);
  };

  return (
    <button
      type="button"
      role="tab"
      id={tabId(value)}
      data-value={value}
      aria-selected={selected}
      aria-controls={panelId(value)}
      // Roving tabindex: only the active tab is in the page's tab sequence.
      tabIndex={selected ? 0 : -1}
      className={cx('channel-tabs__tab', { 'channel-tabs__tab--active': selected })}
      style={{
        padding: `${space[2]}px ${space[3]}px`,
        border: 'none',
        borderBottom: `2px solid ${selected ? color.accent : 'transparent'}`,
        borderRadius: `${radius.sm}px ${radius.sm}px 0 0`,
        background: selected ? color.surface : 'transparent',
        color: selected ? color.text : color.textMuted,
        cursor: 'pointer',
      }}
      onClick={() => select(value)}
      onKeyDown={onKeyDown}
    >
      {children}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Panel
// ---------------------------------------------------------------------------

function Panel({ value, channel, children }: PanelProps): ReactElement {
  const { active, tabId, panelId } = useTabsContext('Panel');
  const selected = active === value;

  return (
    <div
      role="tabpanel"
      id={panelId(value)}
      aria-labelledby={tabId(value)}
      // `hidden` removes inactive panels from both layout and the a11y tree;
      // the content stays mounted so iframe-style previews keep their state.
      hidden={!selected}
      className={cx('channel-tabs__panel', { 'channel-tabs__panel--active': selected })}
      style={{ padding: space[4] }}
    >
      <div
        data-channel={channel}
        className={cx('channel-tabs__frame', `channel-tabs__frame--${channel}`)}
        style={{
          width: channelWidth[channel],
          maxWidth: '100%',
          padding: space[4],
          border: `1px solid ${color.border}`,
          borderRadius: radius.md,
          background: color.surface,
          color: color.text,
        }}
      >
        {children}
      </div>
    </div>
  );
}

export const ChannelTabs = Object.assign(ChannelTabsRoot, { List, Tab, Panel });
