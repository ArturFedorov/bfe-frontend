import { scoreHealth } from './package_health_scorer';

describe('scoreHealth', () => {
  it('scores a healthy package highly', () => {
    expect(
      scoreHealth({
        daysSinceLastPublish: 10,
        openIssues: 5,
        weeklyDownloads: 500000,
        vulnerabilities: 0,
      }),
    ).toBe(100); // 100 + 5 bonus, clamped to 100
  });

  it('penalizes vulnerabilities heavily', () => {
    expect(
      scoreHealth({
        daysSinceLastPublish: 0,
        openIssues: 0,
        weeklyDownloads: 0,
        vulnerabilities: 3,
      }),
    ).toBe(70);
  });

  it('clamps to zero', () => {
    expect(
      scoreHealth({
        daysSinceLastPublish: 0,
        openIssues: 0,
        weeklyDownloads: 0,
        vulnerabilities: 20,
      }),
    ).toBe(0);
  });
});
