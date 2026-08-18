import type { ReactElement, ReactNode } from 'react';

export type CollapseMode = 'unmount' | 'hidden';

export interface CollapsiblePanelProps {
  /** Header text; also the accessible name of the content region. */
  title: string;
  children: ReactNode;
  /** Start expanded. Defaults to false. */
  defaultOpen?: boolean;
  /**
   * 'unmount' (default): closed content is removed from the DOM (child state lost).
   * 'hidden': closed content stays mounted with the hidden attribute (child state kept).
   */
  mode?: CollapseMode;
}

export function CollapsiblePanel({
  title,
  children,
  defaultOpen = false,
  mode = 'unmount',
}: CollapsiblePanelProps): ReactElement {
  // TODO: implement
  throw new Error('Not implemented');
}
