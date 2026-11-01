/** @jest-environment jsdom */
import '@testing-library/jest-dom';
import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Deferred, deferred } from '../_helpers/deferred';
import { ConflictEditor, Doc, SaveResult, applyResolutions, conflictingFields, draftKey } from './conflict_editor';

function createMemoryStorage(): Storage {
  const map = new Map<string, string>();
  return {
    get length() {
      return map.size;
    },
    clear: () => map.clear(),
    getItem: (k: string) => (map.has(k) ? (map.get(k) as string) : null),
    key: (i: number) => Array.from(map.keys())[i] ?? null,
    removeItem: (k: string) => {
      map.delete(k);
    },
    setItem: (k: string, v: string) => {
      map.set(k, String(v));
    },
  };
}

interface Mocked {
  save: jest.Mock<Promise<SaveResult>, [Doc]>;
  /** One deferred per `save()` call, in call order. */
  saves: Deferred<SaveResult>[];
  storage: Storage;
}

function createSave(): Mocked {
  const saves: Deferred<SaveResult>[] = [];
  const save = jest.fn((_doc: Doc) => {
    const d = deferred<SaveResult>();
    saves.push(d);
    return d.promise;
  });
  return { save, saves, storage: createMemoryStorage() };
}

const initial: Doc = { version: 1, fields: { title: 'Label street signs', notes: 'Use the 2024 guideline' } };

function mount(m: Mocked, props: Partial<{ autosaveMs: number; initial: Doc }> = {}) {
  const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
  const utils = render(
    <ConflictEditor docId="doc-1" initial={props.initial ?? initial} save={m.save} storage={m.storage} autosaveMs={props.autosaveMs} />
  );
  return { user, ...utils };
}

const advance = (ms: number) =>
  act(() => {
    jest.advanceTimersByTime(ms);
  });

const settle = (d: Deferred<SaveResult>, result: SaveResult) =>
  act(async () => {
    d.resolve(result);
  });

const statusText = () => screen.getByRole('status').textContent;

const dispatch = (type: 'online' | 'offline') =>
  act(() => {
    window.dispatchEvent(new Event(type));
  });

beforeEach(() => {
  jest.useFakeTimers();
});
afterEach(() => {
  jest.useRealTimers();
});

describe('pure helpers', () => {
  it('draftKey namespaces by document id', () => {
    expect(draftKey('abc')).toBe('draft:abc');
  });

  it('conflictingFields lists only fields whose values differ, including fields missing on one side', () => {
    expect(conflictingFields({ a: '1', b: '2', c: '3' }, { a: '1', b: 'x', d: '4' })).toEqual(['b', 'c', 'd']);
    expect(conflictingFields({ a: '1' }, { a: '1' })).toEqual([]);
  });

  it('applyResolutions picks mine, theirs, or joins both with a newline, and keeps unlisted fields from mine', () => {
    const mine = { title: 'M', notes: 'mine notes', other: 'keep' };
    const theirs = { title: 'T', notes: 'their notes', other: 'drop' };
    expect(applyResolutions(mine, theirs, { title: 'theirs', notes: 'both' })).toEqual({
      title: 'T',
      notes: 'mine notes\ntheir notes',
      other: 'keep',
    });
    expect(applyResolutions(mine, theirs, { title: 'mine' })).toEqual(mine);
  });
});

describe('ConflictEditor — rendering', () => {
  it('renders one text input per field labelled by the field name, prefilled, with status "Saved"', () => {
    const m = createSave();
    mount(m);
    expect(screen.getByLabelText('title')).toHaveValue('Label street signs');
    expect(screen.getByLabelText('notes')).toHaveValue('Use the 2024 guideline');
    expect(screen.getAllByRole('textbox')).toHaveLength(2);
    expect(statusText()).toBe('Saved');
    expect(m.save).not.toHaveBeenCalled();
  });

  it('the status element is a polite live region', () => {
    mount(createSave());
    expect(screen.getByRole('status')).toHaveAttribute('aria-live', 'polite');
  });
});

