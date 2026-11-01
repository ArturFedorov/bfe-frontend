# 085. Autosave Editor with Conflict Resolution

**Difficulty:** Very Hard
**Estimated time:** 60 min
**Topics:** Debounced Autosave, Optimistic Concurrency (versions), Request Serialization, Field-Level Merge UI, Offline Drafts, Live-Region Status

---

## Scenario

Annotators on the ML data-annotation platform edit task metadata (title, notes,
guideline links) that QA analysts often touch at the same time. The server protects each
document with a `version` and answers a stale write with a **conflict** carrying the
current server copy. The first editor fired a save on every keystroke, let two saves race
so the older one won, dropped the annotator's edits on conflict, and silently lost work
when the Wi-Fi dropped in the labelling booth. Build `ConflictEditor`: debounced,
serialized autosave with versions, a field-level Mine/Theirs/Both merge UI, offline drafts
in a `Storage`, and a status line announced through a live region.

## Requirements

1. Render one `<input type="text">` per key in `initial.fields`, labelled by the field name
   (`<label for>`), prefilled with its value. No field is ever disabled.
2. Status: a single element with `role="status"` and `aria-live="polite"` whose text is
   exactly one of `Saved`, `Saving…`, `Offline — draft kept locally`,
   `Conflict — resolve to continue` (precedence: conflict > offline > saving > saved).
3. Autosave: after an edit, wait `autosaveMs` (default 1000) of inactivity (debounce, not
   throttle) then call `save({ version, fields })` with the current version and all fields.
   A successful result sets `version` to `result.version`, used by every later save.
4. Serialization: never two concurrent saves. Edits made while a save is in flight are
   queued and produce exactly **one** follow-up save (after the in-flight one settles)
   containing every queued edit. No follow-up when nothing changed meanwhile.
5. Conflict: when `save` resolves `{ ok: false, code: 'conflict', theirs }`, keep the local
   fields and open a merge UI: for each field whose value differs between mine and
   `theirs.fields`, a `role="group"` named `Conflict: <field>` with radios `Mine`,
   `Theirs`, `Both` (`Both` = mine + `"\n"` + theirs; default `Mine`). Fields that do not
   differ get no group. A `Resolve` button applies the choices to the fields and
   immediately saves `{ version: theirs.version, fields }`. Autosave is suspended while the
   conflict is open; other fields stay editable and their edits are included in the
   resolve save.
6. Offline: listen to `window` `offline`/`online`. While offline do not call `save` (cancel
   any pending debounce) and, on every edit, write `JSON.stringify({ version, fields })` to
   `storage` under `draft:<docId>`. On `online`, if there are unsaved edits, flush them
   through `save` immediately (no debounce); a successful save removes the draft. Nothing
   is saved when coming back online without edits.
7. Rejected `save` (network error): show the message in `role="alert"`, keep the edits and
   mark them unsaved, do **not** retry automatically; the next edit clears the alert and
   schedules a normal autosave carrying all unsaved edits.
8. Export the pure helpers `draftKey(docId)`, `conflictingFields(mine, theirs)` (sorted
   union of keys whose values differ) and `applyResolutions(mine, theirs, choices)` and use
   them in the component.
9. Cleanup: pending debounce cancelled on unmount; results arriving after unmount are
   ignored; window listeners removed.

## Acceptance Criteria

- [ ] One labelled, prefilled text input per field; status `Saved` initially.
- [ ] `status` has `aria-live="polite"`.
- [ ] Save fires once after `autosaveMs` (default 1000) idle with `{ version, fields }`.
- [ ] `Saving…` while in flight, `Saved` after; next save uses the returned version.
- [ ] Two edits during an in-flight save → exactly one follow-up with both edits; none when
      nothing changed.
- [ ] Conflict shows a group per differing field only, with Mine/Theirs/Both radios and a
      `Resolve` button; status reads `Conflict — resolve to continue`.
- [ ] Resolve with Theirs / Both produces the expected field values and saves with
      `theirs.version`; the conflict UI closes.
- [ ] While in conflict, autosave is suspended and other fields remain editable; their
      edits are in the resolve save.
- [ ] Offline: no save, offline status, draft under `draft:<docId>`; going offline cancels a
      pending autosave; online flushes immediately and clears the draft.
- [ ] Rejected save → alert, no retry loop, retried on the next edit.
- [ ] Unmount cancels the pending autosave.

## Baseline a11y

- Every input has a programmatic label; the status is a polite live region so screen-reader
  users hear `Saving…`/`Saved`/offline/conflict transitions without focus moves.
- Conflict groups are `role="group"` with a name that includes the field; radios are native
  and labelled `Mine`/`Theirs`/`Both`.
- Failures use `role="alert"`; the `Resolve` control is a real button.

## Constraints

- No third-party libraries. `save`, `storage` and the `offline`/`online` events are the only
  boundaries — no `fetch`, no direct `localStorage` access when `storage` is provided.
- Never run two saves concurrently; never lose a local edit on conflict.

## Interviewer follow-ups (talk-through, not implemented)

- Restore an offline draft on mount (same `docId`) when the server copy is older/newer:
  how do you detect which wins and how is that explained to the annotator?
- Character-level merge for long `notes` instead of whole-field Mine/Theirs/Both — when is
  a 3-way diff worth it and what is the base version?
- Multiple tabs editing the same `docId`: `storage` events, a `BroadcastChannel`, or a
  leader tab that owns the saves?
- Backpressure: the server throttles saves to one per 5s per document. Where does the
  debounce become a token bucket, and what does the status show meanwhile?

## Say out loud

- State shape first: `fields`, `version`, `dirty`, `saving`, `conflict: null | { theirs,
  choices }`, `online`, `failed`; status is **derived**, not stored.
- Race/cleanup hazard: a save result landing after unmount, or after a newer edit — the
  follow-up must be driven by "dirty && !saving", not by the timer that started the save.
- Data-shape question: can `theirs.fields` contain keys mine does not have (field added
  server-side), and is `version` monotonic per document?
- Failure-handling question: on a rejected save, should we retry with backoff or wait for
  the next edit — and how does the annotator know their work is unsaved?
- First test you'd write: typing then waiting `autosaveMs` calls `save` once with
  `{ version: 1, fields }`.
