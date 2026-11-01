import {ReactElement, ReactNode, useId, useState} from 'react';

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
  const id = useId();
  const headerId = `${id}-header`;
  const panelId = `${id}-panel`;

  const [opened, setOpen] = useState(defaultOpen);


  const togglePanel = () => {
    setOpen((o) => !o);
  }

  return (
    <div>
      <button id={headerId} aria-expanded={opened} aria-controls={panelId} onClick={togglePanel}>{title}</button>
      {(mode === 'hidden' || opened) && (
        <div role="region" id={panelId} aria-labelledby={headerId} hidden={mode === 'hidden' && !opened}>
          {children}
        </div>
      )}
    </div>

  )
}
