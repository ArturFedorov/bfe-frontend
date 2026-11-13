/** @jest-environment jsdom */
import '@testing-library/jest-dom';
import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { deferred } from '../_helpers/deferred';
import { CommentThread, buildThread, countDescendants, type Comment } from './nested_comments';

const c = (id: string, parentId: string | null, author: string, text: string, createdAt: string): Comment => ({
  id,
  parentId,
  author,
  text,
  createdAt,
});

// Deliberately out of order so sorting is observable.
const COMMENTS: Comment[] = [
  c('r2', null, 'Priya', 'Second root', '2026-03-02T10:00:00Z'),
  c('r1', null, 'Sam', 'First root', '2026-03-01T10:00:00Z'),
  c('r1b', 'r1', 'Lee', 'Later reply', '2026-03-01T12:00:00Z'),
  c('r1a', 'r1', 'Priya', 'Earlier reply', '2026-03-01T11:00:00Z'),
  c('r1a1', 'r1a', 'Sam', 'Nested reply', '2026-03-01T11:30:00Z'),
];

const item = (text: string) => screen.getByText(text).closest('li') as HTMLElement;
const ownButton = (el: HTMLElement, name: string) => within(el).getAllByRole('button', { name })[0];

describe('pure: buildThread / countDescendants', () => {
  it('nests children under their parent and sorts every level by createdAt asc', () => {
    const thread = buildThread(COMMENTS);
    expect(thread.map((n) => n.id)).toEqual(['r1', 'r2']);
    expect(thread[0].children.map((n) => n.id)).toEqual(['r1a', 'r1b']);
    expect(thread[0].children[0].children.map((n) => n.id)).toEqual(['r1a1']);
    expect(thread[1].children).toEqual([]);
  });

  it('does not mutate the input array', () => {
    const copy = [...COMMENTS];
    buildThread(COMMENTS);
    expect(COMMENTS).toEqual(copy);
  });

  it('senior: orphans whose parent is missing become roots', () => {
    const thread = buildThread([
      ...COMMENTS,
      c('lost', 'deleted-parent', 'Lee', 'Orphan', '2026-03-01T09:00:00Z'),
    ]);
    expect(thread.map((n) => n.id)).toEqual(['lost', 'r1', 'r2']);
  });

  it('countDescendants counts the whole subtree', () => {
    const [r1, r2] = buildThread(COMMENTS);
    expect(countDescendants(r1)).toBe(3);
    expect(countDescendants(r1.children[0])).toBe(1);
    expect(countDescendants(r2)).toBe(0);
  });
});

const noReply = () => Promise.reject(new Error('not used'));

describe('1. nested rendering', () => {
  it('renders nested lists with aria-level, author and text', () => {
    render(<CommentThread comments={COMMENTS} onReply={noReply} currentUser="Artur" />);
    expect(item('First root')).toHaveAttribute('aria-level', '1');
    expect(item('Earlier reply')).toHaveAttribute('aria-level', '2');
    expect(item('Nested reply')).toHaveAttribute('aria-level', '3');
    expect(within(item('Later reply')).getByText('Lee')).toBeInTheDocument();
    // the nested reply lives inside its parent's list item
    expect(item('First root')).toContainElement(item('Nested reply'));
    expect(within(item('First root')).getAllByRole('list')).toHaveLength(2);
  });

  it('orders siblings by createdAt regardless of input order', () => {
    render(<CommentThread comments={COMMENTS} onReply={noReply} currentUser="Artur" />);
    const texts = screen.getAllByRole('listitem').map((li) => within(li).getAllByText(/root|reply/i)[0].textContent);
    expect(texts).toEqual(['First root', 'Earlier reply', 'Nested reply', 'Later reply', 'Second root']);
  });
});

