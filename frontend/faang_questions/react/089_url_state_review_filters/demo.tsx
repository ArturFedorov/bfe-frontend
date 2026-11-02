import { useEffect, useRef, useState } from 'react';
import { ReviewFilters } from './review_filters';

/**
 * Demo harness for URL-synced review filters — auto-discovered by the
 * playground (playground/App.tsx). Renders the shipped <ReviewFilters /> next
 * to a live readout of `window.location.search` and `history.length`, so you
 * can watch which interactions push entries (status, paging, row click) and
 * which only replace (debounced search).
 *
 * `pushState`/`replaceState` fire no event, so the readout listens to
 * `popstate` for Back/Forward and polls every 300 ms for programmatic writes.
 */
type UrlReadout = { search: string; length: number };

function readUrl(): UrlReadout {
  return { search: window.location.search, length: window.history.length };
}

export default function Demo() {
  const [url, setUrl] = useState<UrlReadout>(readUrl);
  const [copyStatus, setCopyStatus] = useState('');
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const sync = () => {
      const next = readUrl();
      setUrl((prev) =>
        prev.search === next.search && prev.length === next.length ? prev : next,
      );
    };
    window.addEventListener('popstate', sync);
    const poll = setInterval(sync, 300);
    return () => {
      window.removeEventListener('popstate', sync);
      clearInterval(poll);
    };
  }, []);

  useEffect(
    () => () => {
      if (copyTimer.current) clearTimeout(copyTimer.current);
    },
    [],
  );

  const flashStatus = (text: string) => {
    setCopyStatus(text);
    if (copyTimer.current) clearTimeout(copyTimer.current);
    copyTimer.current = setTimeout(() => setCopyStatus(''), 1500);
  };

  const copyLink = () => {
    if (!navigator.clipboard) {
      flashStatus('clipboard unavailable');
      return;
    }
    navigator.clipboard.writeText(window.location.href).then(
      () => flashStatus('copied'),
      () => flashStatus('copy failed'),
    );
  };

  return (
    <div className="demo">
      <h2>URL State Review Filters</h2>
      <p className="demo-note">
        Implement <code>useUrlState</code>, <code>parseUrlState</code> and{' '}
        <code>serializeUrlState</code> in <code>use_url_state.ts</code>, then{' '}
        <code>ReviewFilters</code> in <code>review_filters.tsx</code>. Change the status, page
        and selection and watch <code>history.length</code> grow by one per action; type in
        Search and watch the query string update ~300 ms later with <strong>no</strong> new
        entry. Back/Forward re-sync the UI. <strong>Heads-up:</strong> the playground uses hash
        routing, so the query string sits <em>before</em> the <code>#</code> (
        <code>/?status=approved#/089_…</code>). A correct hook preserves the hash when it writes
        — if the demo disappears after a filter change, your hook dropped it. Back may also leave
        the demo when the previous entry was another task.
      </p>
      <div className="demo-stage">
        <div className="demo-controls">
          <span>
            location.search: <code>{url.search === '' ? '(empty)' : url.search}</code>
          </span>
          <span>
            history.length: <strong>{url.length}</strong>
          </span>
          <button onClick={() => window.history.back()}>Back</button>
          <button onClick={() => window.history.forward()}>Forward</button>
          <button onClick={copyLink}>Copy link</button>
          <span role="status">{copyStatus}</span>
        </div>
        <ReviewFilters />
      </div>
    </div>
  );
}
