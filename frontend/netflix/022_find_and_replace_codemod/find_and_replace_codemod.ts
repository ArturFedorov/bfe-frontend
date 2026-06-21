interface Token {
  type: 'code' | 'string' | 'comment';
  value: string;
}

/**
 * A find-and-replace codemod. Replace whole-identifier occurrences of `from`
 * with `to`, WITHOUT matching substrings inside larger identifiers or strings.
 * e.g. renaming `foo` should change `foo()` but not `foobar` or `'foo'`.
 *
 * (Interview discussion: regex word-boundary approach vs. a real AST/tokenizer.)
 */
export function rename(code: string, from: string, to: string): string {
  const regex = new RegExp(`\\b${escapeRegex(from)}\\b`, 'g');
  const tokens = tokenize(code);

  return tokens
    .map((token) => {
      if (token.type === 'code') {
        return token.value.replace(regex, to);
      }

      return token.value;
    })
    .join('');
}

function tokenize(code: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  let current = '';

  while (i < code.length) {
    if (code[i] === '/' && code[i + 1] === '/') {
      if (current) {
        tokens.push({ type: 'code', value: current });
        current = '';
      }

      let comment = '';

      while (i < code.length && code[i] !== '\n') {
        comment += code[i++];
      }
      tokens.push({ type: 'comment', value: comment });
      continue;
    }

    if (code[i] === '/' && code[i + 1] === '*') {
      if (current) {
        tokens.push({ type: 'code', value: current });
        current = '';
      }

      let comment = '/*';
      i += 2;

      while (i < code.length && !(code[i] === '*' && code[i + 1] === '/')) {
        comment += code[i++];
      }

      comment += '*/';
      i += 2;
      tokens.push({ type: 'comment', value: comment });
      continue;
    }

    if (code[i] === "'" || code[i] === '"' || code[i] === '`') {
      if (current) {
        tokens.push({ type: 'code', value: current });
        current = '';
      }

      const quote = code[i];
      let str = quote;
      i++;
      while (i < code.length) {
        if (code[i] === '\\') {
          str += code[i++];
          if (i < code.length) {
            str += code[i++];
            continue;
          }

          if (code[i] === quote) {
            str += code[i++];
            break;
          }

          str += code[i++];
        }
      }

      tokens.push({ type: 'string', value: str });
      continue;
    }

    current += code[i++];
  }

  if (current) {
    tokens.push({ type: 'code', value: current });
  }

  return tokens;
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
