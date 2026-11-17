import {ReactElement, useEffect, useRef, useState} from 'react';

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
  const [state, setState] = useState<PartnerListState>({ status: 'loading' });

  useEffect(() => {
    let ignored = false;
    const controller = new AbortController();

    setState({ status: 'loading' });

    fetch(endpoint, { signal: controller.signal })
      .then(res => {
        if(!res.ok) throw new Error(`Request failed with status ${res.status}`);
        return res.json();
      })
    .then((data:Partner[]) => {
      if(ignored) return;
      setState({
        status: 'success',
        partners: data,
      })
    })
    .catch(err => {
      if(ignored) return;
      setState({
        status: 'error',
        message: err instanceof Error ? err.message : String(err),
      })
    });

    return () => {
      ignored = true;
      controller.abort();
    }

  }, [endpoint]);

  const render = () => {
    switch (state.status) {
      case 'loading':
        return <div role="status">Loading partners…</div>;
      case 'error':
        return <div role="alert">{state.message}</div>
      case 'success':
        if (state.partners.length === 0) {
          return <div role="status">No partners found.</div>
        }
        return (
          <ul aria-label="Partners">
            {state.partners.map((partner) => (<li key={partner.id}>{partner.name}</li>))}
          </ul>
        )
    }
  };

  return render();
}
