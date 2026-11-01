import { useRef, useState } from 'react';
import { TaskEditor, FieldSchema, TaskValues } from './annotation_task_editor';

/**
 * Demo harness for TaskEditor — auto-discovered by the playground
 * (playground/App.tsx). This file is not part of the task: the spec lives in
 * README.md and the grader is annotation_task_editor.test.tsx.
 */

const schema: FieldSchema[] = [
  { kind: 'text', name: 'name', label: 'Task name', required: true },
  {
    kind: 'text',
    name: 'instructionsUrl',
    label: 'Instructions URL',
    pattern: /^https:\/\//,
    patternMessage: 'Must start with https://',
  },
  { kind: 'number', name: 'itemsPerBatch', label: 'Items per batch', min: 1, max: 500 },
  { kind: 'select', name: 'vertical', label: 'Vertical', required: true, options: ['Siri', 'Photos', 'Maps'] },
  { kind: 'checkbox', name: 'expertReview', label: 'Requires expert review' },
];

const initialValues: TaskValues = {
  name: 'Label street signs',
  instructionsUrl: 'https://docs.example.com/annotation/street-signs',
  itemsPerBatch: 50,
  vertical: 'Maps',
  expertReview: false,
};

export default function Demo() {
  // Mock task API: every save takes 800ms; every third save is rejected with
  // a version conflict to exercise the error path.
  const saves = useRef(0);
  const [draftAt, setDraftAt] = useState<string | null>(null);
  const [lastSaved, setLastSaved] = useState<TaskValues | null>(null);

  const onSave = (values: TaskValues): Promise<void> =>
    new Promise((resolve, reject) => {
      setTimeout(() => {
        saves.current += 1;
        if (saves.current % 3 === 0) {
          reject(new Error('Version conflict'));
        } else {
          setLastSaved(values);
          resolve();
        }
      }, 800);
    });

  const onDraft = () => {
    setDraftAt(new Date().toLocaleTimeString('en-GB'));
  };

  return (
    <div className="demo">
      <h2>Annotation Task Editor</h2>
      <p className="demo-note">
        Implement <code>TaskEditor</code> in{' '}
        <code>annotation_task_editor.tsx</code> — a schema-driven form with
        blur-first validation, dirty tracking, debounced autosave (1.5s) and a
        beforeunload guard. The mock API resolves after 800ms and rejects every
        third save with &quot;Version conflict&quot; to show the error path.
      </p>
      <div className="demo-stage">
        <TaskEditor
          schema={schema}
          initialValues={initialValues}
          onSave={onSave}
          onDraft={onDraft}
          autosaveMs={1500}
        />
        <p className="demo-note">
          {draftAt ? `Draft saved at ${draftAt}` : 'No draft yet'}
        </p>
        {lastSaved && (
          <pre className="demo-note">{JSON.stringify(lastSaved, null, 2)}</pre>
        )}
      </div>
    </div>
  );
}
