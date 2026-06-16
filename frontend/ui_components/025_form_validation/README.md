# 25. Form with Validation

**Difficulty:** Medium
**Topics:** Field validation, dependent fields, ARIA live regions

---

## Description

Build a form with per-field validation rules. Fields validate on blur (and on submit), errors are announced through `aria-live`, and submit is blocked while any field is invalid. Some fields can depend on others (e.g. "confirm password" must match "password").

## Requirements

- Define a schema mapping field name → array of validators (`(value, allValues) => string | null`)
- Render the form's existing inputs (component is given the form element with named inputs)
- Validate on `blur` of each field; show the first error in a sibling `[data-error-for="<name>"]` node
- Validate on submit; block submission if any field has an error
- Each error node has `aria-live="polite"` so screen readers announce changes
- `getValues()` returns current field values
- `getErrors()` returns current errors per field
- `validate()` runs all validators and returns whether the form is valid
- `onSubmit(values)` fires only when the form is valid
- `destroy()` removes listeners

## Examples

```ts
const form = createValidatedForm({
  form: document.querySelector('form')!,
  schema: {
    email: [(v) => (v.includes('@') ? null : 'Invalid email')],
    password: [(v) => (v.length >= 8 ? null : 'Min 8 chars')],
    confirm: [
      (v, all) => (v === all.password ? null : 'Passwords must match'),
    ],
  },
  onSubmit: (values) => console.log(values),
});

form.validate(); // true | false
```

## Approach Hints

<details>
<summary>Hint 1</summary>
Walk <code>form.elements</code> to read field values keyed by <code>name</code>. Keeps the component agnostic of which inputs are present in the markup.
</details>

<details>
<summary>Hint 2</summary>
Run validators in order and stop at the first one that returns a non-null string — that's the field's current error. <code>null</code> from every validator means the field is valid.
</details>

<details>
<summary>Hint 3</summary>
Dependent fields (like confirm-password) need <em>their</em> validator re-run when the field they depend on changes. Easiest approach: on every blur, validate <em>all</em> fields, not just the one that blurred.
</details>

---

## React Implementation Task

A runnable React playground is wired up for this component. Implement it
alongside the vanilla version above.

- **Component to implement:** [`react/FormValidation.tsx`](./react/FormValidation.tsx) — currently a placeholder.
- **Demo harness:** [`react/App.tsx`](./react/App.tsx) — renders the component; adjust the sample props as you go.

### Run it

From `frontend/ui_components/`:

```bash
npm install   # first time only
npm run dev
```

Then open the dev server and pick **Form with Validation** from the sidebar.

### Goal

Re-implement the component in **idiomatic React** so it meets the same
requirements described above. Edit `react/FormValidation.tsx`; keep its exported props
stable so the harness keeps working.

