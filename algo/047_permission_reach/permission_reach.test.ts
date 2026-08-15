import { reachableResources, PermissionInput } from './permission_reach';

describe('reachableResources', () => {
  it('collects direct and inherited grants across nested groups', () => {
    const input: PermissionInput = {
      memberships: {
        alice: ['devs', 'oncall'],
        devs: ['engineering'],
        oncall: [],
        engineering: [],
      },
      grants: {
        alice: ['laptop'],
        devs: ['repo'],
        engineering: ['vpn', 'wiki'],
        oncall: ['pager'],
      },
    };
    expect(reachableResources(input, 'alice')).toEqual([
      'laptop',
      'pager',
      'repo',
      'vpn',
      'wiki',
    ]);
  });

  it('returns only direct grants for a user with no memberships', () => {
    const input: PermissionInput = {
      memberships: {},
      grants: { bob: ['desk'] },
    };
    expect(reachableResources(input, 'bob')).toEqual(['desk']);
  });

  it('returns [] for an unknown user', () => {
    const input: PermissionInput = { memberships: {}, grants: {} };
    expect(reachableResources(input, 'ghost')).toEqual([]);
  });

  it('returns [] for a user with no grants anywhere', () => {
    const input: PermissionInput = {
      memberships: { carol: ['emptyGroup'] },
      grants: {},
    };
    expect(reachableResources(input, 'carol')).toEqual([]);
  });

  it('handles the empty input', () => {
    expect(
      reachableResources({ memberships: {}, grants: {} }, 'anyone')
    ).toEqual([]);
  });

  it('survives membership cycles', () => {
    const input: PermissionInput = {
      memberships: {
        dave: ['a'],
        a: ['b'],
        b: ['a'], // a <-> b cycle
      },
      grants: {
        a: ['res-a'],
        b: ['res-b'],
      },
    };
    expect(reachableResources(input, 'dave')).toEqual(['res-a', 'res-b']);
  });

  it('survives a self-referencing group', () => {
    const input: PermissionInput = {
      memberships: { erin: ['loop'], loop: ['loop'] },
      grants: { loop: ['res'] },
    };
    expect(reachableResources(input, 'erin')).toEqual(['res']);
  });

  it('deduplicates resources granted via multiple paths', () => {
    const input: PermissionInput = {
      memberships: {
        frank: ['g1', 'g2'],
        g1: ['shared'],
        g2: ['shared'],
      },
      grants: {
        g1: ['tool'],
        g2: ['tool'],
        shared: ['tool', 'dashboard'],
      },
    };
    expect(reachableResources(input, 'frank')).toEqual(['dashboard', 'tool']);
  });

  it('does not leak grants from unreachable groups (disconnected graph)', () => {
    const input: PermissionInput = {
      memberships: {
        gina: ['devs'],
        admins: ['root'],
      },
      grants: {
        devs: ['repo'],
        admins: ['billing'],
        root: ['prod-db'],
      },
    };
    expect(reachableResources(input, 'gina')).toEqual(['repo']);
  });

  it('does not traverse memberships in reverse', () => {
    // devs is a member of engineering; engineering is NOT a member of devs.
    const input: PermissionInput = {
      memberships: { devs: ['engineering'] },
      grants: { devs: ['repo'], engineering: ['vpn'] },
    };
    expect(reachableResources(input, 'engineering')).toEqual(['vpn']);
    expect(reachableResources(input, 'devs')).toEqual(['repo', 'vpn']);
  });

  it('sorts the output alphabetically', () => {
    const input: PermissionInput = {
      memberships: { hana: ['g'] },
      grants: { hana: ['zebra'], g: ['apple', 'mango'] },
    };
    expect(reachableResources(input, 'hana')).toEqual([
      'apple',
      'mango',
      'zebra',
    ]);
  });

  it('traverses a deep 50k-group chain in linear time', () => {
    const n = 50000;
    const memberships: Record<string, string[]> = { user: ['g0'] };
    const grants: Record<string, string[]> = {};
    for (let i = 0; i < n; i++) {
      memberships[`g${i}`] = i + 1 < n ? [`g${i + 1}`] : [];
    }
    grants[`g${n - 1}`] = ['deep-resource'];
    grants.g0 = ['near-resource'];
    const input: PermissionInput = { memberships, grants };
    expect(reachableResources(input, 'user')).toEqual([
      'deep-resource',
      'near-resource',
    ]);
  });
});
