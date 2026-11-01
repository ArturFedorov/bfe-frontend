import { ReactElement, ReactNode } from 'react';

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

export function Accordion({
  mode = 'single',
  expanded,
  defaultExpanded,
  onExpandedChange,
  children,
}: AccordionProps): ReactElement {
  // TODO: implement
  throw new Error('Not implemented');
}

export function AccordionItem({
  id,
  title,
  children,
}: AccordionItemProps): ReactElement {
  // TODO: implement
  throw new Error('Not implemented');
}
