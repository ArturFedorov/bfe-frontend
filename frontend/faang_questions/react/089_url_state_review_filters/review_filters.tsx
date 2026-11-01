import type { JSX } from 'react';

export type ReviewStatus = 'pending' | 'approved' | 'rejected';
export type StatusFilter = 'all' | ReviewStatus;

export type ReviewTask = {
  id: string;
  title: string;
  status: ReviewStatus;
};

/** URL-synced state. Query param names are the keys: `q`, `status`, `page`, `task`. */
export type ReviewFiltersState = {
  q: string;
  status: StatusFilter;
  page: number;
  task: string | null;
};

const KINDS = ['Sentiment', 'NER', 'Intent', 'Toxicity'] as const;
const STATUSES: ReviewStatus[] = ['pending', 'approved', 'rejected'];

/** Default dataset: 23 tasks, ids `t-1`…`t-23`. */
export const REVIEW_TASKS: ReviewTask[] = Array.from({ length: 23 }, (_, i) => ({
  id: `t-${i + 1}`,
  title: `${KINDS[i % KINDS.length]} batch ${i + 1}`,
  status: STATUSES[i % STATUSES.length],
}));

export type ReviewFiltersProps = {
  tasks?: ReviewTask[];
  /** Rows per page. Default 5. */
  pageSize?: number;
};

export function ReviewFilters(_props: ReviewFiltersProps): JSX.Element {
  throw new Error('Not implemented');
}
