export interface AstNode {
  type: string;
  // For CallExpression: callee is e.g. 'console.log' or 'doThing'
  callee?: string;
  loc?: { line: number; column: number };
  children?: AstNode[];
}

export interface LintMessage {
  ruleId: string;
  message: string;
  line: number;
}

export type Rule = (
  node: AstNode,
  report: (message: string, node: AstNode) => void,
) => void;

/** Walk the AST depth-first, running `rule` on every node. */
export function lint(ast: AstNode, ruleId: string, rule: Rule): LintMessage[] {
  const messages: LintMessage[] = [];

  const report = (message: string, node: AstNode) => {
    messages.push({ ruleId, message, line: node.loc?.line ?? 0 });
  };

  function dfs(node: AstNode) {
    if (!node) return;

    const { children = [] } = node;
    rule(node, report);
    for (const child of children) {
      dfs(child);
    }
  }

  dfs(ast);

  return messages;
}

/** A rule that flags `console.log` call expressions. */
export const noConsoleLog: Rule = (node, report) => {
  if (node.type === 'CallExpression' && node.callee === 'console.log') {
    report('Unexpected console.log', node);
  }
};
