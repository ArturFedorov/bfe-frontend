import type { ReactElement } from 'react';

export interface Partner {
  id: string;
  name: string;
}

export type PartnerListState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'success'; partners: Partner[] };

export interface PartnerListProps {
  /** API endpoint returning Partner[]. Defaults to '/api/partners'. */
  endpoint?: string;
}

export function PartnerList({ endpoint = '/api/partners' }: PartnerListProps): ReactElement {
  // TODO: implement
  throw new Error('Not implemented');
}
