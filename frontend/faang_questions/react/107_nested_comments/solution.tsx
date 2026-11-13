/**
 * Reference solution for 107 — keep nested_comments.tsx blank for redo practice;
 * this file is for comparison after your own attempt.
 *
 * State shape (say it out loud first):
 *   pending[]    optimistic replies with temporary ids (data-pending="true")
 *   confirmed[]  server copies that have resolved but may not be in props yet
 *   collapsed    Set<id> of comments whose subtree is hidden
 *   replyingTo   the single open reply form (id | null) + its draft text
 * The tree itself is never stored: it is rebuilt every render from
 * `props.comments ∪ confirmed ∪ pending` (props win on duplicate ids).
 */
import { useMemo, useRef, useState, type FormEvent, type ReactElement } from 'react';

export interface Comment {
  id: string;
  parentId: string | null;
  author: string;
  text: string;
  createdAt: string; // ISO 8601
}

export interface ThreadNode extends Comment {
  children: ThreadNode[];
}

export interface CommentThreadProps {
  comments: readonly Comment[];
  /** Resolves with the server's copy of the comment (its real id). */
  onReply: (parentId: string, text: string) => Promise<Comment>;
  /** Author name used for optimistic comments. */
  currentUser: string;
}

/** Deepest visual level; anything deeper is flattened at this level. */
export const MAX_DEPTH = 4;

// ---------------------------------------------------------------------------
// Pure helpers
// ---------------------------------------------------------------------------

/** createdAt ascending; ties broken by id so the order is stable across renders. */
function byCreatedAt(a: ThreadNode, b: ThreadNode): number {
  if (a.createdAt !== b.createdAt) return a.createdAt < b.createdAt ? -1 : 1;
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}

/**
 * Nest a flat list into a forest. Children are sorted by `createdAt` asc.
 * Comments whose `parentId` points at a missing comment are treated as roots.
 */
export function buildThread(comments: readonly Comment[]): ThreadNode[] {
  // One node per comment; spreading copies so the input objects are never touched.
  const nodes = new Map<string, ThreadNode>();
  for (const c of comments) nodes.set(c.id, { ...c, children: [] });

  const roots: ThreadNode[] = [];
  for (const node of nodes.values()) {
    const parent = node.parentId === null ? undefined : nodes.get(node.parentId);
    // A comment that claims to be its own parent is treated as orphaned (root),
    // otherwise the recursive sort below would never terminate.
    if (parent && parent !== node) parent.children.push(node);
    else roots.push(node);
  }

  const sortDeep = (list: ThreadNode[]): void => {
    list.sort(byCreatedAt);
    for (const n of list) sortDeep(n.children);
  };
  sortDeep(roots);
  return roots;
}

/** Number of comments in the subtree below `node`. */
export function countDescendants(node: ThreadNode): number {
  let total = 0;
  for (const child of node.children) total += 1 + countDescendants(child);
  return total;
}

/** Pre-order walk of a subtree (used to flatten everything below level 4). */
function flattenSubtree(nodes: readonly ThreadNode[], out: ThreadNode[] = []): ThreadNode[] {
  for (const n of nodes) {
    out.push(n);
    flattenSubtree(n.children, out);
  }
  return out;
}

