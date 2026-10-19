# 072. Annotation Task Editor

**Difficulty:** Medium
**Topics:** Schema-Driven Forms, Validation, Dirty Tracking, Debounced Autosave, Unsaved-Changes Guard

---

## Scenario

On the ML data-annotation platform, engineers define annotation task templates
per vertical — a speech task has different fields from a photo-labelling task —
so the task editor cannot hard-code its form: it must render from a field
schema. The first version validated on every keystroke (an error appeared the
moment you typed the first character of a URL), left Save enabled when nothing
had changed, lost half-written drafts on tab close, and wiped the whole form
when the save request failed. Build `TaskEditor`: a schema-driven form with
blur-first validation, dirty tracking, debounced draft autosave, and an
unsaved-changes guard.

## Acceptance Criteria

- Renders one labelled control per schema entry, reachable via its `label`:
  `text` → `<input type="text">`, `number` → `<input type="number">`
  (spinbutton), `select` → native `<select>` (combobox) with one option per
  entry in `options`, `checkbox` → `<input type="checkbox">`. Controls are
  prefilled from `initialValues`.
- Validation runs on **blur, not on keystroke**: typing an invalid value shows
  no error until the field is blurred. After blur the control has
  `aria-invalid="true"` and `aria-describedby` pointing at an element that
  contains the message. Messages: required → `<Label> is required`;
  `pattern` → `patternMessage`; number outside `min`/`max` →
  `Must be between <min> and <max>`. Checkboxes never produce errors.
- Once a field has been blurred (touched), subsequent typing re-validates it
  live: the error (and the aria attributes) clear as soon as the value is
  valid.
- The `Save` button is disabled when the form is not dirty or when **any**
  field has a validation error (shown or not). It is enabled when dirty and
  valid. Reverting a field to its initial value makes the form not dirty
  again — compare against the baseline, do not count edits.
- Submitting calls `onSave` once with the current values. While pending the
  button reads `Saving…` and is disabled; fields keep their values. On
  resolve: render `Saved` inside `role="status"` and reset the baseline to
  the saved values (the form is no longer dirty). On reject: render the
  error's message inside `role="alert"`, keep every value, re-enable Save.
- Autosave: while dirty, `onDraft(values)` fires once after `autosaveMs`
  (default 1500) with no further changes — a debounce, not a throttle. It
  never fires when the form is not dirty (pristine, or reverted before the
  deadline), and a pending timer is cancelled on unmount.
- Unsaved-changes guard: a `beforeunload` listener that calls
  `preventDefault()` is registered on `window` only while dirty, and removed
  when the form becomes pristine (revert or successful save) or unmounts.

## Example

```tsx
<TaskEditor
  schema={[
    { kind: 'text', name: 'name', label: 'Task name', required: true },
    { kind: 'number', name: 'batch', label: 'Items per batch', min: 1, max: 500 },
    { kind: 'select', name: 'vertical', label: 'Vertical', required: true, options: ['Siri', 'Photos', 'Maps'] },
  ]}
  initialValues={{ name: 'Label street signs', batch: 50, vertical: 'Maps' }}
  onSave={(values) => api.saveTask(taskId, values)}
  onDraft={(values) => localStorage.setItem(`draft:${taskId}`, JSON.stringify(values))}
  autosaveMs={1500}
/>
// type "900" into Items per batch → no error yet → blur → "Must be between 1 and 500"
// Save disabled (invalid) → fix to "200" → error clears live, Save enabled
// 1.5s idle → onDraft({ …, batch: 200 }) → click Save → "Saving…" → "Saved"
```

## Target

40–50 minutes. Senior signals: errors derived from `values` in one pure
`validate(schema, values)` pass with a separate `touched` map deciding what is
*shown*; dirtiness computed against a baseline that moves on successful save;
the autosave as a single effect whose cleanup is the debounce; the
`beforeunload` effect keyed on `dirty` so the listener exists only when it
should.

## Interviewer follow-up

Two engineers open the same task. The second one saves after the first, and
the server rejects with `409 Version conflict` because the task's version (or
ETag) moved. How would you design the optimistic-concurrency UX — showing
what changed upstream, offering reload vs. overwrite, preserving the local
edits — and how would you carry the version through `onSave`? Second: the
same `FieldSchema` describes the rules the server must enforce. How would you
make the schema the single source of truth for both client and server
validation without shipping React code to the backend?
