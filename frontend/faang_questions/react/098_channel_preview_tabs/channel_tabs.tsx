import type { ReactElement, ReactNode } from 'react';
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

function ChannelTabsRoot(props: ChannelTabsProps): ReactElement {
  throw new Error('Not implemented');
}

function List(props: TabListProps): ReactElement {
  throw new Error('Not implemented');
}

function Tab(props: TabProps): ReactElement {
  throw new Error('Not implemented');
}

function Panel(props: PanelProps): ReactElement {
  throw new Error('Not implemented');
}

export const ChannelTabs = Object.assign(ChannelTabsRoot, { List, Tab, Panel });
