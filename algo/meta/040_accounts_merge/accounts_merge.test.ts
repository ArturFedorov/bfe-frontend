import { accountsMerge } from './accounts_merge';

/** Sort emails inside each account, then sort accounts, so order doesn't matter. */
function normalize(accounts: string[][]): string[][] {
  return accounts
    .map(([name, ...emails]) => [name, ...[...emails].sort()])
    .sort((a, b) => a.join('\u0000').localeCompare(b.join('\u0000')));
}

describe('accountsMerge', () => {
  it('example: two Johns merge, third John and Mary stay separate', () => {
    const result = accountsMerge([
      ['John', 'johnsmith@mail.com', 'john_newyork@mail.com'],
      ['John', 'johnsmith@mail.com', 'john00@mail.com'],
      ['Mary', 'mary@mail.com'],
      ['John', 'johnnybravo@mail.com'],
    ]);
    expect(normalize(result)).toEqual(
      normalize([
        [
          'John',
          'john00@mail.com',
          'john_newyork@mail.com',
          'johnsmith@mail.com',
        ],
        ['Mary', 'mary@mail.com'],
        ['John', 'johnnybravo@mail.com'],
      ]),
    );
  });

  it('emails within a merged account are sorted', () => {
    const result = accountsMerge([['A', 'c@x', 'a@x', 'b@x']]);
    expect(result).toEqual([['A', 'a@x', 'b@x', 'c@x']]);
  });

  it('single account with one email', () => {
    expect(accountsMerge([['Solo', 'solo@x']])).toEqual([['Solo', 'solo@x']]);
  });

  it('duplicate emails inside one account are deduplicated', () => {
    expect(accountsMerge([['A', 'a@x', 'a@x', 'b@x']])).toEqual([
      ['A', 'a@x', 'b@x'],
    ]);
  });

  it('identical accounts collapse into one', () => {
    expect(
      accountsMerge([
        ['A', 'a@x', 'b@x'],
        ['A', 'b@x', 'a@x'],
      ]),
    ).toEqual([['A', 'a@x', 'b@x']]);
  });

  it('same name without shared email stays separate', () => {
    const result = accountsMerge([
      ['Alex', 'one@x'],
      ['Alex', 'two@x'],
    ]);
    expect(normalize(result)).toEqual([
      ['Alex', 'one@x'],
      ['Alex', 'two@x'],
    ]);
  });

  it('transitive merge through a middle account', () => {
    const result = accountsMerge([
      ['Bo', 'a@x', 'b@x'],
      ['Bo', 'c@x', 'd@x'],
      ['Bo', 'b@x', 'c@x'],
    ]);
    expect(result).toEqual([['Bo', 'a@x', 'b@x', 'c@x', 'd@x']]);
  });

  it('LeetCode example 2', () => {
    const result = accountsMerge([
      ['Gabe', 'Gabe0@m.co', 'Gabe3@m.co', 'Gabe1@m.co'],
      ['Kevin', 'Kevin3@m.co', 'Kevin5@m.co', 'Kevin0@m.co'],
      ['Ethan', 'Ethan5@m.co', 'Ethan4@m.co', 'Ethan0@m.co'],
      ['Hanzo', 'Hanzo3@m.co', 'Hanzo1@m.co', 'Hanzo0@m.co'],
      ['Fern', 'Fern5@m.co', 'Fern1@m.co', 'Fern0@m.co'],
    ]);
    expect(normalize(result)).toEqual(
      normalize([
        ['Ethan', 'Ethan0@m.co', 'Ethan4@m.co', 'Ethan5@m.co'],
        ['Gabe', 'Gabe0@m.co', 'Gabe1@m.co', 'Gabe3@m.co'],
        ['Hanzo', 'Hanzo0@m.co', 'Hanzo1@m.co', 'Hanzo3@m.co'],
        ['Kevin', 'Kevin0@m.co', 'Kevin3@m.co', 'Kevin5@m.co'],
        ['Fern', 'Fern0@m.co', 'Fern1@m.co', 'Fern5@m.co'],
      ]),
    );
  });

  it('emails sort by plain string order (uppercase before lowercase, _ after digits)', () => {
    const result = accountsMerge([['Z', 'b@x', 'B@x', 'a_1@x', 'a1@x']]);
    expect(result).toEqual([['Z', 'B@x', 'a1@x', 'a_1@x', 'b@x']]);
  });

  it('large: 20k accounts chained into one person plus 20k singletons', () => {
    const n = 20_000;
    const accounts: string[][] = [];
    for (let i = 0; i < n; i++)
      accounts.push(['Chain', `c${i}@x`, `c${i + 1}@x`]);
    for (let i = 0; i < n; i++) accounts.push([`P${i}`, `p${i}@x`]);
    const result = accountsMerge(accounts);
    expect(result).toHaveLength(n + 1);
    const chain = result.find((acc) => acc[0] === 'Chain') as string[];
    expect(chain).toHaveLength(n + 2);
    const expectedEmails = Array.from(
      { length: n + 1 },
      (_, i) => `c${i}@x`,
    ).sort();
    expect(chain.slice(1)).toEqual(expectedEmails);
  });
});
