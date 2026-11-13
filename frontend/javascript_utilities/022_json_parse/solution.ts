/**
 * Recursive-descent JSON parser.
 *
 * A single cursor `i` walks the input. Each `parseX` helper assumes the cursor
 * is at the start of its construct and leaves it just past the end. Any
 * unexpected character, premature end of input, or trailing garbage throws a
 * `SyntaxError` -- matching `JSON.parse`'s contract.
 */
export function jsonParse(text: string): any {
  let i = 0;

  const fail = (msg: string): never => {
    throw new SyntaxError(`${msg} at position ${i}`);
  };

  const skipWhitespace = (): void => {
    while (i < text.length && /[ \t\n\r]/.test(text[i])) i++;
  };

  /** Consume `expected` literally or throw. */
  const expect = (expected: string): void => {
    if (text.startsWith(expected, i)) {
      i += expected.length;
    } else {
      fail(`Expected '${expected}'`);
    }
  };

  const parseValue = (): any => {
    skipWhitespace();
    if (i >= text.length) fail('Unexpected end of input');

    const ch = text[i];
    if (ch === '{') return parseObject();
    if (ch === '[') return parseArray();
    if (ch === '"') return parseString();
    if (ch === '-' || (ch >= '0' && ch <= '9')) return parseNumber();
    if (ch === 't') return (expect('true'), true);
    if (ch === 'f') return (expect('false'), false);
    if (ch === 'n') return (expect('null'), null);

    return fail(`Unexpected token '${ch}'`);
  };

  const parseObject = (): Record<string, any> => {
    const result: Record<string, any> = {};
    expect('{');
    skipWhitespace();

    if (text[i] === '}') {
      i++;
      return result;
    }

    for (;;) {
      skipWhitespace();
      if (text[i] !== '"') fail('Expected string key');
      const key = parseString();

      skipWhitespace();
      expect(':');

      result[key] = parseValue();

      skipWhitespace();
      if (text[i] === ',') {
        i++;
        continue;
      }
      if (text[i] === '}') {
        i++;
        return result;
      }
      fail("Expected ',' or '}'");
    }
  };

  const parseArray = (): any[] => {
    const result: any[] = [];
    expect('[');
    skipWhitespace();

    if (text[i] === ']') {
      i++;
      return result;
    }

    for (;;) {
      result.push(parseValue());

      skipWhitespace();
      if (text[i] === ',') {
        i++;
        continue;
      }
      if (text[i] === ']') {
        i++;
        return result;
      }
      fail("Expected ',' or ']'");
    }
  };

  const parseString = (): string => {
    expect('"');
    let out = '';

    while (i < text.length) {
      const ch = text[i++];

      if (ch === '"') return out;

      if (ch === '\\') {
        const esc = text[i++];
        switch (esc) {
          case '"':
            out += '"';
            break;
          case '\\':
            out += '\\';
            break;
          case '/':
            out += '/';
            break;
          case 'b':
            out += '\b';
            break;
          case 'f':
            out += '\f';
            break;
          case 'n':
            out += '\n';
            break;
          case 'r':
            out += '\r';
            break;
          case 't':
            out += '\t';
            break;
          case 'u': {
            const hex = text.slice(i, i + 4);
            if (!/^[0-9a-fA-F]{4}$/.test(hex)) fail('Invalid unicode escape');
            out += String.fromCharCode(parseInt(hex, 16));
            i += 4;
            break;
          }
          default:
            fail(`Invalid escape '\\${esc}'`);
        }
        continue;
      }

      // Raw control characters are not allowed inside JSON strings.
      if (ch < ' ') fail('Unescaped control character in string');

      out += ch;
    }

    return fail('Unterminated string');
  };

  const parseNumber = (): number => {
    const start = i;

    if (text[i] === '-') i++;

    // Integer part: "0" or [1-9][0-9]*
    if (text[i] === '0') {
      i++;
    } else if (text[i] >= '1' && text[i] <= '9') {
      while (text[i] >= '0' && text[i] <= '9') i++;
    } else {
      fail('Invalid number');
    }

    // Fraction
    if (text[i] === '.') {
      i++;
      if (!(text[i] >= '0' && text[i] <= '9')) fail('Invalid number');
      while (text[i] >= '0' && text[i] <= '9') i++;
    }

    // Exponent
    if (text[i] === 'e' || text[i] === 'E') {
      i++;
      if (text[i] === '+' || text[i] === '-') i++;
      if (!(text[i] >= '0' && text[i] <= '9')) fail('Invalid number');
      while (text[i] >= '0' && text[i] <= '9') i++;
    }

    return Number(text.slice(start, i));
  };

  const value = parseValue();
  skipWhitespace();
  if (i < text.length) fail(`Unexpected token '${text[i]}'`);

  return value;
}
