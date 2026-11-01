import { ReactElement, ReactNode } from 'react';

export type TabsProps = { defaultValue: string; children: ReactNode };
export type TabListProps = { label: string; children: ReactNode };
export type TabProps = { value: string; children: ReactNode };
export type TabPanelProps = { value: string; children: ReactNode };

export function Tabs({ defaultValue, children }: TabsProps): ReactElement {
  // TODO: implement
  throw new Error('Not implemented');
}

export function TabList({ label, children }: TabListProps): ReactElement {
  // TODO: implement
  throw new Error('Not implemented');
}

export function Tab({ value, children }: TabProps): ReactElement {
  // TODO: implement
  throw new Error('Not implemented');
}

export function TabPanel({
  value,
  children,
}: TabPanelProps): ReactElement | null {
  // TODO: implement
  throw new Error('Not implemented');
}
