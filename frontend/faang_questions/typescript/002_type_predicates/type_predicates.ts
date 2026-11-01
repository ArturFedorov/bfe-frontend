export interface Partner {
  kind: 'partner';
  id: string;
  name: string;
  tier: 'standard' | 'strategic';
}

export interface InternalTeam {
  kind: 'internal';
  id: string;
  teamName: string;
}

export type Account = Partner | InternalTeam;

// TODO: the return type must be a type predicate, not boolean
export function isPartner(account: Account): boolean {
  // TODO: implement
  throw new Error('Not implemented');
}

// TODO: the return type must be a generic type predicate, not boolean
export function isPresent<T>(value: T | null | undefined): boolean {
  // TODO: implement
  throw new Error('Not implemented');
}

export function selectPartners(accounts: Account[]): Partner[] {
  // TODO: implement with filter(isPartner) — no casts
  throw new Error('Not implemented');
}
