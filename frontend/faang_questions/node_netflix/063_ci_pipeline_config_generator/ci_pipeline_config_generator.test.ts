import { generateCiPlan, PackageGraph } from './ci_pipeline_config_generator';

const graph: PackageGraph = {
  utils: [],
  api: ['utils'],
  web: ['api'],
  docs: [],
};

describe('generateCiPlan', () => {
  it('includes changed packages and their transitive dependents', () => {
    const plan = generateCiPlan(graph, ['utils']);
    expect([...plan.affected].sort()).toEqual(['api', 'utils', 'web']);
  });

  it('does not include unaffected packages', () => {
    const plan = generateCiPlan(graph, ['docs']);
    expect([...plan.affected].sort()).toEqual(['docs']);
  });

  it('includes only the leaf itself when it has no dependents', () => {
    const plan = generateCiPlan(graph, ['web']);
    expect([...plan.affected].sort()).toEqual(['web']);
  });

  it('unions the affected sets of multiple changed packages', () => {
    const plan = generateCiPlan(graph, ['utils', 'docs']);
    expect([...plan.affected].sort()).toEqual(['api', 'docs', 'utils', 'web']);
  });

  it('deduplicates when the same package is listed as changed twice', () => {
    const plan = generateCiPlan(graph, ['utils', 'utils']);
    expect([...plan.affected].sort()).toEqual(['api', 'utils', 'web']);
  });

  it('returns an empty plan when no packages changed', () => {
    const plan = generateCiPlan(graph, []);
    expect(plan.affected).toEqual([]);
  });

  it('walks each dependent only once in a diamond-shaped graph', () => {
    // shared depends on nothing; left/right both depend on shared;
    // app depends on both left and right.
    const diamond: PackageGraph = {
      shared: [],
      left: ['shared'],
      right: ['shared'],
      app: ['left', 'right'],
    };
    const plan = generateCiPlan(diamond, ['shared']);
    expect([...plan.affected].sort()).toEqual([
      'app',
      'left',
      'right',
      'shared',
    ]);
  });

  it('terminates and dedupes when the dependency graph has a cycle', () => {
    const cyclic: PackageGraph = {
      a: ['b'],
      b: ['c'],
      c: ['a'],
      d: [],
    };
    const plan = generateCiPlan(cyclic, ['c']);
    expect([...plan.affected].sort()).toEqual(['a', 'b', 'c']);
  });

  it('only propagates through direct dependency edges, not siblings', () => {
    const siblings: PackageGraph = {
      utils: [],
      logger: [],
      api: ['utils', 'logger'],
    };
    const plan = generateCiPlan(siblings, ['logger']);
    expect([...plan.affected].sort()).toEqual(['api', 'logger']);
  });
});
