# 034. Wizard Reducer

Difficulty: Medium

Topics: useReducer, state machines, guarded transitions

## Scenario

Partner onboarding walks a new content-delivery partner through three screens:
company details, technical contacts, then a review screen before final submit.
The current implementation tracks the step as a bare number and buttons enable or
disable themselves with ad-hoc conditions — QA keeps finding ways to submit an
empty form by double-clicking through the flow. Model the wizard as an explicit
state machine inside a reducer: only legal transitions do anything, and everything
else is a documented no-op.

## Acceptance Criteria

- Steps are the union `'company' | 'contacts' | 'review' | 'submitted'`.
- Actions: `next`, `back`, `setField`, `submit` (discriminated union).
- Legal `next` transitions: `company → contacts` (requires a non-blank
  `companyName`), `contacts → review` (requires a non-blank `contactEmail`).
- Legal `back` transitions: `contacts → company`, `review → contacts`.
- **Illegal transitions are no-ops** — the reducer returns the *same state
  reference*, it never throws. (Throwing is a valid alternative design; this task
  standardizes on no-ops so a stray click can never crash the app.)
- `back` preserves everything the user already typed.
- `setField` updates `data` on any step except `submitted`.
- `submit` is guarded: it only works from `review`, and only when both
  `companyName` and `contactEmail` are non-blank. It moves the machine to
  `submitted`, which is terminal — every action is a no-op there.

## Example

```ts
let s = initialWizardState; // step: 'company'
s = wizardReducer(s, { type: 'next' }); // no-op: companyName is blank
s = wizardReducer(s, { type: 'setField', field: 'companyName', value: 'Acme CDN' });
s = wizardReducer(s, { type: 'next' }); // step: 'contacts'
s = wizardReducer(s, { type: 'back' }); // step: 'company', data preserved
```

## Target

- Pure reducer, no React needed to test it.
- Exhaustive switch over actions; transition rules readable at a glance.
- ~50 lines.

## Interviewer follow-up

- No-op vs throw for illegal transitions — when would you choose each?
- How would you add an async "validating" step between review and submitted?
- How does this reducer make the Back button trivially safe to render on every step?
