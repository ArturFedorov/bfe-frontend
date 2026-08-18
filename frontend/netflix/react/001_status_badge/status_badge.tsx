import type { ReactElement } from 'react';

export type IntegrationStatus =
  | 'connected'
  | 'degraded'
  | 'disconnected'
  | 'pending';

export type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

export interface StatusBadgeProps {
  /** Known statuses get autocomplete; arbitrary API strings are still accepted. */
  status: IntegrationStatus | (string & {});
}

export function StatusBadge({ status }: StatusBadgeProps): ReactElement {
  // TODO: implement
  throw new Error('Not implemented');
}
