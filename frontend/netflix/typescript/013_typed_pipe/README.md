# 013. Typed Pipe

**Difficulty:** Medium
**Topics:** Function overloads, generic inference chains, composition

---

## Scenario

Report ingestion is a chain of small transforms — parse the raw payload, normalize rows,
aggregate, format — and today they're nested calls three parens deep. You're writing
`pipe(f, g, h)` so the chain reads left to right, and the compiler checks every link:
each function's output type must feed the next function's input.

## Requirements

- `pipe` accepts 2, 3, or 4 unary functions and returns a single unary function.
- Inference flows across the chain: `pipe((s: string) => s.length, (n: number) => n > 0)`
  is `(s: string) => boolean` with no annotations at the call site.
- A mismatched link — output of step N not assignable to input of step N+1 — is a compile error.
- Runtime: the returned function applies the functions left to right.

## Example

```ts
const healthScore = pipe(
  (raw: string) => JSON.parse(raw) as number[],
  (checks: number[]) => checks.filter((c) => c > 0).length,
  (passing: number) => `${passing} passing`
);
healthScore('[1,0,1]'); // '2 passing' — typed (raw: string) => string
```

## Target

~20 min. Done = jest suite green: runtime tests pass **and** every inline type
assertion compiles (the compile errors are part of the test suite). Overload
signatures are given; the implementation must satisfy them.

## Interviewer follow-up

- Why overloads here instead of one variadic generic? Sketch the variadic-tuple version and its trade-offs.
- What breaks if the functions aren't unary? How do libraries like RxJS's `pipe` handle it?
- Where does inference fail first when a middle link mismatches — and why does the error land on that argument?
