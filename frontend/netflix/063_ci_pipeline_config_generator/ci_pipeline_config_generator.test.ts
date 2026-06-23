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
});
