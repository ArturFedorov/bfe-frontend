import type { ReactNode } from 'react';

export type DeliveryStatus = 'all' | 'delivered' | 'processing' | 'failed';

export interface Delivery {
  id: string;
  title: string;
  status: Exclude<DeliveryStatus, 'all'>;
}

export interface PageResult {
  rows: Delivery[];
  total: number;
}

export interface FetchPageParams {
  page: number;
  pageSize: number;
  status: DeliveryStatus;
}

export interface PaginatedTableProps {
  fetchPage: (params: FetchPageParams) => Promise<PageResult>;
  pageSize?: number;
}

export const STATUS_OPTIONS: DeliveryStatus[] = [
  'all',
  'delivered',
  'processing',
  'failed',
];

export function PaginatedTable({ fetchPage, pageSize = 10 }: PaginatedTableProps): ReactNode {
  // TODO: implement
  throw new Error('Not implemented');
}
