import { ReactElement } from 'react';

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

/** Storage key for the offline draft of a document. */
export function draftKey(docId: string): string {
  throw new Error('Not implemented');
}

/** Field names whose values differ between two field maps (union of keys, sorted). */
export function conflictingFields(mine: Record<string, string>, theirs: Record<string, string>): string[] {
  throw new Error('Not implemented');
}

/** Apply per-field resolutions; fields without a choice keep `mine`. `both` = mine + "\n" + theirs. */
export function applyResolutions(
  mine: Record<string, string>,
  theirs: Record<string, string>,
  choices: Record<string, Resolution>
): Record<string, string> {
  throw new Error('Not implemented');
}

export function ConflictEditor(props: ConflictEditorProps): ReactElement {
  throw new Error('Not implemented');
}
