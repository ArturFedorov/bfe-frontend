import { useEffect, useState } from 'react';
import type { ReactElement } from 'react';

export interface Partner {
  id: string;
  name: string;
}

/**
 * One discriminated union instead of `isLoading` / `error` / `data` booleans:
 * "loading AND error" or "error AND data" simply cannot be represented, so the
 * render switch below is exhaustive and QA can never see two states at once.
 * "Empty" is not a fourth variant — it is derived from `success` with no rows.
 */
export type PartnerListState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'success'; partners: Partner[] };

export interface PartnerListProps {
  /** API endpoint returning Partner[]. Defaults to '/api/partners'. */
  endpoint?: string;
}

export function PartnerList({ endpoint = '/api/partners' }: PartnerListProps): ReactElement {
  const [state, setState] = useState<PartnerListState>({ status: 'loading' });

  useEffect(() => {
    // `ignore` is the classic "is this effect run still current?" flag. It is
    // captured by the closures below, and the cleanup flips it, so a response
    // that lands after unmount (or after `endpoint` changed) is dropped
    // instead of calling setState on a dead/stale effect.
    let ignore = false;

    // Reset to loading when the endpoint changes (no-op on first mount).
    setState({ status: 'loading' });

    fetch(endpoint)
      .then((res) => {
        // fetch only rejects on network failure; HTTP errors must be raised
        // by hand so they fall through to the same catch as rejections.
        if (!res.ok) throw new Error(`Request failed with status ${res.status}`);
        return res.json() as Promise<Partner[]>;
      })
      .then((partners) => {
        if (ignore) return;
        setState({ status: 'success', partners });
      })
      .catch((err: unknown) => {
        if (ignore) return;
        setState({
          status: 'error',
          message: err instanceof Error ? err.message : String(err),
        });
      });

    return () => {
      ignore = true;
    };
  }, [endpoint]);

  switch (state.status) {
    case 'loading':
      return <p role="status">Loading partners…</p>;

    case 'error':
      return <p role="alert">{state.message}</p>;

    case 'success':
      if (state.partners.length === 0) {
        // Distinct from the error state: the request succeeded, there is
        // just nothing to show.
        return <p>No partners found.</p>;
      }
      return (
        <ul aria-label="Partners">
          {state.partners.map((partner) => (
            <li key={partner.id}>{partner.name}</li>
          ))}
        </ul>
      );
  }
}
