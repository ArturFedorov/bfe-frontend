# 008. Focus Shortcuts

**Difficulty:** Medium
**Topics:** useRef, Imperative Focus, Keyboard Events, Form Validation a11y

---

## Scenario

The partner access console is keyboard-first: ops grant API access dozens of
times a day and refuse to reach for the mouse. They want the shortcuts they
know from every internal tool — `/` jumps to the search box from anywhere on
the page (without typing a slash), and `Escape` clears the search and drops
focus back to the page. The grant form itself has two required fields, and on a
failed submit focus must land on the first invalid field so the fix is one
keystroke away. All of this is imperative focus work — refs, not state.

## Acceptance Criteria

- Renders a search input labeled `Search partners`, a `Partner ID` text field,
  a `Contact email` text field, and a `Grant access` submit button, all with
  programmatically associated labels.
- Pressing `/` anywhere outside a text field focuses the search input and does
  not insert a `/` character.
- Pressing `/` while typing in another text field types a literal `/` and does
  not steal focus.
- Pressing `Escape` while the search input is focused clears its value and
  blurs it.
- Submitting with an empty `Partner ID` focuses that field, marks it
  `aria-invalid="true"`, and does not call `onSubmit`.
- Submitting with a Partner ID but an invalid `Contact email` (no `@`) focuses
  the email field and marks it invalid.
- A valid submit calls `onSubmit({ partnerId, contactEmail })` exactly once and
  marks no field invalid.

## Example

```ts
<PartnerAccessForm onSubmit={({ partnerId, contactEmail }) => grantAccess(partnerId, contactEmail)} />
// user presses '/', types a query, hits Escape, tabs into the form,
// submits half-filled — focus lands on the first invalid field.
```

## Target

Focus always ends up exactly where the keyboard user needs it next — search on `/`, page on Escape, first invalid field on failed submit.

## Interviewer follow-up

Where would you attach the `/` listener in a real app with multiple routes and
modals, and how do you prevent the shortcut from firing while a dialog is open?
