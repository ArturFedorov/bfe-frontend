import { useMemo, useState } from 'react';
import { JobFeed, type Job, type JobApi } from './job_feed';

/**
 * Demo harness for the job feed — auto-discovered by the playground
 * (playground/App.tsx). The API is an in-memory board of 40 jobs with random
 * latency; a toggle makes every 5th item fail on its first fetch so you can
 * exercise the per-item Retry. Not part of the task: the spec lives in
 * README.md and the grader is job_feed.test.tsx. (StrictMode double-mounts
 * in dev, so you will see `listIds` called twice on first render — the first
 * mount's pool is aborted by the cleanup.)
 */

const TITLES = [
  'Senior Frontend Engineer (React, TypeScript)',
  'Design Systems Engineer',
  'Staff Engineer, Web Performance',
  'Accessibility Engineer',
  'Full-stack Engineer, Growth',
  'Engineering Manager, Platform',
  'Developer Experience Engineer',
  'Mobile Web Engineer',
];
const POSTERS = ['acme_hr', 'nordic_films', 'sakura_anim', 'meridian', 'baltic_dev', 'andes_tech'];

function seed(): Job[] {
  const nowSec = Math.floor(Date.now() / 1000);
  return Array.from({ length: 40 }, (_, i) => {
    const id = 4000 - i;
    return {
      id,
      title: `${TITLES[i % TITLES.length]} #${id}`,
      by: POSTERS[(i * 5) % POSTERS.length],
      time: nowSec - i * 2700 - 90, // every job ~45 min older than the previous one
      url: i % 3 === 2 ? undefined : `https://example.com/jobs/${id}`,
    };
  });
}

const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export default function Demo() {
  const [latency, setLatency] = useState(600);
  const [flaky, setFlaky] = useState(true);
  const [log, setLog] = useState<string[]>([]);
  const jobs = useMemo(() => seed(), []);

  const api = useMemo<JobApi>(() => {
    const failedOnce = new Set<number>();
    const push = (line: string) => setLog((l) => [line, ...l].slice(0, 8));
    return {
      async listIds() {
        push('listIds()');
        await wait(latency);
        return jobs.map((j) => j.id);
      },
      async getItem(id: number) {
        push(`getItem(${id})`);
        await wait(latency * (0.5 + Math.random()));
        if (flaky && id % 5 === 0 && !failedOnce.has(id)) {
          failedOnce.add(id);
          throw new Error(`simulated 500 for ${id}`);
        }
        const job = jobs.find((j) => j.id === id);
        if (!job) throw new Error(`no job ${id}`);
        return job;
      },
    };
  }, [latency, flaky, jobs]);

  return (
    <div className="demo">
      <h2>Job Board Feed</h2>
      <p className="demo-note">
        Implement <code>runPool</code>, <code>formatRelativeTime</code> and <code>JobFeed</code> in{' '}
        <code>job_feed.tsx</code>. Watch the API log: after <code>listIds</code> there are never more
        than three <code>getItem</code> calls in flight, and the fourth starts as soon as one settles.
        Items render in id order even though latency is random. Every 5th id fails once — use its{' '}
        <code>Retry</code>. <code>Load more</code> never refetches what is already shown. (Changing the
        controls remounts the feed.)
      </p>
      <div className="demo-stage">
        <style>{`
          .jobs [role="feed"] { display: grid; gap: 0.5rem; margin: 0.75rem 0; }
          .jobs article, .jobs [role="feed"] [role="alert"] { padding: 0.6rem 0.8rem; border: 1px solid #e5e7eb; border-radius: 6px; }
          .jobs article h3 { margin: 0 0 0.2rem; font-size: 1rem; }
          .jobs article p { margin: 0; color: #6b7280; font-size: 0.85rem; }
          .jobs [role="feed"] [role="alert"] { background: #fef2f2; border-color: #fecaca; color: #991b1b; }
          .jobs [role="status"] { color: #374151; font-size: 0.9rem; }
        `}</style>
        <div className="demo-controls">
          <label>
            Latency{' '}
            <input
              type="range"
              min={0}
              max={3000}
              step={100}
              value={latency}
              onChange={(e) => setLatency(Number(e.target.value))}
            />{' '}
            {latency}ms
          </label>
          <label>
            <input type="checkbox" checked={flaky} onChange={(e) => setFlaky(e.target.checked)} /> Every 5th id fails
            once
          </label>
        </div>
        <pre style={{ fontSize: '0.75rem', color: '#6b7280', margin: '0.75rem 0 0' }}>
          {log.length ? log.join('\n') : 'API log: nothing yet'}
        </pre>
        <div className="jobs">
          <JobFeed key={`${latency}-${flaky}`} api={api} pageSize={6} concurrency={3} />
        </div>
      </div>
    </div>
  );
}
