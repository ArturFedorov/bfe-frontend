const subs: Record<string, string[]> = {
  l: ['1', 'i'],
  o: ['0'],
  s: ['5', 'z'],
  i: ['1', 'l'],
  e: ['3'],
  a: ['4'],
  t: ['7'],
  b: ['6'],
  g: ['9'],
};

/**
 * Given a package name, generate likely typosquat variants:
 *  - single character deletions
 *  - adjacent character swaps
 *  - doubled characters
 * Return a de-duplicated, sorted list that does NOT include the original name.
 */
export function generateTyposquats(name: string): string[] {
  const results = new Set<string>();

  for (let i = 0; i < name.length; i++) {
    results.add(name.slice(0, i) + name.slice(i + 1));

    results.add(name.slice(0, i) + name[i] + name.slice(i));

    const char = name[i].toLowerCase();

    if (subs[char]) {
      for (const replacement of subs[char]) {
        results.add(name.slice(0, i) + replacement + name.slice(i + 1));
      }
    }
  }

  for (let i = 0; i < name.length - 1; i++) {
    const arr = name.split('');

    [arr[i], arr[i + 1]] = [arr[i + 1], arr[i]];
    results.add(arr.join(''));
  }

  if (name.includes('-')) {
    results.add(name.replace(/-/g, '_'));
    results.add(name.replace(/-/, ''));
  }
  if (name.includes('_')) {
    results.add(name.replace(/_/g, '-'));
    results.add(name.replace(/_/g, ''));
  }

  if (!name.includes('-') && !name.includes('_')) {
    for (let i = 1; i < name.length; i++) {
      results.add(name.slice(0, i) + '-' + name.slice(i));
    }
  }

  results.delete(name);

  return Array.from(results).sort();
}
