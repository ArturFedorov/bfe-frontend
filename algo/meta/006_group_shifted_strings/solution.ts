function shiftKey(str: string): string {
  // Normalise so the first letter becomes 'a'; all members of a sequence share it.
  const base = str.charCodeAt(0);
  let key = '';
  for (let i = 0; i < str.length; i++) {
    key += String.fromCharCode(97 + ((str.charCodeAt(i) - base + 26) % 26));
  }
  return key;
}

/** Groups strings that belong to the same shifting sequence. */
export function groupStrings(strings: string[]): string[][] {
  const groups = new Map<string, string[]>();
  for (const str of strings) {
    const key = shiftKey(str);
    const group = groups.get(key);
    if (group) group.push(str);
    else groups.set(key, [str]);
  }
  return [...groups.values()];
}
