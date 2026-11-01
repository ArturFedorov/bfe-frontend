# 028. Accordion Group

**Difficulty:** Medium
**Topics:** Compound Components, Controlled/Uncontrolled, ARIA Disclosure

---

## Scenario

The integration troubleshooting page stacks collapsible sections — Credentials,
Webhooks, Delivery history. Support engineers want "open one at a time" so the
page stays scannable (single mode), but the audit view needs several open at
once for comparison (multiple mode). One screen also drives the open sections
from the URL (`?open=webhooks`), so the component must work controlled as well
as uncontrolled. Build `Accordion` + `AccordionItem` covering all four
combinations.

## Acceptance Criteria

- `Accordion` accepts `mode: 'single' | 'multiple'` (default `'single'`).
- Each `AccordionItem` has an `id` and `title`; the header renders as a
  `<button>` inside a heading (`<h3>`), so it is keyboard-operable for free.
- The header button carries `aria-expanded` reflecting its item's state and
  `aria-controls` pointing at the panel.
- The panel renders with `role="region"` labelled by its header button
  (`aria-labelledby`); a collapsed item's panel content is not in the document.
- **Single mode:** expanding an item collapses any other open item; clicking an
  open item's header collapses it (zero open is allowed).
- **Multiple mode:** items expand and collapse independently.
- **Uncontrolled:** `defaultExpanded?: string[]` seeds the state (default
  `[]`); the accordion manages itself afterwards.
- **Controlled:** when `expanded: string[]` is passed, the open set follows the
  prop exactly; user toggles do not change the display by themselves but call
  `onExpandedChange` with the would-be next array.
- `onExpandedChange` also fires in uncontrolled mode, after the internal update.
- `AccordionItem` outside an `Accordion` throws
  `AccordionItem must be used within <Accordion>`.

## Example

```tsx
<Accordion mode="single" defaultExpanded={['credentials']}>
  <AccordionItem id="credentials" title="Credentials">
    <p>API key rotated 3d ago.</p>
  </AccordionItem>
  <AccordionItem id="webhooks" title="Webhooks">
    <p>2 endpoints failing.</p>
  </AccordionItem>
</Accordion>
```

## Target

- `Accordion(props: AccordionProps): ReactElement`
- `AccordionProps`: `{ mode?: 'single' | 'multiple'; expanded?: string[]; defaultExpanded?: string[]; onExpandedChange?: (expanded: string[]) => void; children: ReactNode }`
- `AccordionItem(props: AccordionItemProps): ReactElement`
- `AccordionItemProps`: `{ id: string; title: string; children: ReactNode }`

## Interviewer follow-up

Your open-set state is `string[]`. What breaks (or gets awkward) at 200 items,
and would you switch to `Set<string>`? What does that change about the
controlled API and referential equality for memoized children?
