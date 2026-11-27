/** Merge accounts that share any email; each result is [name, ...sortedUniqueEmails]. */
export function accountsMerge(accounts: string[][]): string[][] {
  // Union-find over emails: every email in an account joins the account's first email.
  const parent = new Map<string, string>();
  const rank = new Map<string, number>();
  const owner = new Map<string, string>();

  const find = (x: string): string => {
    let root = x;
    while (parent.get(root) !== root) root = parent.get(root) as string;
    let cur = x;
    while (cur !== root) {
      const next = parent.get(cur) as string;
      parent.set(cur, root);
      cur = next;
    }
    return root;
  };

  const union = (a: string, b: string): void => {
    const ra = find(a);
    const rb = find(b);
    if (ra === rb) return;
    const rankA = rank.get(ra) as number;
    const rankB = rank.get(rb) as number;
    if (rankA < rankB) {
      parent.set(ra, rb);
    } else {
      parent.set(rb, ra);
      if (rankA === rankB) rank.set(ra, rankA + 1);
    }
  };

  for (const [name, ...emails] of accounts) {
    for (const email of emails) {
      if (!parent.has(email)) {
        parent.set(email, email);
        rank.set(email, 0);
        owner.set(email, name);
      }
      union(emails[0], email);
    }
  }

  const groups = new Map<string, string[]>();
  for (const email of parent.keys()) {
    const root = find(email);
    const group = groups.get(root);
    if (group) group.push(email);
    else groups.set(root, [email]);
  }

  const result: string[][] = [];
  for (const [root, emails] of groups) {
    emails.sort();
    result.push([owner.get(root) as string, ...emails]);
  }
  return result;
}
