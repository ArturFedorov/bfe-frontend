import { useRef, useState } from 'react';
import { CommentThread, type Comment } from './nested_comments';

/**
 * Demo harness for CommentThread — auto-discovered by the playground
 * (playground/App.tsx). Not part of the task: the spec lives in README.md and
 * the grader is nested_comments.test.tsx.
 */

const SEED: Comment[] = [
  { id: 'c1', parentId: null, author: 'Priya', text: 'Audio drifts ~80ms after the cold open. Anyone else seeing it?', createdAt: '2026-11-10T09:12:00Z' },
  { id: 'c2', parentId: 'c1', author: 'Sam', text: 'Confirmed on the 1080p rendition only.', createdAt: '2026-11-10T09:30:00Z' },
  { id: 'c3', parentId: 'c2', author: 'Priya', text: 'Re-muxing now, new asset in 10 min.', createdAt: '2026-11-10T09:41:00Z' },
  { id: 'c4', parentId: 'c3', author: 'Lee', text: 'Checked the new one — drift is gone.', createdAt: '2026-11-10T10:02:00Z' },
  { id: 'c5', parentId: 'c4', author: 'Sam', text: 'Approving for the release board.', createdAt: '2026-11-10T10:05:00Z' },
  { id: 'c6', parentId: 'c5', author: 'Priya', text: 'Thanks all.', createdAt: '2026-11-10T10:06:00Z' },
  { id: 'c7', parentId: 'c1', author: 'Lee', text: 'Unrelated: the slate still says S1.', createdAt: '2026-11-10T09:20:00Z' },
  { id: 'c8', parentId: null, author: 'Sam', text: 'Thumbnail is the old key art — swap before publish.', createdAt: '2026-11-10T11:00:00Z' },
  { id: 'c9', parentId: 'deleted-parent', author: 'Lee', text: 'Orphaned reply (its parent was deleted) — should render as a root.', createdAt: '2026-11-10T08:00:00Z' },
];

export default function Demo() {
  const [failNext, setFailNext] = useState(false);
  const [delay, setDelay] = useState(1200);
  const seq = useRef(100);

  const onReply = (parentId: string, text: string): Promise<Comment> =>
    new Promise((resolve, reject) => {
      const shouldFail = failNext;
      setFailNext(false);
      window.setTimeout(() => {
        if (shouldFail) reject(new Error('503 Service Unavailable'));
        else
          resolve({
            id: `srv-${++seq.current}`,
            parentId,
            author: 'Artur',
            text,
            createdAt: new Date().toISOString(),
          });
      }, delay);
    });

  return (
    <div className="demo">
      <h2>Nested Comments</h2>
      <p className="demo-note">
        Implement <code>buildThread</code>, <code>countDescendants</code> and{' '}
        <code>CommentThread</code> in <code>nested_comments.tsx</code>. Things to verify by hand:
        the orphaned comment renders as a root; replies post optimistically (dimmed while{' '}
        <code>data-pending</code>) and settle after the fake latency; tick &quot;fail the next
        reply&quot; to watch the rollback and alert; the 6-deep chain stops indenting at level 4
        behind &quot;Continue this thread&quot;; Collapse shows the hidden count.
      </p>
      <div className="demo-stage">
        <div className="demo-controls">
          <label>
            <input type="checkbox" checked={failNext} onChange={(e) => setFailNext(e.target.checked)} />{' '}
            Fail the next reply
          </label>
          <label>
            Latency{' '}
            <input
              type="range"
              min={0}
              max={4000}
              step={100}
              value={delay}
              onChange={(e) => setDelay(Number(e.target.value))}
            />{' '}
            {delay} ms
          </label>
        </div>
        <CommentThread comments={SEED} onReply={onReply} currentUser="Artur" />
      </div>
    </div>
  );
}
