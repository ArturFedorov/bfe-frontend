import type { ReactElement } from 'react';

export type CampaignStatus = 'pending' | 'approved';

export interface Campaign {
  id: string;
  name: string;
  status: CampaignStatus;
  /** ISO timestamp. */
  updatedAt: string;
}

export type StatusFilter = 'all' | 'pending' | 'approved';
export type SortKey = 'name' | 'updatedAt';

export interface ListParams {
  page: number;
  pageSize: number;
  status: StatusFilter;
  sort: SortKey;
}

export interface ListResult {
  rows: Campaign[];
  total: number;
}

export interface ApprovalApi {
  list(params: ListParams): Promise<ListResult>;
  approve(ids: string[]): Promise<void>;
}

/** The part of the state that lives in the URL. */
export interface GridParams {
  page: number;
  status: StatusFilter;
  sort: SortKey;
}

export const DEFAULT_PARAMS: Readonly<GridParams> = { page: 1, status: 'all', sort: 'name' };

export interface ApprovalGridProps {
  api: ApprovalApi;
  /** Rows per page. Default 10. */
  pageSize?: number;
}

/** Parses `?page=2&status=pending&sort=updatedAt`; invalid values fall back to defaults. */
export function parseGridParams(search: string): GridParams {
  throw new Error('Not implemented');
}

/** Returns '' when every value is default, otherwise a string starting with '?'. */
export function serializeGridParams(params: GridParams): string {
  throw new Error('Not implemented');
}

export function ApprovalGrid(props: ApprovalGridProps): ReactElement {
  throw new Error('Not implemented');
}