const pluralReplies = (n: number): string => `${n} ${n === 1 ? 'reply' : 'replies'} hidden`;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CommentThread({ comments, onReply, currentUser }: CommentThreadProps): ReactElement {
  const [pending, setPending] = useState<Comment[]>([]);
  const [confirmed, setConfirmed] = useState<Comment[]>([]);
  const [collapsed, setCollapsed] = useState<ReadonlySet<string>>(() => new Set());
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [error, setError] = useState<string | null>(null);
  const tempSeq = useRef(0);

  // props ∪ confirmed ∪ pending, deduped by id with props winning. Memoised so
  // typing in the reply box (draft state) does not rebuild the tree.
  const thread = useMemo(() => {
    const seen = new Set(comments.map((c) => c.id));
    const merged: Comment[] = [...comments];
    for (const c of [...confirmed, ...pending]) {
      if (seen.has(c.id)) continue;
      seen.add(c.id);
      merged.push(c);
    }
    return buildThread(merged);
  }, [comments, confirmed, pending]);

  const openReply = (id: string): void => {
    setReplyingTo(id);
    setDraft('');
    setError(null);
  };

  const closeReply = (): void => {
    setReplyingTo(null);
    setDraft('');
  };

  const toggleCollapsed = (id: string): void => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const submitReply = (parentId: string): void => {
    const text = draft.trim();
    if (!text) return;

    const temp: Comment = {
      id: `tmp-${++tempSeq.current}`,
      parentId,
      author: currentUser,
      text,
      createdAt: new Date().toISOString(),
    };
    // 1. Show it at once …
    setPending((prev) => [...prev, temp]);
    closeReply();

    // 2. … then swap in the server copy, or roll back with an alert.
    onReply(parentId, text).then(
      (server) => {
        setPending((prev) => prev.filter((c) => c.id !== temp.id));
        setConfirmed((prev) => (prev.some((c) => c.id === server.id) ? prev : [...prev, server]));
      },
      () => {
        setPending((prev) => prev.filter((c) => c.id !== temp.id));
        setError('Your reply could not be posted. Please try again.');
      },
    );
  };

  const pendingIds = useMemo(() => new Set(pending.map((c) => c.id)), [pending]);

  /** One comment `<li>`. `flattened` items (below level 4) get no toggle and no nested list. */
  const renderItem = (node: ThreadNode, level: number, flattened: boolean): ReactElement => {
    const hasChildren = node.children.length > 0;
    const isCollapsed = collapsed.has(node.id);
    const showToggle = hasChildren && !flattened;
    // Level-4 comments keep their descendants as flattened siblings (rendered by
    // the parent list), everything above nests normally.
    const nestChildren = hasChildren && !flattened && !isCollapsed && level < MAX_DEPTH;

    return (
      <li
        key={node.id}
        role="listitem"
        aria-level={level}
        data-comment-id={node.id}
        data-pending={pendingIds.has(node.id) ? 'true' : undefined}
        style={{ ['--level' as string]: level }}
      >
        <article className="comment">
          <header>
            <span className="comment-author">{node.author}</span>{' '}
            <time dateTime={node.createdAt}>{node.createdAt}</time>
          </header>
          <p className="comment-text">{node.text}</p>
          <div className="comment-actions">
            <button type="button" onClick={() => openReply(node.id)}>
              Reply
            </button>
            {showToggle && (
              <button type="button" aria-expanded={!isCollapsed} onClick={() => toggleCollapsed(node.id)}>
                {isCollapsed ? 'Expand' : 'Collapse'}
              </button>
            )}
            {showToggle && isCollapsed && <span className="comment-hidden">{pluralReplies(countDescendants(node))}</span>}
          </div>
          {replyingTo === node.id && (
            <ReplyForm
              author={node.author}
              draft={draft}
              onDraft={setDraft}
              onCancel={closeReply}
              onSubmit={() => submitReply(node.id)}
            />
          )}
        </article>
        {nestChildren && renderList(node.children, level + 1)}
      </li>
    );
  };

  /** A sibling list. At MAX_DEPTH each node's subtree is appended flat behind a marker. */
  const renderList = (nodes: readonly ThreadNode[], level: number): ReactElement => (
    <ul role="list" className="comment-list">
      {nodes.flatMap((node) => {
        const items = [renderItem(node, level, false)];
        if (level === MAX_DEPTH && node.children.length > 0 && !collapsed.has(node.id)) {
          items.push(
            <li key={`${node.id}:continue`} className="comment-continue">
              Continue this thread
            </li>,
          );
          for (const deep of flattenSubtree(node.children)) items.push(renderItem(deep, MAX_DEPTH, true));
        }
        return items;
      })}
    </ul>
  );

  return (
    <section className="comment-thread">
      {error && (
        <div role="alert" className="comment-error">
          {error}
        </div>
      )}
      {renderList(thread, 1)}
    </section>
  );
}

// ---------------------------------------------------------------------------
// Reply form — controlled by the thread so only one can be open at a time.
// ---------------------------------------------------------------------------

interface ReplyFormProps {
  author: string;
  draft: string;
  onDraft: (text: string) => void;
  onCancel: () => void;
  onSubmit: () => void;
}

function ReplyForm({ author, draft, onDraft, onCancel, onSubmit }: ReplyFormProps): ReactElement {
  const handleSubmit = (e: FormEvent): void => {
    e.preventDefault();
    onSubmit();
  };
  return (
    <form className="reply-form" onSubmit={handleSubmit}>
      <textarea
        aria-label={`Reply to ${author}`}
        value={draft}
        onChange={(e) => onDraft(e.target.value)}
        rows={3}
        autoFocus
      />
      <div className="reply-actions">
        <button type="submit" disabled={draft.trim() === ''}>
          Post
        </button>
        <button type="button" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}
