import { generateChangelog } from './changelog_generator';

describe('generateChangelog', () => {
  it('groups commits by type', () => {
    const md = generateChangelog([
      'feat(api): add endpoint',
      'fix: handle null',
      'feat: new flag',
    ]);
    expect(md).toContain('### Features');
    expect(md).toContain('add endpoint');
    expect(md).toContain('new flag');
    expect(md).toContain('### Bug Fixes');
    expect(md).toContain('handle null');
  });

  it('omits empty sections', () => {
    const md = generateChangelog(['fix: only a fix']);
    expect(md).not.toContain('### Features');
  });
});
