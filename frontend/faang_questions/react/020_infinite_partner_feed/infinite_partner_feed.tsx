import type { ReactNode } from 'react';

export interface PartnerEvent {
  id: string;
  message: string;
}

export interface EventsPage {
  events: PartnerEvent[];
  hasMore: boolean;
}

export interface InfinitePartnerFeedProps {
  fetchEvents: (page: number) => Promise<EventsPage>;
}

export function InfinitePartnerFeed({ fetchEvents }: InfinitePartnerFeedProps): ReactNode {
  // TODO: implement
  throw new Error('Not implemented');
}
