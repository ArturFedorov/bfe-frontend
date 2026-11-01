import { createPullRequests, Repo } from './automated_pr_creator';

const repos: Repo[] = [
  { name: 'svc-a', files: { 'index.js': 'var x = 1;' } },
  { name: 'svc-b', files: { 'index.js': 'const y = 2;' } },
];

const transform = (files: Record<string, string>) => {
  const out: Record<string, string> = {};
  for (const [path, code] of Object.entries(files)) {
    out[path] = code.replace('var ', 'const ');
  }
  return out;
};

describe('createPullRequests', () => {
  it('creates a PR only for repos that changed', () => {
    const prs = createPullRequests(repos, 'codemod/var-to-const', transform);
    expect(prs).toHaveLength(1);
    expect(prs[0].repo).toBe('svc-a');
    expect(prs[0].branch).toBe('codemod/var-to-const');
    expect(prs[0].changedFiles).toEqual(['index.js']);
  });
});
