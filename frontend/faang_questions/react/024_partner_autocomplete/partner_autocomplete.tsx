import type { ReactNode } from 'react';

export interface Partner {
  id: string;
  name: string;
}

export interface PartnerAutocompleteProps {
  fetchPartners: (
    query: string,
    opts?: { signal?: AbortSignal }
  ) => Promise<Partner[]>;
  onSelect: (partner: Partner) => void;
  debounceMs?: number;
  label?: string;
}

export function PartnerAutocomplete({
  fetchPartners,
  onSelect,
  debounceMs = 300,
  label = 'Partner',
}: PartnerAutocompleteProps): ReactNode {
  // TODO: implement
  throw new Error('Not implemented');
}
