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
  // TODO: implement
  throw new Error('Not implemented');
}

/** A rule that flags `console.log` call expressions. */
export const noConsoleLog: Rule = (node, report) => {
  // TODO: implement
  throw new Error('Not implemented');
};
