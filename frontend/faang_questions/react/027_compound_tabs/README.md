# 027. Compound Tabs

**Difficulty:** Medium
**Topics:** Compound Components, Context, Roving Tabindex, ARIA Tabs Pattern

---

## Scenario

The partner detail page splits into Overview / Deliveries / Settings. The
current implementation is one 400-line component with `activeTab === 2`
scattered everywhere; adding a tab means editing five switch statements. Build
compound components — `<Tabs>` owning the state via context, `<TabList>`,
`<Tab>`, and `<TabPanel>` composing freely inside it — so a new tab is just two
new JSX children. Screen-reader and keyboard users file most of the a11y
tickets on this page, so the WAI-ARIA tabs pattern is part of the contract,
not a stretch goal.

## Acceptance Criteria

- `Tabs` accepts `defaultValue` (the initially selected tab's value) and shares
  state with descendants via context — no prop drilling through `TabList`.
- `TabList` renders `role="tablist"` with an accessible name from its `label`
  prop.
- Each `Tab` renders a `role="tab"` button with `aria-selected` (`true` only on
  the active tab) and `aria-controls` pointing at its panel's id.
- Roving tabindex: the active tab has `tabIndex=0`, all others `tabIndex=-1`,
  so the tab list occupies a single Tab stop.
- ArrowRight moves focus and selection to the next tab, ArrowLeft to the
  previous, both wrapping at the ends (automatic activation).
- Clicking a tab selects it.
- `TabPanel` renders `role="tabpanel"` labelled by its tab
  (`aria-labelledby`); only the active panel's content is in the document —
  inactive panels render nothing.
- Using `Tab` or `TabPanel` outside `<Tabs>` throws an error naming the fix,
  e.g. `Tab must be used within <Tabs>`.

## Example

```tsx
<Tabs defaultValue="overview">
  <TabList label="Partner sections">
    <Tab value="overview">Overview</Tab>
    <Tab value="deliveries">Deliveries</Tab>
  </TabList>
  <TabPanel value="overview">Overview content</TabPanel>
  <TabPanel value="deliveries">Deliveries content</TabPanel>
</Tabs>
```

## Target

- `Tabs(props: { defaultValue: string; children: ReactNode }): ReactElement`
- `TabList(props: { label: string; children: ReactNode }): ReactElement`
- `Tab(props: { value: string; children: ReactNode }): ReactElement`
- `TabPanel(props: { value: string; children: ReactNode }): ReactElement`

## Interviewer follow-up

You chose automatic activation (arrow moves focus *and* selects). When would
you switch to manual activation (arrow moves focus, Enter/Space selects), and
what does the WAI-ARIA Authoring Practices guide say drives that choice?
