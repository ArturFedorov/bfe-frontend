export interface Hook {
  name: string;
  pattern: RegExp;
  run: (files: string[]) => boolean; // return true on success
}

export interface HookReport {
  ran: string[]; // hook names that ran
  failed: string[]; // hook names that failed
  ok: boolean;
}

/**
 * Run pre-commit hooks against staged files. A hook runs only if its `pattern`
 * matches at least one staged file; it receives the matching files. `ok` is
 * false if any hook returns false.
 */
export function runHooks(stagedFiles: string[], hooks: Hook[]): HookReport {
  const ran: string[] = [];
  const failed: string[] = [];

  for (const hook of hooks) {
    const matching = stagedFiles.filter((file) => hook.pattern.test(file));
    if (matching.length === 0) continue;

    ran.push(hook.name);
    if (!hook.run(matching)) {
      failed.push(hook.name);
    }
  }

  return {
    ran,
    failed,
    ok: failed.length === 0,
  };
}
