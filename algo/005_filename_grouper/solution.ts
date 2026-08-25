export function groupFilenames(names: string[]): string[][] {
  const dictionary: Map<string, string[]> = new Map();

  for (const name of names) {
    const strippedName = name.replace(/[-_\s]+/g, '').toLowerCase();

    const group = dictionary.get(strippedName);
    if (group) {
      group.push(name);
    } else {
      dictionary.set(strippedName, [name]);
    }
  }

  return [...dictionary.values()];
}
