import { ReactElement, ReactNode } from 'react';

export type PageCardProps = {
  title?: string;
  actions?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
};

export function PageCard({
  title,
  actions,
  footer,
  children,
}: PageCardProps): ReactElement {
  // TODO: implement
  throw new Error('Not implemented');
}
