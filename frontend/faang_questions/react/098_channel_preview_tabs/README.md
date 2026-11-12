# 098. Channel Preview Tabs

**Difficulty:** Medium
**Estimated time:** 45 min
**Topics:** Compound components, WAI-ARIA tabs pattern, roving tabindex, controlled vs uncontrolled, design tokens, `cx` helper

---

## Scenario

Marketing ops staff author one campaign message and preview it per channel:
email (600px wide), push notification (360px) and in-app card (320px). The
first preview switcher was three `<div onClick>`s — no roles, every "tab" was
a tab stop, arrow keys did nothing and the hidden previews stayed in the
accessibility tree, so screen-reader users heard all three messages at once.
Design also wants the widths and spacing to come from one `tokens.ts` file
instead of magic numbers sprinkled over the component.

Build a compound `<ChannelTabs>` that follows the WAI-ARIA tabs pattern with
automatic activation, works both controlled and uncontrolled, and renders each
panel inside a channel-sized preview frame driven by tokens.

## Contract

```tsx
// tokens.ts
export const space    // spacing scale in px, e.g. space[2] === 8
export const radius   // radius scale in px
export const color    // named colors
export const channelWidth = { email: 600, push: 360, 'in-app': 320 }
export type Channel = keyof typeof channelWidth

cx(...parts: Array<string | false | null | undefined | Record<string, boolean>>): string
// concatenates truthy strings and the keys of objects whose value is true,
// separated by single spaces; exact duplicates appear once (first position wins);
// returns '' when nothing is truthy

// channel_tabs.tsx
<ChannelTabs label="Channel preview" value? defaultValue? onChange?>
  <ChannelTabs.List>
    <ChannelTabs.Tab value="email">Email</ChannelTabs.Tab>
    <ChannelTabs.Tab value="push">Push</ChannelTabs.Tab>
  </ChannelTabs.List>
  <ChannelTabs.Panel value="email" channel="email">…</ChannelTabs.Panel>
  <ChannelTabs.Panel value="push" channel="push">…</ChannelTabs.Panel>
</ChannelTabs>
```

### DOM shape (the tests query exactly this)

- `List` renders `role="tablist"` with `aria-label` equal to the root `label`.
- `Tab` renders a `<button role="tab">` with `aria-selected`, an `id`, and
  `aria-controls` pointing at the matching panel's `id`. Only the active tab has
  `tabIndex={0}`; every other tab has `tabIndex={-1}` (roving tabindex).
- `Panel` renders `role="tabpanel"` with `aria-labelledby` = its tab's `id` and
  the `hidden` attribute when inactive. Inside it renders a preview frame
  `<div data-channel="<channel>">` whose inline `width` is
  `channelWidth[channel]` px.
- Ids come from `useId()`; the tests only check that the references match.

## Requirements

1. **Roles and wiring.** `tablist` / `tab` / `tabpanel` roles, `aria-label`
   from `label`, `aria-selected` on tabs, `aria-controls` ↔ `id` ↔
   `aria-labelledby` wired per `value`.
2. **Roving tabindex.** Exactly one tab is tabbable (the active one).
3. **Keyboard, automatic activation.** With focus on a tab: `ArrowRight` /
   `ArrowLeft` move focus to the next / previous tab **and** activate it,
   wrapping at both ends; `Home` / `End` focus and activate the first / last
   tab. `preventDefault` on handled keys. Click activates too.
4. **Panels.** The active panel is visible, all others carry `hidden`. Each
   panel wraps its children in the preview frame with `data-channel` and the
   token width. A `Tab` whose `value` has no `Panel` renders no `tabpanel`
   when selected (nothing extra appears).
5. **Uncontrolled.** With `defaultValue`, that tab starts active; without
   `value` or `defaultValue`, the first `Tab` is active. Selection is internal
   and `onChange(value)` fires on every change.
6. **Controlled.** With `value`, the component never changes selection on its
   own: clicks and keys only call `onChange(next)`; the UI follows the prop.
7. **Tokens.** `tokens.ts` exports the scales, `channelWidth`, and `cx`. The
   component uses `cx` for its class names and `channelWidth` for the frame.

## Acceptance Criteria

- [ ] `cx` joins truthy strings, skips `false`/`null`/`undefined`, includes
      object keys with `true` values, dedupes exact duplicates, returns `''`
      for no input.
- [ ] `tablist` has `aria-label="Channel preview"`; three `tab`s; the active
      one has `aria-selected="true"`, the others `"false"`.
- [ ] `aria-controls` of each tab equals the `id` of its panel; each panel's
      `aria-labelledby` equals its tab's `id`.
- [ ] Only the active tab has `tabindex="0"`.
- [ ] `ArrowRight` moves focus to the next tab, selects it and shows its panel;
      `ArrowLeft` goes back; `Home` / `End` jump.
- [ ] Senior: `ArrowRight` on the last tab wraps to the first; `ArrowLeft` on
      the first wraps to the last.
- [ ] Inactive panels have the `hidden` attribute; the active panel does not.
- [ ] The preview frame has `data-channel` and `width: 600px / 360px / 320px`.
- [ ] A tab without a panel renders no `tabpanel` when active.
- [ ] Uncontrolled: `defaultValue="push"` starts on Push; no default → first
      tab; clicking calls `onChange` with the value and switches.
- [ ] Senior: controlled with `value="email"` and a spy `onChange`: clicking
      Push calls `onChange('push')` but Email stays selected and the Push
      panel stays hidden; when the parent updates `value`, the UI follows.

## Baseline a11y

- WAI-ARIA tabs pattern: `tablist` (labelled), `tab` (`aria-selected`,
  `aria-controls`), `tabpanel` (`aria-labelledby`, `hidden` when inactive).
- Roving tabindex — one tab stop for the whole list; arrows move within.
- Tabs are real `<button>`s so Enter/Space work natively.

## Constraints

- React only. No headless-UI libraries.
- Compound API via context; do not require consumers to pass index props.
- Do not use `display: none` via inline style for inactive panels — use the
  `hidden` attribute.
- Do not modify `_helpers/`.

## Interviewer follow-ups (talk-through only)

- Manual vs automatic activation: when would you switch to Enter/Space
  activation, and what changes in the key handler?
- Panels are mounted and hidden. When would you unmount inactive panels
  instead, and how does that interact with iframe-based email previews?
- The tablist should become a `<select>` under 480px. Where does that
  decision live without duplicating the state logic?
- How would you make `cx` handle Tailwind-style conflicts (`p-2` vs `p-4`)
  and why is that a different, harder problem?

## Say out loud

- State shape first: `active: string | null` (internal, ignored when
  `value` is provided); tabs discover their position from the DOM order in
  the list at keydown time, so no registration array is needed.
- Name the hazard: automatic activation + controlled mode — the arrow handler
  must move focus even if the parent rejects the change, or focus gets stuck.
- Ask one data-shape question: can two tabs share a `value`? (Decide: no;
  ids would collide.)
- Ask one failure-handling question: what should happen when `value` points at
  a tab that does not exist — show nothing, or fall back to the first tab?
- Name the first test you would write: "ArrowRight from the last tab wraps to
  the first and shows its panel".
