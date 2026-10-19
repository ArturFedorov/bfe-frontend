import type { ReactElement } from 'react';

export type FieldSchema =
  | {
      kind: 'text';
      name: string;
      label: string;
      required?: boolean;
      pattern?: RegExp;
      patternMessage?: string;
    }
  | {
      kind: 'number';
      name: string;
      label: string;
      required?: boolean;
      min?: number;
      max?: number;
    }
  | {
      kind: 'select';
      name: string;
      label: string;
      required?: boolean;
      options: string[];
    }
  | { kind: 'checkbox'; name: string; label: string };

export type TaskValues = Record<string, string | number | boolean | undefined>;

export interface TaskEditorProps {
  schema: FieldSchema[];
  initialValues: TaskValues;
  onSave: (values: TaskValues) => Promise<void>;
  /** Called with the current values after `autosaveMs` of inactivity while dirty. */
  onDraft?: (values: TaskValues) => void;
  autosaveMs?: number; // default 1500
}

export function TaskEditor({
  schema,
  initialValues,
  onSave,
  onDraft,
  autosaveMs = 1500,
}: TaskEditorProps): ReactElement {
  // TODO: implement
  throw new Error('Not implemented');
}
