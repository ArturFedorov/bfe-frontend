import { lint, noConsoleLog, AstNode, Rule } from './eslint_rule_builder';

const ast: AstNode = {
  type: 'Program',
  children: [
    {
      type: 'CallExpression',
      callee: 'console.log',
      loc: { line: 3, column: 0 },
    },
    { type: 'CallExpression', callee: 'doThing', loc: { line: 4, column: 0 } },
  ],
};

describe('noConsoleLog rule', () => {
  it('reports console.log calls only', () => {
    const messages = lint(ast, 'no-console-log', noConsoleLog);
    expect(messages).toHaveLength(1);
    expect(messages[0]).toMatchObject({ ruleId: 'no-console-log', line: 3 });
  });

  it('reports every console.log in source order', () => {
    const multi: AstNode = {
      type: 'Program',
      children: [
        { type: 'CallExpression', callee: 'console.log', loc: { line: 1, column: 0 } },
        { type: 'CallExpression', callee: 'doThing', loc: { line: 2, column: 0 } },
        { type: 'CallExpression', callee: 'console.log', loc: { line: 5, column: 4 } },
      ],
    };
    const messages = lint(multi, 'no-console-log', noConsoleLog);
    expect(messages).toHaveLength(2);
    expect(messages.map((m) => m.line)).toEqual([1, 5]);
  });

  it('finds console.log nested deep in the tree', () => {
    const nested: AstNode = {
      type: 'Program',
      children: [
        {
          type: 'FunctionDeclaration',
          children: [
            {
              type: 'BlockStatement',
              children: [
                { type: 'CallExpression', callee: 'console.log', loc: { line: 7, column: 2 } },
              ],
            },
          ],
        },
      ],
    };
    const messages = lint(nested, 'no-console-log', noConsoleLog);
    expect(messages).toHaveLength(1);
    expect(messages[0]).toMatchObject({ ruleId: 'no-console-log', line: 7 });
  });

  it('returns an empty array when there are no console.log calls', () => {
    const clean: AstNode = {
      type: 'Program',
      children: [
        { type: 'CallExpression', callee: 'doThing', loc: { line: 1, column: 0 } },
        { type: 'CallExpression', callee: 'console.error', loc: { line: 2, column: 0 } },
      ],
    };
    expect(lint(clean, 'no-console-log', noConsoleLog)).toEqual([]);
  });

  it('does not report other console methods', () => {
    const other: AstNode = {
      type: 'Program',
      children: [
        { type: 'CallExpression', callee: 'console.warn', loc: { line: 1, column: 0 } },
        { type: 'CallExpression', callee: 'console.info', loc: { line: 2, column: 0 } },
      ],
    };
    expect(lint(other, 'no-console-log', noConsoleLog)).toEqual([]);
  });

  it('ignores non-CallExpression nodes that mention console.log', () => {
    const tricky: AstNode = {
      type: 'Program',
      children: [
        { type: 'MemberExpression', callee: 'console.log', loc: { line: 1, column: 0 } },
        { type: 'Identifier', callee: 'console.log', loc: { line: 2, column: 0 } },
      ],
    };
    expect(lint(tricky, 'no-console-log', noConsoleLog)).toEqual([]);
  });

  it('attaches a non-empty message to each report', () => {
    const messages = lint(ast, 'no-console-log', noConsoleLog);
    expect(typeof messages[0].message).toBe('string');
    expect(messages[0].message.length).toBeGreaterThan(0);
  });
});

describe('lint engine', () => {
  it('walks the AST depth-first, visiting every node', () => {
    const tree: AstNode = {
      type: 'Program',
      loc: { line: 1, column: 0 },
      children: [
        {
          type: 'A',
          loc: { line: 2, column: 0 },
          children: [{ type: 'A1', loc: { line: 3, column: 0 } }],
        },
        { type: 'B', loc: { line: 4, column: 0 } },
      ],
    };
    const visitAll: Rule = (node, report) => report(node.type, node);
    const messages = lint(tree, 'visit', visitAll);
    expect(messages.map((m) => m.message)).toEqual([
      'Program',
      'A',
      'A1',
      'B',
    ]);
  });

  it('runs the rule on the root node', () => {
    const root: AstNode = { type: 'Program', loc: { line: 1, column: 0 } };
    const reportRoot: Rule = (node, report) => {
      if (node.type === 'Program') report('root', node);
    };
    const messages = lint(root, 'root-rule', reportRoot);
    expect(messages).toEqual([
      { ruleId: 'root-rule', message: 'root', line: 1 },
    ]);
  });

  it('uses the provided ruleId for every message', () => {
    const reportAll: Rule = (node, report) => report('hit', node);
    const messages = lint(ast, 'my-custom-rule', reportAll);
    expect(messages.every((m) => m.ruleId === 'my-custom-rule')).toBe(true);
  });

  it('returns an empty array when the rule reports nothing', () => {
    const noop: Rule = () => {};
    expect(lint(ast, 'noop', noop)).toEqual([]);
  });
});
