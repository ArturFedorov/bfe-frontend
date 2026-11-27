/** Removes the minimum number of parentheses so that `s` becomes valid. */
export function minRemoveToMakeValid(s: string): string {
  const chars = s.split('');
  const stack: number[] = [];

  for (let i = 0; i < chars.length; i++) {
    if (chars[i] === '(') {
      stack.push(i);
    } else if (chars[i] === ')') {
      if (stack.length > 0) stack.pop();
      else chars[i] = '';
    }
  }

  for (const i of stack) chars[i] = '';

  return chars.join('');
}
