# 26. OTP Input

**Difficulty:** Medium
**Topics:** Multi-input focus management, paste handling, IME, accessibility

---

## Description

Build a one-time-password input — a row of N single-character cells. Typing a digit auto-advances focus to the next cell. Backspace clears the current cell or moves back. Pasting a multi-digit code distributes characters across cells. Submission fires when all cells are filled.

## Requirements

- Renders `length` (default 6) input cells, each with `inputmode="numeric"` and `maxlength="1"`
- Typing a digit advances focus to the next cell
- Backspace on an empty cell moves focus to the previous cell and clears it
- Backspace on a non-empty cell clears that cell (no focus change)
- Arrow Left/Right navigates between cells
- Pasting a multi-digit string distributes one character per cell, starting from the focused cell
- Non-numeric characters are rejected (configurable via `allowedPattern`)
- `getValue()` returns the joined string
- `setValue(value)` populates cells (extra characters truncated)
- `clear()` empties all cells
- `onComplete(value)` fires when every cell is filled
- `onChange(value)` fires on any change
- `destroy()` removes listeners

## Examples

```ts
const otp = createOtpInput({
  container: document.getElementById('otp')!,
  length: 6,
  onComplete: (code) => console.log('code:', code),
});

otp.setValue('123');
otp.getValue(); // '123'
otp.clear();
```

## Approach Hints

<details>
<summary>Hint 1</summary>
Listen to the <code>input</code> event (not <code>keydown</code>) for typed characters — it handles IME, autofill, and SMS-autofill correctly. <code>keydown</code> only catches physical key presses.
</details>

<details>
<summary>Hint 2</summary>
For paste, listen to <code>paste</code> on the container, call <code>preventDefault()</code>, read <code>event.clipboardData?.getData('text')</code>, then distribute the characters. Don't rely on the default paste behaviour — it dumps the whole string into one cell.
</details>

<details>
<summary>Hint 3</summary>
Backspace behavior: in a <code>keydown</code> listener, if <code>event.key === 'Backspace'</code> and the cell is empty, focus the previous cell. Otherwise let the default delete-character happen.
</details>
