import { lint, noConsoleLog, AstNode } from './eslint_rule_builder';

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
});
