# 040. Render Counter Lab

Difficulty: Easy
Topics: re-render rules, React.memo, children-as-prop, element identity

## Scenario

Your team keeps arguing about "why did this component re-render" during a slow-dashboard postmortem. Before touching any real code, you build a tiny instrumented tree to settle the rules once and for all.

This task ships **complete** — you do not write or fix any code. The work is:

1. Read `render_counter_lab.tsx` (do NOT run the tests yet).
2. Predict every render count asked for below and write your prediction in the blanks.
3. Run `npx jest frontend/netflix/react/040_render_counter_lab` and compare.
4. For every count you got wrong, write the explanation until you can defend it out loud.

The tree:

```
RenderCounterLab (state: count)
├── Title                      plain component, no meaningful props
├── MemoTitle                  same, but wrapped in React.memo
└── Panel (state: open)        receives <Stable /> via children
    ├── {children}  → Stable   element created in RenderCounterLab's render
    └── Leaf                   element created in Panel's render
```

### Render-count convention (used in every Topic 6 task)

Every component accepts an optional probe prop:

```tsx
onRender?: (id: string) => void;
```

and calls it unconditionally at the top of its function body. Tests pass a single `jest.fn()` down the tree and count calls per id — that count IS the render count.

## Acceptance Criteria

- All three tests pass unmodified (they do — the lab ships green).
- You filled in every blank in the Answers section BEFORE running the tests.
- For each of the six components you can explain, in one sentence, why its count is what it is after each interaction.

## Example

```tsx
const probe = jest.fn();
render(<RenderCounterLab onRender={probe} />);
probe.mockClear();
await user.click(screen.getByRole('button', { name: /toggle panel/i }));
// how many times was probe called with 'stable'? with 'leaf'?
```

## Target

Zero code changes. The budget here is intellectual: 6/6 correct predictions for each of the three phases (mount, app-state click, panel-state click), and a written explanation for each.

## Answers (fill in BEFORE running the tests)

Phase 1 — mount. Render count of every component: ____

Phase 2 — click "Increment app" once (counts cleared after mount):

- `app`: ____  because ________________________________________
- `title`: ____  because ________________________________________
- `memo-title`: ____  because ________________________________________
- `panel`: ____  because ________________________________________
- `stable`: ____  because ________________________________________
- `leaf`: ____  because ________________________________________

Phase 3 — click "Toggle panel" once (counts cleared after mount):

- `app`: ____  because ________________________________________
- `title`: ____  because ________________________________________
- `memo-title`: ____  because ________________________________________
- `panel`: ____  because ________________________________________
- `stable`: ____  because ________________________________________
- `leaf`: ____  because ________________________________________

Key rules you should have extracted by the end:

1. A component re-renders when ________________________________ (hint: it is not "when its props change").
2. `React.memo` skips the re-render when ________________________________.
3. An element received via `children` does not re-render when the *receiving* component's own state changes, because ________________________________.
4. The same `children` element DOES re-render when the *creating* component re-renders, because ________________________________.

## Interviewer follow-up

- Why does `MemoTitle` stay memoized even though it receives `onRender` — under what change to the test code would it start re-rendering every time?
- The children-as-prop trick made `Stable` skip Panel's re-render without `React.memo`. What exactly does React compare to decide it can bail out?
- If `Panel` were wrapped in `React.memo`, would clicking "Increment app" still re-render it? Why?
- Does a re-render mean the DOM was touched? What actually happens between "component function ran" and "browser painted"?
