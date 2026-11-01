import type { ReactElement } from 'react';

export type IntegrationStatus =
  | 'connected'
  | 'degraded'
  | 'disconnected'
  | 'pending';

export type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

type ExtendedStatusType = IntegrationStatus | (string & {});

export interface StatusBadgeProps {
  /** Known statuses get autocomplete; arbitrary API strings are still accepted. */
  status: ExtendedStatusType;
}

export const ClassStatusMap: Record<IntegrationStatus, BadgeVariant> = {
  connected: 'success',
  degraded: 'warning',
  disconnected: 'danger',
  pending: 'info',
}

const isKnownStatus = (s: string): s is IntegrationStatus => s in ClassStatusMap;

const getCssClass = (status: IntegrationStatus):string => {
  return ClassStatusMap[status] ? `badge badge--${ClassStatusMap[status]}` : 'badge badge--neutral';
}

const capitalizeStatus = (status: ExtendedStatusType): string => {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export const getStatusRenderText  = (status: ExtendedStatusType): string => {
  if(isKnownStatus(status)) {
    return capitalizeStatus(status);
  }

  return 'Unknown';
}

export function StatusBadge({ status }: StatusBadgeProps): ReactElement {
  return <div role="status" className={getCssClass(status as IntegrationStatus)}>{getStatusRenderText(status)}</div>
}
