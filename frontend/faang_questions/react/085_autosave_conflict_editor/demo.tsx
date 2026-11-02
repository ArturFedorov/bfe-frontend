import { useEffect, useRef, useState } from 'react';
import { ConflictEditor, Doc, SaveResult } from './conflict_editor';

/**
 * Demo harness for ConflictEditor — auto-discovered by the playground
 * (playground/App.tsx). This file is not part of the task: the spec lives in
 * README.md and the grader is conflict_editor.test.tsx.
 */

const DOC_ID = 'task-42';
const DRAFT_KEY = `draft:${DOC_ID}`;
const AUTOSAVE_MS = 1000;
const SAVE_MS = 600;

const initial: Doc = {
  version: 1,
  fields: {
    title: 'Label street signs — batch 7',
    notes: 'Box the whole sign including the post mount.',
    guidelineUrl: 'https://docs.example.com/annotation/street-signs',
  },
};

interface LogEntry {
  at: string;
  text: string;
}

function now(): string {
  return new Date().toLocaleTimeString('en-GB');
}

function readDraft(): string | null {
  try {
    return window.localStorage.getItem(DRAFT_KEY);
  } catch {
    return null;
  }
}

function prettyDraft(raw: string): string {
  try {
    return JSON.stringify(JSON.parse(raw) as unknown, null, 2);
  } catch {
    return raw;
  }
}

export default function Demo() {
  const [runKey, setRunKey] = useState(0);
  const [online, setOnline] = useState(true);
  const [log, setLog] = useState<LogEntry[]>([]);
  const [draft, setDraft] = useState<string | null>(readDraft);
  const saves = useRef(0);
  const serverVersion = useRef(initial.version);
  const forceConflict = useRef(false);
  const [forceArmed, setForceArmed] = useState(false);
  const timers = useRef(new Set<ReturnType<typeof setTimeout>>());

  const append = (text: string) =>
    setLog((entries) => [...entries.slice(-19), { at: now(), text }]);

  const schedule = (fn: () => void, ms: number) => {
    const id = setTimeout(() => {
      timers.current.delete(id);
      fn();
    }, ms);
    timers.current.add(id);
  };

  const clearTimers = () => {
    timers.current.forEach((id) => clearTimeout(id));
    timers.current.clear();
  };

  useEffect(() => clearTimers, []);

  // Mirror the offline draft the editor writes to localStorage.
  useEffect(() => {
    const id = setInterval(() => {
      const next = readDraft();
      setDraft((prev) => (prev === next ? prev : next));
    }, 400);
    return () => clearInterval(id);
  }, []);

  // Fake save: resolves after 600ms with a new version, but every third save
  // (or the next one after "Force conflict") answers with a conflict whose
  // `theirs` has `notes` changed server-side — so exactly one merge group opens.
  const save = (doc: Doc): Promise<SaveResult> =>
    new Promise((resolve) => {
      schedule(() => {
        saves.current += 1;
        const conflict = forceConflict.current || saves.current % 3 === 0;
        if (conflict) {
          forceConflict.current = false;
          setForceArmed(false);
          serverVersion.current += 1;
          const theirs: Doc = {
            version: serverVersion.current,
            fields: {
              ...doc.fields,
              notes: `${doc.fields.notes ?? ''} (QA: include the back of the sign too)`.trim(),
            },
          };
          append(`save #${saves.current} v${doc.version} → conflict, theirs v${theirs.version}`);
          resolve({ ok: false, code: 'conflict', theirs });
          return;
        }
        serverVersion.current = Math.max(serverVersion.current, doc.version) + 1;
        append(`save #${saves.current} v${doc.version} → ok v${serverVersion.current}`);
        resolve({ ok: true, version: serverVersion.current });
      }, SAVE_MS);
    });

  const goOffline = () => {
    setOnline(false);
    append('window: offline');
    window.dispatchEvent(new Event('offline'));
  };

  const goOnline = () => {
    setOnline(true);
    append('window: online');
    window.dispatchEvent(new Event('online'));
  };

  const armConflict = () => {
    forceConflict.current = true;
    setForceArmed(true);
  };

  const reset = () => {
    clearTimers();
    try {
      window.localStorage.removeItem(DRAFT_KEY);
    } catch {
      // storage unavailable — nothing to clear
    }
    saves.current = 0;
    serverVersion.current = initial.version;
    forceConflict.current = false;
    setForceArmed(false);
    setLog([]);
    setDraft(null);
    if (!online) goOnline();
    setRunKey((k) => k + 1);
  };

  return (
    <div className="demo">
      <h2>Autosave Editor with Conflict Resolution</h2>
      <p className="demo-note">
        Implement <code>ConflictEditor</code>, <code>draftKey</code>,{' '}
        <code>conflictingFields</code> and <code>applyResolutions</code> in{' '}
        <code>conflict_editor.tsx</code> — debounced (1s), serialized autosave
        with versions, a Mine/Theirs/Both merge UI, offline drafts in{' '}
        <code>localStorage</code> and a polite live-region status. The fake{' '}
        <code>save()</code> resolves after 600ms with a new version, but every
        third save returns a conflict whose <code>theirs</code> has{' '}
        <code>notes</code> edited server-side. Go offline to see the draft
        written under <code>{DRAFT_KEY}</code>; go online to flush it.
      </p>
      <div className="demo-stage">
        <div className="demo-controls">
          <button onClick={goOffline} disabled={!online}>
            Go offline
          </button>
          <button onClick={goOnline} disabled={online}>
            Go online
          </button>
          <button onClick={armConflict} disabled={forceArmed}>
            {forceArmed ? 'Conflict armed for next save' : 'Force conflict on next save'}
          </button>
          <button onClick={reset}>Reset</button>
          <span className="demo-note">
            {online ? 'network: online' : 'network: offline'} · server v{serverVersion.current}
          </span>
        </div>
        <div style={{ marginTop: '1rem' }}>
          <ConflictEditor
            key={runKey}
            docId={DOC_ID}
            initial={initial}
            save={save}
            autosaveMs={AUTOSAVE_MS}
            storage={window.localStorage}
          />
        </div>
        <p className="demo-note">
          Local draft in <code>{DRAFT_KEY}</code>:
        </p>
        <pre className="demo-note">
          {draft === null ? '— no draft —' : prettyDraft(draft)}
        </pre>
        <p className="demo-note">Save log (newest last):</p>
        <pre className="demo-note" style={{ maxHeight: '10rem', overflowY: 'auto' }}>
          {log.length === 0
            ? '— nothing yet —'
            : log.map((entry) => `${entry.at}  ${entry.text}`).join('\n')}
        </pre>
      </div>
    </div>
  );
}
