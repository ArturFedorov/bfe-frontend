# 042. Layout Clipboard

**Difficulty:** Hard
**Topics:** Trees, Serialization, Parsing

---

## Description

Copy/paste between two documents of a layout editor works by serializing the
selected subtree to a plain string (the clipboard) and rebuilding it on
paste. Implement `serialize(root)` → `string` and `deserialize(data)` →
tree, such that the round trip is exact: `deserialize(serialize(t))` deep-
equals `t` for any tree, including `null`. Nodes carry an `id`, an optional
`text` payload, and `children`. The hard part: `id` and `text` are arbitrary
user strings — they may contain commas, brackets, pipes, quotes, backslashes
or newlines, so a naive delimiter-joined format corrupts. You choose the
format; escaping (or length-prefixing) is the exercise.

## Examples

```ts
const tree = {
  id: 'root',
  children: [
    { id: 'title', text: 'Hello, world', children: [] },
    { id: 'box', children: [{ id: 'leaf', text: 'a|b[c]', children: [] }] },
  ],
};

const data = serialize(tree);          // some string of your design
deserialize(data);                     // deep-equals `tree`
deserialize(serialize(null));          // null
typeof serialize(tree);                // 'string'
```

## Constraints

- `0 <= number of nodes <= 100_000`.
- `id` is any string (may be empty, may contain any characters, including
  whatever delimiters your format uses); `text` is optional and likewise
  arbitrary — `text: ''` must survive the round trip as `''`, distinct from
  absent.
- `serialize(null)` must produce a string that deserializes back to `null`.
- Serialization must be deterministic: the same tree always yields the same
  string.
- No JSON restrictions apply — but if you hand-roll a format, escaping is on
  you.

## Target

O(n) serialize and O(n) deserialize, single pass each.

## Interviewer follow-up

The clipboard now syncs over the network and trees reach 10M nodes — how do
you make the format streamable so paste can start building the tree before
the whole string has arrived?
