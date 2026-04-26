# 22. Toggle Switch

**Difficulty:** Easy
**Topics:** Controlled vs uncontrolled state, ARIA, keyboard handling

---

## Description

Build a toggle switch (on/off) component. It must work as a real form control: clickable, keyboard-operable, and screen-reader friendly. Support both controlled (state owned by caller) and uncontrolled (state owned by component) modes.

## Requirements

- Renders a button with `role="switch"` and `aria-checked` reflecting the current state
- Clicking the switch toggles state (in uncontrolled mode)
- Space and Enter keys toggle state
- `getChecked()` returns current state
- `setChecked(value)` programmatically updates state
- `onChange` fires only when state actually changes
- `disabled: true` blocks toggling and sets `aria-disabled="true"`
- `controlled: true` means the component never mutates its own state — caller must call `setChecked` in response to `onChange`
- `destroy()` removes element and listeners

## Examples

```ts
const toggle = createToggleSwitch({
  container: document.getElementById('toggle')!,
  initialChecked: false,
  onChange: (checked) => console.log('checked:', checked),
});

toggle.setChecked(true);
toggle.getChecked(); // true
```

## Approach Hints

<details>
<summary>Hint 1</summary>
Use a <code>&lt;button type="button"&gt;</code> with <code>role="switch"</code>. Buttons get keyboard support (Space/Enter) for free.
</details>

<details>
<summary>Hint 2</summary>
In controlled mode, the click handler should call <code>onChange</code> with the desired next state, but skip mutating internal state. Only update the DOM when <code>setChecked</code> is invoked externally.
</details>

<details>
<summary>Hint 3</summary>
Reflect state with <code>aria-checked="true"</code>/<code>"false"</code> and a CSS class like <code>checked</code>. Don't rely on text labels alone — assistive tech reads the ARIA state.
</details>