describe('ConflictEditor — debounced autosave', () => {
  it('saves the current doc with its version once after autosaveMs of inactivity', async () => {
    const m = createSave();
    const { user } = mount(m, { autosaveMs: 1000 });
    await user.type(screen.getByLabelText('title'), '!');
    advance(600);
    await user.type(screen.getByLabelText('title'), '?');
    advance(999);
    expect(m.save).not.toHaveBeenCalled();
    advance(1);
    expect(m.save).toHaveBeenCalledTimes(1);
    expect(m.save).toHaveBeenCalledWith({ version: 1, fields: { ...initial.fields, title: 'Label street signs!?' } });
  });

  it('uses 1000ms by default', async () => {
    const m = createSave();
    const { user } = mount(m);
    await user.type(screen.getByLabelText('notes'), 'x');
    advance(999);
    expect(m.save).not.toHaveBeenCalled();
    advance(1);
    expect(m.save).toHaveBeenCalledTimes(1);
  });

  it('reads "Saving…" while the save is in flight and "Saved" after it succeeds; the new version is used next', async () => {
    const m = createSave();
    const { user } = mount(m, { autosaveMs: 500 });
    await user.type(screen.getByLabelText('title'), 'A');
    advance(500);
    expect(statusText()).toBe('Saving…');

    await settle(m.saves[0], { ok: true, version: 7 });
    expect(statusText()).toBe('Saved');

    await user.type(screen.getByLabelText('title'), 'B');
    advance(500);
    expect(m.save).toHaveBeenCalledTimes(2);
    expect(m.save.mock.calls[1][0].version).toBe(7);
  });

  it('cancels a pending autosave on unmount and ignores a result arriving after unmount', async () => {
    const m = createSave();
    const { user, unmount } = mount(m, { autosaveMs: 500 });
    await user.type(screen.getByLabelText('title'), 'A');
    advance(499);
    unmount();
    advance(5000);
    expect(m.save).not.toHaveBeenCalled();
  });

  it('shows a rejected save in an alert and retries on the next edit', async () => {
    const m = createSave();
    const { user } = mount(m, { autosaveMs: 500 });
    await user.type(screen.getByLabelText('title'), 'A');
    advance(500);
    await act(async () => {
      m.saves[0].reject(new Error('Network down'));
    });
    expect(screen.getByRole('alert')).toHaveTextContent('Network down');
    expect(statusText()).toBe('Saved');
    advance(5000);
    expect(m.save).toHaveBeenCalledTimes(1); // no automatic retry loop

    await user.type(screen.getByLabelText('title'), 'B');
    advance(500);
    expect(m.save).toHaveBeenCalledTimes(2);
    expect(m.save.mock.calls[1][0].fields.title).toBe('Label street signsAB');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});

describe('ConflictEditor — queued edits during an in-flight save', () => {
  it('senior: two edits while a save is pending produce exactly one follow-up save containing both', async () => {
    const m = createSave();
    const { user } = mount(m, { autosaveMs: 500 });
    await user.type(screen.getByLabelText('title'), 'A');
    advance(500);
    expect(m.save).toHaveBeenCalledTimes(1);

    await user.type(screen.getByLabelText('title'), 'B');
    advance(500);
    await user.type(screen.getByLabelText('notes'), 'C');
    advance(2000);
    expect(m.save).toHaveBeenCalledTimes(1); // never two concurrent saves

    await settle(m.saves[0], { ok: true, version: 2 });
    advance(500);
    expect(m.save).toHaveBeenCalledTimes(2);
    expect(m.save.mock.calls[1][0]).toEqual({
      version: 2,
      fields: { title: 'Label street signsAB', notes: 'Use the 2024 guidelineC' },
    });

    await settle(m.saves[1], { ok: true, version: 3 });
    advance(5000);
    expect(m.save).toHaveBeenCalledTimes(2);
    expect(statusText()).toBe('Saved');
  });

  it('does not follow up when nothing changed during the in-flight save', async () => {
    const m = createSave();
    const { user } = mount(m, { autosaveMs: 500 });
    await user.type(screen.getByLabelText('title'), 'A');
    advance(500);
    await settle(m.saves[0], { ok: true, version: 2 });
    advance(5000);
    expect(m.save).toHaveBeenCalledTimes(1);
  });
});

describe('ConflictEditor — conflict resolution', () => {
  const theirs: Doc = { version: 5, fields: { title: 'Label road signs', notes: 'Use the 2024 guideline' } };

  async function reachConflict(m: Mocked, user: ReturnType<typeof userEvent.setup>) {
    await user.type(screen.getByLabelText('title'), ' v2');
    advance(500);
    await settle(m.saves[0], { ok: false, code: 'conflict', theirs });
  }

  it('shows one labelled group with Mine/Theirs/Both radios per differing field only', async () => {
    const m = createSave();
    const { user } = mount(m, { autosaveMs: 500 });
    await reachConflict(m, user);

    expect(statusText()).toBe('Conflict — resolve to continue');
    const group = screen.getByRole('group', { name: 'Conflict: title' });
    expect(within(group).getByRole('radio', { name: 'Mine' })).toBeInTheDocument();
    expect(within(group).getByRole('radio', { name: 'Theirs' })).toBeInTheDocument();
    expect(within(group).getByRole('radio', { name: 'Both' })).toBeInTheDocument();
    expect(screen.queryByRole('group', { name: 'Conflict: notes' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Resolve' })).toBeInTheDocument();
  });

  it('Resolve with "Theirs" applies their value and re-saves with theirs.version', async () => {
    const m = createSave();
    const { user } = mount(m, { autosaveMs: 500 });
    await reachConflict(m, user);

    await user.click(within(screen.getByRole('group', { name: 'Conflict: title' })).getByRole('radio', { name: 'Theirs' }));
    await user.click(screen.getByRole('button', { name: 'Resolve' }));

    expect(m.save).toHaveBeenCalledTimes(2);
    expect(m.save.mock.calls[1][0]).toEqual({ version: 5, fields: { title: 'Label road signs', notes: 'Use the 2024 guideline' } });
    expect(screen.getByLabelText('title')).toHaveValue('Label road signs');
    expect(statusText()).toBe('Saving…');
    expect(screen.queryByRole('group', { name: /^Conflict:/ })).not.toBeInTheDocument();

    await settle(m.saves[1], { ok: true, version: 6 });
    expect(statusText()).toBe('Saved');
  });

  it('"Both" joins mine and theirs with a newline', async () => {
    const m = createSave();
    const { user } = mount(m, { autosaveMs: 500 });
    await reachConflict(m, user);
    await user.click(within(screen.getByRole('group', { name: 'Conflict: title' })).getByRole('radio', { name: 'Both' }));
    await user.click(screen.getByRole('button', { name: 'Resolve' }));
    expect(m.save.mock.calls[1][0].fields.title).toBe('Label street signs v2\nLabel road signs');
  });

  it('suspends autosave while a conflict is open', async () => {
    const m = createSave();
    const { user } = mount(m, { autosaveMs: 500 });
    await reachConflict(m, user);
    await user.type(screen.getByLabelText('notes'), '!');
    advance(5000);
    expect(m.save).toHaveBeenCalledTimes(1);
  });

  it('senior: a conflict in one field leaves the others editable, and those edits ride along on the resolve save', async () => {
    const m = createSave();
    const { user } = mount(m, { autosaveMs: 500 });
    await reachConflict(m, user);

    const notes = screen.getByLabelText('notes');
    expect(notes).toBeEnabled();
    await user.clear(notes);
    await user.type(notes, 'Use the 2025 guideline');
    expect(notes).toHaveValue('Use the 2025 guideline');

    // default choice is Mine
    await user.click(screen.getByRole('button', { name: 'Resolve' }));
    expect(m.save).toHaveBeenCalledTimes(2);
    expect(m.save.mock.calls[1][0]).toEqual({
      version: 5,
      fields: { title: 'Label street signs v2', notes: 'Use the 2025 guideline' },
    });
  });
});

describe('ConflictEditor — offline', () => {
  it('while offline does not call save, reports the offline status and keeps a draft under draft:<docId>', async () => {
    const m = createSave();
    const { user } = mount(m, { autosaveMs: 500 });
    dispatch('offline');
    expect(statusText()).toBe('Offline — draft kept locally');

    await user.type(screen.getByLabelText('title'), ' offline');
    advance(5000);
    expect(m.save).not.toHaveBeenCalled();
    const draft = JSON.parse(m.storage.getItem('draft:doc-1') as string) as Doc;
    expect(draft).toEqual({ version: 1, fields: { ...initial.fields, title: 'Label street signs offline' } });
  });

  it('going offline cancels a pending autosave', async () => {
    const m = createSave();
    const { user } = mount(m, { autosaveMs: 500 });
    await user.type(screen.getByLabelText('title'), 'A');
    advance(400);
    dispatch('offline');
    advance(5000);
    expect(m.save).not.toHaveBeenCalled();
  });

  it('when back online flushes the draft through save, then clears it and reads "Saved"', async () => {
    const m = createSave();
    const { user } = mount(m, { autosaveMs: 500 });
    dispatch('offline');
    await user.type(screen.getByLabelText('title'), ' offline');
    dispatch('online');

    expect(m.save).toHaveBeenCalledTimes(1);
    expect(m.save).toHaveBeenCalledWith({ version: 1, fields: { ...initial.fields, title: 'Label street signs offline' } });
    expect(statusText()).toBe('Saving…');

    await settle(m.saves[0], { ok: true, version: 2 });
    expect(m.storage.getItem('draft:doc-1')).toBeNull();
    expect(statusText()).toBe('Saved');
  });

  it('coming back online with nothing edited does not save', () => {
    const m = createSave();
    mount(m);
    dispatch('offline');
    dispatch('online');
    advance(5000);
    expect(m.save).not.toHaveBeenCalled();
    expect(statusText()).toBe('Saved');
  });
});
