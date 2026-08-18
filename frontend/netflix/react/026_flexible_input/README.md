# 026. Flexible Input

**Difficulty:** Medium
**Topics:** Controlled vs Uncontrolled, Component API Design, Dev Warnings

---

## Scenario

The design-system team ships a shared `FlexibleInput` used across the partner
portal. Some screens own the value themselves (a filter bar that syncs to the
URL) and pass `value` + `onChange`; simple forms just want `defaultValue` and
read the value on submit. The component must support both modes with one prop
API — exactly like React's own `<input>` — and, like React, it must warn loudly
in the console when a caller switches modes mid-lifetime, because that bug
(passing `value={maybeUndefined}`) silently breaks inputs in production.

## Acceptance Criteria

- Renders an `<input>` associated with a visible `<label>` via `htmlFor`/`id`
  so it is queryable by its accessible name (the `label` prop).
- **Controlled mode** (when `value !== undefined`): the input always displays
  the `value` prop. Typing calls `onChange` with the would-be string, but the
  displayed value does not change until the parent passes a new `value`.
- **Uncontrolled mode** (when `value === undefined`): the input initializes
  from `defaultValue` (empty string if omitted), manages its own state, updates
  as the user types, and still calls `onChange` with each new value.
- Mode is detected from the first render. If a later render switches modes
  (controlled → uncontrolled or vice versa), call `console.warn` once with a
  message that names both modes, e.g.
  `FlexibleInput is changing from uncontrolled to controlled. Decide between controlled and uncontrolled for the lifetime of the component.`
  Warn at most once per component instance.
- `onChange` receives the plain string value, not the event.

## Example

```tsx
// Controlled — filter bar owns the value
<FlexibleInput label="Partner ID" value={query} onChange={setQuery} />

// Uncontrolled — form reads on submit
<FlexibleInput label="Partner ID" defaultValue="pk-104" onChange={track} />
```

## Target

- `FlexibleInput(props: FlexibleInputProps): ReactElement`
- `FlexibleInputProps`: `{ label: string; value?: string; defaultValue?: string; onChange?: (value: string) => void }`

## Interviewer follow-up

React itself warns on mode switching for native inputs. Why is switching modes
mid-lifetime actually broken (what state gets lost / whose value wins), and why
detect the mode from the *first* render instead of per-render?