describe('2. reply form', () => {
  it('Reply opens a textarea labelled "Reply to <author>" with Post and Cancel; Cancel closes it', async () => {
    const user = userEvent.setup();
    render(<CommentThread comments={COMMENTS} onReply={noReply} currentUser="Artur" />);
    await user.click(ownButton(item('Earlier reply'), 'Reply'));
    const box = screen.getByRole('textbox', { name: 'Reply to Priya' });
    expect(box).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Post' })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });

  it('Post calls onReply(parentId, text)', async () => {
    const user = userEvent.setup();
    const onReply = jest.fn((parentId: string, text: string) =>
      Promise.resolve(c('srv-1', parentId, 'Artur', text, '2026-03-03T00:00:00Z')),
    );
    render(<CommentThread comments={COMMENTS} onReply={onReply} currentUser="Artur" />);
    await user.click(ownButton(item('Second root'), 'Reply'));
    await user.type(screen.getByRole('textbox', { name: 'Reply to Priya' }), 'Looks good');
    await user.click(screen.getByRole('button', { name: 'Post' }));
    expect(onReply).toHaveBeenCalledWith('r2', 'Looks good');
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });
});

describe('3. optimistic posting', () => {
  it('shows the reply immediately with data-pending, then swaps in the server comment', async () => {
    const user = userEvent.setup();
    const d = deferred<Comment>();
    render(<CommentThread comments={COMMENTS} onReply={() => d.promise} currentUser="Artur" />);
    await user.click(ownButton(item('Second root'), 'Reply'));
    await user.type(screen.getByRole('textbox'), 'Ship it');
    await user.click(screen.getByRole('button', { name: 'Post' }));

    const optimistic = item('Ship it');
    expect(optimistic).toHaveAttribute('data-pending', 'true');
    expect(optimistic).toHaveAttribute('aria-level', '2');
    expect(item('Second root')).toContainElement(optimistic);
    expect(within(optimistic).getByText('Artur')).toBeInTheDocument();
    const tempId = optimistic.getAttribute('data-comment-id');

    await act(async () => {
      d.resolve(c('srv-42', 'r2', 'Artur', 'Ship it', '2026-03-03T00:00:00Z'));
      await d.promise;
    });
    const settled = item('Ship it');
    expect(settled).not.toHaveAttribute('data-pending');
    expect(settled).toHaveAttribute('data-comment-id', 'srv-42');
    expect(settled.getAttribute('data-comment-id')).not.toBe(tempId);
    expect(screen.getAllByText('Ship it')).toHaveLength(1);
  });

  it('senior: removes the optimistic reply and shows an alert when the server rejects', async () => {
    const user = userEvent.setup();
    const d = deferred<Comment>();
    render(<CommentThread comments={COMMENTS} onReply={() => d.promise} currentUser="Artur" />);
    await user.click(ownButton(item('First root'), 'Reply'));
    await user.type(screen.getByRole('textbox'), 'Will vanish');
    await user.click(screen.getByRole('button', { name: 'Post' }));
    expect(item('Will vanish')).toHaveAttribute('data-pending', 'true');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();

    await act(async () => {
      d.reject(new Error('500'));
      await d.promise.catch(() => undefined);
    });
    expect(screen.queryByText('Will vanish')).not.toBeInTheDocument();
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(5);
  });

  it('a reply confirmed locally is not duplicated when the parent re-renders with it in props', async () => {
    const user = userEvent.setup();
    const server = c('srv-7', 'r2', 'Artur', 'Once only', '2026-03-03T00:00:00Z');
    const { rerender } = render(
      <CommentThread comments={COMMENTS} onReply={() => Promise.resolve(server)} currentUser="Artur" />,
    );
    await user.click(ownButton(item('Second root'), 'Reply'));
    await user.type(screen.getByRole('textbox'), 'Once only');
    await user.click(screen.getByRole('button', { name: 'Post' }));
    await act(async () => {
      await Promise.resolve();
    });
    rerender(
      <CommentThread comments={[...COMMENTS, server]} onReply={() => Promise.resolve(server)} currentUser="Artur" />,
    );
    expect(screen.getAllByText('Once only')).toHaveLength(1);
  });
});

describe('4. collapse / expand', () => {
  it('Collapse hides the subtree and shows "N replies hidden"; Expand restores it', async () => {
    const user = userEvent.setup();
    render(<CommentThread comments={COMMENTS} onReply={noReply} currentUser="Artur" />);
    const root = item('First root');
    const toggle = ownButton(root, 'Collapse');
    expect(toggle).toHaveAttribute('aria-expanded', 'true');

    await user.click(toggle);
    expect(screen.queryByText('Earlier reply')).not.toBeInTheDocument();
    expect(screen.queryByText('Nested reply')).not.toBeInTheDocument();
    expect(screen.getByText('3 replies hidden')).toBeInTheDocument();
    expect(ownButton(root, 'Expand')).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getByText('Second root')).toBeInTheDocument();

    await user.click(ownButton(root, 'Expand'));
    expect(screen.getByText('Nested reply')).toBeInTheDocument();
    expect(screen.queryByText(/replies hidden/)).not.toBeInTheDocument();
  });

  it('uses the singular for one hidden reply and offers no toggle on leaves', async () => {
    const user = userEvent.setup();
    render(<CommentThread comments={COMMENTS} onReply={noReply} currentUser="Artur" />);
    expect(within(item('Second root')).queryByRole('button', { name: /Collapse|Expand/ })).toBeNull();
    await user.click(ownButton(item('Earlier reply'), 'Collapse'));
    expect(screen.getByText('1 reply hidden')).toBeInTheDocument();
  });
});

describe('5. maximum visual depth', () => {
  const CHAIN: Comment[] = Array.from({ length: 6 }, (_, i) =>
    c(`d${i + 1}`, i === 0 ? null : `d${i}`, 'Sam', `Depth ${i + 1}`, `2026-03-01T1${i}:00:00Z`),
  );

  it('senior: replies deeper than 4 render flattened at level 4 behind a "Continue this thread" marker', () => {
    render(<CommentThread comments={CHAIN} onReply={noReply} currentUser="Artur" />);
    expect(item('Depth 4')).toHaveAttribute('aria-level', '4');
    expect(item('Depth 5')).toHaveAttribute('aria-level', '4');
    expect(item('Depth 6')).toHaveAttribute('aria-level', '4');
    const levels = screen.getAllByRole('listitem').map((li) => Number(li.getAttribute('aria-level')));
    expect(Math.max(...levels)).toBe(4);

    const marker = screen.getByText('Continue this thread');
    expect(item('Depth 4').parentElement).toBe(marker.closest('ul'));
    expect(item('Depth 4')).not.toContainElement(item('Depth 5'));
    // siblings in DOM order: Depth 4, marker, Depth 5, Depth 6
    const siblings = Array.from(item('Depth 4').parentElement!.children).map((el) => el.textContent);
    expect(siblings[0]).toContain('Depth 4');
    expect(siblings[1]).toBe('Continue this thread');
    expect(siblings[2]).toContain('Depth 5');
    expect(siblings[3]).toContain('Depth 6');
  });

  it('collapsing the level-4 comment hides the flattened tail too', async () => {
    const user = userEvent.setup();
    render(<CommentThread comments={CHAIN} onReply={noReply} currentUser="Artur" />);
    await user.click(ownButton(item('Depth 4'), 'Collapse'));
    expect(screen.queryByText('Depth 5')).not.toBeInTheDocument();
    expect(screen.queryByText('Continue this thread')).not.toBeInTheDocument();
    expect(screen.getByText('2 replies hidden')).toBeInTheDocument();
  });
});
