# N61. ESLint rule builder

**Difficulty:** Medium
**Topics:** AST, Linting, Visitor Pattern

---

## Description

Build a tiny ESLint-style rule engine. Given a simplified AST (a tree of nodes)
and a rule that inspects nodes, collect lint messages. Implement `noConsoleLog`,
which reports every `console.log(...)` call expression.

## Examples

```ts
lint(ast, 'no-console-log', noConsoleLog);
// [{ ruleId: 'no-console-log', message: '...', line: 3 }]
```

## Constraints

- `lint` walks the AST depth-first, running the rule on every node.
- `noConsoleLog` reports only `CallExpression` nodes whose callee is
  `console.log`.
