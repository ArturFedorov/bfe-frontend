import { ReactElement, useEffect, useState } from 'react';

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
  const [partnerListState, setPartnerListState] = useState<PartnerListState>({ status: 'loading'});

  useEffect(() => {
    let ignore = false;
    setPartnerListState({ status: 'loading' });

    fetch(endpoint)
      .then(res => {
        if (!res.ok) throw new Error(`Request failed with status ${res.status}`);
        return res.json();
      })
      .then((data: Partner[]) => {
        if (ignore) return;
        setPartnerListState({ status: 'success', partners: data });
      })
      .catch((error: Error) => {
        if (ignore) return;
        setPartnerListState({ status: 'error', message: error.message });
      })
      ;

    return () => {
      ignore = true;
    };
  }, [endpoint]);

  const render = (state: PartnerListState) => {
    switch (state.status) {
      case 'loading':
        return <div role="status">Loading partners…</div>
      case 'error':
        return <div role="alert">{ state.message }</div>
      case 'success':
        if (state.partners.length === 0) return <div>No partners found.</div>
        return <ul aria-label="Partners">
          {state.partners.map((partner) => <li key={partner.id}>{partner.name}</li>)}
        </ul>
    }
  }

  return (
    <div>{render(partnerListState)}</div>
  )
}
