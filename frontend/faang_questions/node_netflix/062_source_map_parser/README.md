# N62. Source map parser

**Difficulty:** Medium
**Topics:** Source Maps, Base64 VLQ, Encoding

---

## Description

Parse a Source Map v3 `mappings` string (Base64 VLQ) and map a position in the
generated file back to its original source position.

Lines in `mappings` are separated by `;`, segments by `,`. Each segment is a set
of VLQ-encoded fields: `[generatedColumn, sourceIndex, originalLine,
originalColumn, (nameIndex)]`, all stored as deltas.

## Examples

```ts
const map = { version: 3, sources: ['original.ts'], names: [], mappings: 'AAAA' };
originalPositionFor(map, { line: 1, column: 0 });
// { source: 'original.ts', line: 1, column: 0 }
```

## Constraints

- Decode Base64 VLQ; accumulate the delta-encoded fields.
- Returned `line` is 1-based; `column` is 0-based. Return `null` if no mapping.
