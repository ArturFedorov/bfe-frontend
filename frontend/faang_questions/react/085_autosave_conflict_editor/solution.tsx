import React, { ReactElement, useEffect, useId, useRef, useState } from 'react';

export interface Doc {
  version: number;
  fields: Record<string, string>;
}

export type SaveResult = { ok: true; version: number } | { ok: false; code: 'conflict'; theirs: Doc };

export type Resolution = 'mine' | 'theirs' | 'both';

export type EditorStatus = 'Saved' | 'Saving…' | 'Offline — draft kept locally' | 'Conflict — resolve to continue';

export interface ConflictEditorProps {
  docId: string;
  initial: Doc;
  save: (doc: Doc) => Promise<SaveResult>;
  /** Debounce before an autosave. Default 1000. */
  autosaveMs?: number;
  /** Where offline drafts are kept under `draft:<docId>`. Default `window.localStorage`. */
  storage?: Storage;
}

// ---------------------------------------------------------------------------
// Pure helpers
// ---------------------------------------------------------------------------

/** Storage key for the offline draft of a document. */
export function draftKey(docId: string): string {
  return `draft:${docId}`;
}

/** Field names whose values differ between two field maps (union of keys, sorted). */
export function conflictingFields(mine: Record<string, string>, theirs: Record<string, string>): string[] {
  const keys = new Set([...Object.keys(mine), ...Object.keys(theirs)]);
  return Array.from(keys)
    .filter((key) => mine[key] !== theirs[key])
    .sort();
}

