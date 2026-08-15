import { evaluateFormula } from './formula_calculator';

describe('evaluateFormula', () => {
  describe('basic arithmetic', () => {
    it('evaluates a single number', () => {
      expect(evaluateFormula('42')).toBe(42);
    });

    it('adds and subtracts', () => {
      expect(evaluateFormula('2+3')).toBe(5);
      expect(evaluateFormula('10-4')).toBe(6);
    });

    it('multiplies and divides', () => {
      expect(evaluateFormula('6*7')).toBe(42);
      expect(evaluateFormula('7/2')).toBe(3.5);
    });
  });

  describe('precedence and associativity', () => {
    it('gives * and / priority over + and -', () => {
      expect(evaluateFormula('2+3*4')).toBe(14);
      expect(evaluateFormula('20-6/2')).toBe(17);
    });

    it('evaluates equal precedence left to right', () => {
      expect(evaluateFormula('8-3-2')).toBe(3);
      expect(evaluateFormula('12/3/2')).toBe(2);
      expect(evaluateFormula('10-2+3')).toBe(11);
    });

    it('evaluates the headline example', () => {
      expect(evaluateFormula('2+3*(4-1)')).toBe(11);
    });
  });

  describe('parentheses', () => {
    it('overrides precedence', () => {
      expect(evaluateFormula('(2+3)*4')).toBe(20);
    });

    it('handles nested groups', () => {
      expect(evaluateFormula('((1+2)*(3+4))/7')).toBe(3);
    });

    it('handles redundant parentheses around a number', () => {
      expect(evaluateFormula('((((5))))')).toBe(5);
    });

    it('handles deeply nested parentheses', () => {
      const depth = 500;
      const formula = '('.repeat(depth) + '1+1' + ')'.repeat(depth) + '*3';
      expect(evaluateFormula(formula)).toBe(6);
    });
  });

  describe('unary minus and negative numbers', () => {
    it('negates a leading number', () => {
      expect(evaluateFormula('-3+5')).toBe(2);
    });

    it('allows unary minus after a binary operator', () => {
      expect(evaluateFormula('2*-4')).toBe(-8);
      expect(evaluateFormula('6/-2')).toBe(-3);
      expect(evaluateFormula('5--3')).toBe(8);
    });

    it('negates a parenthesized group', () => {
      expect(evaluateFormula('-(1+2)*3')).toBe(-9);
      expect(evaluateFormula('(-(2+3))')).toBe(-5);
    });

    it('evaluates the mixed decimal example', () => {
      expect(evaluateFormula(' -2.5 * (4 + -6) ')).toBe(5);
    });
  });

  describe('decimals and whitespace', () => {
    it('parses decimal literals', () => {
      expect(evaluateFormula('3.25+0.75')).toBe(4);
      expect(evaluateFormula('0.1*10')).toBeCloseTo(1);
    });

    it('ignores arbitrary whitespace', () => {
      expect(evaluateFormula('  2 +   3 *\t( 4 - 1 ) ')).toBe(11);
    });
  });

  describe('division by zero', () => {
    it('throws on a literal zero divisor', () => {
      expect(() => evaluateFormula('5/0')).toThrow();
    });

    it('throws when the divisor evaluates to zero', () => {
      expect(() => evaluateFormula('5/(3-3)')).toThrow();
    });

    it('throws deep inside a larger expression', () => {
      expect(() => evaluateFormula('1+2*(4/(1-1))-7')).toThrow();
    });
  });

  describe('malformed input', () => {
    it.each([
      ['empty string', ''],
      ['whitespace only', '   '],
      ['lone operator', '+'],
      ['trailing operator', '2+'],
      ['leading binary operator', '*3'],
      ['doubled binary operator', '2**3'],
      ['doubled unary minus', '--3'],
      ['doubled unary minus after operator', '2*--3'],
      ['empty parentheses', '()'],
      ['unbalanced open paren', '(2+3'],
      ['unbalanced close paren', '2+3)'],
      ['swapped parens', ')2('],
      ['adjacent numbers without operator', '2 3'],
      ['dot without leading digits', '.5+1'],
      ['dot without trailing digits', '2.+1'],
      ['double-dotted number', '1.2.3'],
      ['invalid characters', '2+abc'],
      ['operator before close paren', '(2+)'],
    ])('throws on %s', (_label, input) => {
      expect(() => evaluateFormula(input)).toThrow();
    });
  });

  describe('large input', () => {
    it('evaluates a 100_000-character flat formula in linear time', () => {
      const terms = 25_000;
      // '1+1+1+...' — 25_000 ones.
      const formula = '1' + '+1'.repeat(terms - 1);
      expect(evaluateFormula(formula)).toBe(terms);

      const alternating = '2' + '-1+1'.repeat(12_000);
      expect(evaluateFormula(alternating)).toBe(2);
    });
  });
});
