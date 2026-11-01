# 025. Layout Slots

**Difficulty:** Very Easy
**Topics:** Composition, Slot Props, Landmark Roles

---

## Scenario

Every page in the partner portal repeats the same card chrome: a title bar, a
cluster of action buttons on the right, the actual content, and an optional
footer with metadata ("Last synced 2m ago"). Teams keep copy-pasting the markup
and each copy drifts — different heading levels, missing labels, buttons
outside the toolbar. Build a `PageCard` that owns the chrome once and accepts
the varying parts as slots: `title`, `actions`, `footer` props plus `children`
for the main content. Composition over configuration — callers pass React
nodes, not config objects.

## Acceptance Criteria

- `PageCard` renders a `<section>` whose accessible name is the `title`; when
  no `title` is given it falls back to the accessible name `Card` (the section
  must always be reachable as a `region` landmark).
- `title` renders as a heading (`<h2>`) inside the card.
- `actions` render inside a container with `role="toolbar"` and an accessible
  name of `Card actions` — omit the toolbar from the DOM entirely when no
  actions are passed.
- `children` always render in the main content area, between the header and
  the footer.
- `footer` renders inside a container with `role="group"` and accessible name
  `Card footer`, positioned after the main content — omitted from the DOM when
  no footer is passed.
- No slot is required: `<PageCard>hello</PageCard>` renders a valid, labelled
  card with just the content.

## Example

```tsx
<PageCard
  title="Delivery summary"
  actions={<button>Retry sync</button>}
  footer={<span>Last synced 2m ago</span>}
>
  <p>All 14 assets delivered.</p>
</PageCard>
```

## Target

- `PageCard(props: PageCardProps): ReactElement`
- `PageCardProps`: `{ title?: string; actions?: ReactNode; footer?: ReactNode; children: ReactNode }`

## Interviewer follow-up

Why slots (`ReactNode` props) instead of a config API like
`actions={[{ label, onClick }]}`? What does the config version make impossible,
and when would you prefer it anyway?
