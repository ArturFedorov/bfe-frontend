# 021. Typed Input Compare

**Difficulty:** Medium
**Topics:** Two Pointers, Strings, Backward Scan

---

## Description

A form-replay tool records raw keystrokes, where a `#` character means the user pressed backspace.
Two recorded sessions should count as identical if the **final rendered text** is the same after
applying every backspace. Building the rendered strings first would double the memory of an
already huge recording — instead, compare the two recordings directly by walking both from the end
with two pointers, skipping characters that backspaces erase. Pressing backspace on an empty input
does nothing, and a `#` can itself never appear in the rendered text.

## Examples

```ts
typedInputsEqual('ab#c', 'ad#c');   // true  — both render 'ac'
typedInputsEqual('ab##', 'c#d#');   // true  — both render ''
typedInputsEqual('a#c', 'b');       // false — 'c' vs 'b'
```

## Constraints

- `a.length` and `b.length` are each between `0` and `200_000`.
- Recordings contain lowercase letters and `#` only.
- `#` deletes the previous surviving character; on an empty input it is a no-op.
- Do not build the rendered strings — no stacks, no intermediate arrays (O(1) extra space).
- Two empty renders are equal; an empty string input is valid.

## Target

O(n + m) time, O(1) extra space.

## Interviewer follow-up

The recordings now stream in forward-only chunks from the network, so you cannot start at the end.
What approach do you fall back to, and what is the minimum memory you can get away with?
