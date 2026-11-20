/**
 * 064. Formula Calculator — reference solution
 *
 * Recursive descent over the raw string with a single cursor:
 *
 *   expr   := term (('+' | '-') term)*
 *   term   := factor (('*' | '/') factor)*
 *   factor := '-'? primary
 *   primary:= number | '(' expr ')'
 *
 * Unary minus is allowed at most once per factor, so '5--3' parses but '--3'
 * does not. Loops (not recursion) handle left associativity, so recursion
 * depth only grows with parenthesis nesting.
 *
 * Time: O(n). Space: O(d) for parenthesis depth d.
 */
export function evaluateFormula(formula: string): number {
  let pos = 0;

  const isDigit = (ch: string | undefined): boolean =>
    ch !== undefined && ch >= '0' && ch <= '9';

  const skipSpaces = (): void => {
    while (pos < formula.length && /\s/.test(formula[pos])) {
      pos++;
    }
  };

  const peek = (): string | undefined => {
    skipSpaces();
    return formula[pos];
  };

  const fail = (message: string): never => {
    throw new Error(`${message} at position ${pos}`);
  };

  const parseNumber = (): number => {
    const start = pos;
    while (isDigit(formula[pos])) pos++;
    if (formula[pos] === '.') {
      pos++;
      if (!isDigit(formula[pos])) fail('Expected digit after decimal point');
      while (isDigit(formula[pos])) pos++;
    }
    return Number(formula.slice(start, pos));
  };

  const parsePrimary = (): number => {
    const ch = peek();
    if (ch === '(') {
      pos++;
      const value = parseExpr();
      if (peek() !== ')') fail('Expected ")"');
      pos++;
      return value;
    }
    if (isDigit(ch)) return parseNumber();
    return fail(
      ch === undefined ? 'Unexpected end of input' : `Unexpected "${ch}"`,
    );
  };

  const parseFactor = (): number => {
    if (peek() === '-') {
      pos++;
      return -parsePrimary();
    }
    return parsePrimary();
  };

  const parseTerm = (): number => {
    let value = parseFactor();
    for (let op = peek(); op === '*' || op === '/'; op = peek()) {
      pos++;
      const rhs = parseFactor();
      if (op === '/' && rhs === 0) fail('Division by zero');
      value = op === '*' ? value * rhs : value / rhs;
    }
    return value;
  };

  function parseExpr(): number {
    let value = parseTerm();
    for (let op = peek(); op === '+' || op === '-'; op = peek()) {
      pos++;
      const rhs = parseTerm();
      value = op === '+' ? value + rhs : value - rhs;
    }
    return value;
  }

  const result = parseExpr();
  if (peek() !== undefined) fail(`Unexpected "${formula[pos]}"`);
  return result;
}
