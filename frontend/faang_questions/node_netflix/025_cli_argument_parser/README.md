# N25. CLI Argument Parser

**Difficulty:** Medium
**Topics:** Parsing, CLI

---

## Description

Parse argv into flags (`--verbose`), options (`--out=dist` or `--out dist`), and
positionals.

## Examples

```ts
parseArgs(['build', '--verbose', '--out=dist']);
// { flags: { verbose: true }, options: { out: 'dist' }, positionals: ['build'] }
```

## Constraints

- `--key=value` and `--key value` both set an option.
- A `--key` with no following value (or followed by another `--`) is a boolean flag.