/** Apply per-field resolutions; fields without a choice keep `mine`. `both` = mine + "\n" + theirs. */
export function applyResolutions(
  mine: Record<string, string>,
  theirs: Record<string, string>,
  choices: Record<string, Resolution>
): Record<string, string> {
  const result: Record<string, string> = { ...mine };
  for (const [field, choice] of Object.entries(choices)) {
    if (choice === 'theirs') result[field] = theirs[field] ?? '';
    else if (choice === 'both') result[field] = `${mine[field] ?? ''}\n${theirs[field] ?? ''}`;
    // 'mine' keeps the local value already copied above
  }
  return result;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface Conflict {
  theirs: Doc;
  choices: Record<string, Resolution>;
}

const RESOLUTIONS: Array<{ value: Resolution; label: string }> = [
  { value: 'mine', label: 'Mine' },
  { value: 'theirs', label: 'Theirs' },
  { value: 'both', label: 'Both' },
];

/**
 * Debounced, serialized autosave editor with optimistic-concurrency conflicts.
 *
 * State model (render state + a ref twin for the async paths, so a timer or a
 * settled promise always reads the latest values rather than a stale closure):
 * - `fields`   local copy being edited (never lost on conflict)
 * - `version`  server version used by the next save
 * - `dirty`    there are edits the server has not acknowledged
 * - `saving`   exactly one save in flight (serialization)
 * - `conflict` server copy + per-field choices while the merge UI is open
 * - `online`   from window online/offline events
 * - `error`    message of the last rejected save
 * The status line is *derived*: conflict > offline > saving > saved.
 */
export function ConflictEditor({
  docId,
  initial,
  save,
  autosaveMs = 1000,
  storage,
}: ConflictEditorProps): ReactElement {
  const baseId = useId();
  const store = storage ?? (typeof window !== 'undefined' ? window.localStorage : undefined);

  const [fields, setFields] = useState<Record<string, string>>(initial.fields);
  const [saving, setSaving] = useState(false);
  const [conflict, setConflict] = useState<Conflict | null>(null);
  const [online, setOnline] = useState(() => (typeof navigator !== 'undefined' ? navigator.onLine : true));
  const [error, setError] = useState<string | null>(null);

  // Ref twins for use inside timers / promise continuations.
  const fieldsRef = useRef(fields);
  const versionRef = useRef(initial.version);
  const dirtyRef = useRef(false);
  const savingRef = useRef(false);
  const conflictRef = useRef<Conflict | null>(null);
  const onlineRef = useRef(online);
  const mountedRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = () => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const writeDraft = (nextFields: Record<string, string>) => {
    store?.setItem(draftKey(docId), JSON.stringify({ version: versionRef.current, fields: nextFields }));
  };

  /**
   * Start a save with the current fields/version. Never runs while another
   * save is in flight — the follow-up is driven by `dirty && !saving` when the
   * in-flight one settles, not by the timer that started it.
   */
  const runSave = () => {
    if (!mountedRef.current || savingRef.current) return;
    const doc: Doc = { version: versionRef.current, fields: fieldsRef.current };
    dirtyRef.current = false;
    savingRef.current = true;
    setSaving(true);
    setError(null);

    save(doc).then(
      (result) => {
        if (!mountedRef.current) return; // settled after unmount: ignore
        savingRef.current = false;
        setSaving(false);

        if (result.ok) {
          versionRef.current = result.version;
          store?.removeItem(draftKey(docId));
          // Edits queued while in flight → exactly one follow-up carrying all of them.
          if (dirtyRef.current && onlineRef.current && !conflictRef.current) runSave();
        } else {
          // Keep local edits; open the merge UI (default choice per field: Mine).
          dirtyRef.current = true;
          const next: Conflict = { theirs: result.theirs, choices: {} };
          conflictRef.current = next;
          setConflict(next);
        }
      },
      (err: unknown) => {
        if (!mountedRef.current) return;
        savingRef.current = false;
        setSaving(false);
        dirtyRef.current = true; // edits are still unsaved; retried on the next edit
        setError(err instanceof Error ? err.message : String(err));
      }
    );
  };

  /** Debounce: restart the idle timer on every edit. */
  const schedule = () => {
    clearTimer();
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      if (!onlineRef.current || conflictRef.current) return;
      if (savingRef.current) return; // picked up as a follow-up when the save settles
      if (dirtyRef.current) runSave();
    }, autosaveMs);
  };

  const onEdit = (name: string, value: string) => {
    const next = { ...fieldsRef.current, [name]: value };
    fieldsRef.current = next;
    setFields(next);
    dirtyRef.current = true;
    setError(null);

    if (!onlineRef.current) {
      writeDraft(next); // offline: keep a local draft, never call save
      return;
    }
    if (conflictRef.current) return; // autosave suspended while the merge UI is open
    schedule();
  };

  const onChoice = (field: string, choice: Resolution) => {
    setConflict((prev) => {
      if (!prev) return prev;
      const next = { ...prev, choices: { ...prev.choices, [field]: choice } };
      conflictRef.current = next;
      return next;
    });
  };

  const onResolve = () => {
    const current = conflictRef.current;
    if (!current) return;
    const merged = applyResolutions(fieldsRef.current, current.theirs.fields, current.choices);
    fieldsRef.current = merged;
    setFields(merged);
    versionRef.current = current.theirs.version;
    conflictRef.current = null;
    setConflict(null);
    dirtyRef.current = true;
    clearTimer();
    if (onlineRef.current) runSave();
    else writeDraft(merged);
  };

  // Window online/offline. Handlers go through a ref so the listener closure
  // never goes stale while the effect itself runs once.
  const handlersRef = useRef({ online: () => {}, offline: () => {} });
  handlersRef.current = {
    offline: () => {
      onlineRef.current = false;
      setOnline(false);
      clearTimer(); // nothing may fire while offline
    },
    online: () => {
      onlineRef.current = true;
      setOnline(true);
      // Flush unsaved edits immediately (no debounce); nothing to do otherwise.
      if (dirtyRef.current && !savingRef.current && !conflictRef.current) runSave();
    },
  };

  useEffect(() => {
    mountedRef.current = true;
    const onOnline = () => handlersRef.current.online();
    const onOffline = () => handlersRef.current.offline();
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      mountedRef.current = false;
      clearTimer();
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  // Derived status — precedence: conflict > offline > saving > saved.
  const status: EditorStatus = conflict
    ? 'Conflict — resolve to continue'
    : !online
      ? 'Offline — draft kept locally'
      : saving
        ? 'Saving…'
        : 'Saved';

  const differing = conflict ? conflictingFields(fields, conflict.theirs.fields) : [];

  return (
    <div>
      {Object.keys(fields).map((name) => {
        const id = `${baseId}-${name}`;
        return (
          <div key={name}>
            <label htmlFor={id}>{name}</label>
            <input id={id} type="text" value={fields[name]} onChange={(e) => onEdit(name, e.target.value)} />
          </div>
        );
      })}

      <div role="status" aria-live="polite">
        {status}
      </div>

      {error && <div role="alert">{error}</div>}

      {conflict && (
        <div>
          {differing.map((field) => {
            const choice = conflict.choices[field] ?? 'mine';
            return (
              <fieldset key={field} role="group" aria-label={`Conflict: ${field}`}>
                <legend>Conflict: {field}</legend>
                <p>
                  Mine: <q>{fields[field] ?? ''}</q> — Theirs: <q>{conflict.theirs.fields[field] ?? ''}</q>
                </p>
                {RESOLUTIONS.map(({ value, label }) => (
                  <label key={value}>
                    <input
                      type="radio"
                      name={`${baseId}-conflict-${field}`}
                      value={value}
                      checked={choice === value}
                      onChange={() => onChoice(field, value)}
                    />
                    {label}
                  </label>
                ))}
              </fieldset>
            );
          })}
          <button type="button" onClick={onResolve}>
            Resolve
          </button>
        </div>
      )}
    </div>
  );
}
