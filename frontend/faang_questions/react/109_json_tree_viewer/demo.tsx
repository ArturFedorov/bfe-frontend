import { useState } from 'react';
import { JsonTree, type JsonValue } from './json_tree';

/**
 * Demo harness for the JSON tree viewer — auto-discovered by the playground
 * (playground/App.tsx). Renders the shipped <JsonTree /> over a fake
 * packager configuration with a 250-element array (to exercise paging) and a
 * primitive-root toggle. Not part of the task: the spec is README.md and the
 * grader is json_tree.test.tsx.
 */
const CONFIG: JsonValue = {
  service: 'packager-eu',
  version: 12,
  enabled: true,
  owner: null,
  regions: ['eu-west-1', 'eu-central-1'],
  limits: { maxBitrateKbps: 12000, retries: 3, tags: {} },
  ladder: [
    { name: '1080p', bitrateKbps: 6000, codec: 'h264' },
    { name: '720p', bitrateKbps: 3000, codec: 'h264' },
    { name: '480p', bitrateKbps: 1200, codec: 'h264' },
  ],
  segments: Array.from({ length: 250 }, (_, i) => ({
    id: `seg-${String(i).padStart(4, '0')}`,
    durationMs: 6000,
    keyframe: i % 5 === 0,
  })),
};

const SAMPLES: Record<string, JsonValue> = {
  'Packager config': CONFIG,
  'Array root': ['eu-west-1', 'eu-central-1', 'us-east-1'],
  'Primitive root': 42,
};

export default function Demo() {
  const [sample, setSample] = useState<keyof typeof SAMPLES>('Packager config');
  const [depth, setDepth] = useState(1);

  return (
    <div className="demo">
      <h2>JSON Tree Viewer</h2>
      <p className="demo-note">
        Implement <code>flattenJson</code>, <code>searchPaths</code> and <code>JsonTree</code> in{' '}
        <code>json_tree.tsx</code>. Expand <code>segments</code> to see paging (100 rows, then{' '}
        <strong>Show 100 more</strong>), type <code>keyframe</code> or <code>h264</code> into Search
        to reveal matches, Tab into the tree and drive it with arrows, press <kbd>c</kbd> or use{' '}
        <strong>Copy path</strong> to copy a JSON-pointer-like path.
      </p>
      <div className="demo-stage">
        <div className="demo-controls">
          <label>
            Sample{' '}
            <select value={sample} onChange={(e) => setSample(e.target.value as keyof typeof SAMPLES)}>
              {Object.keys(SAMPLES).map((k) => (
                <option key={k}>{k}</option>
              ))}
            </select>
          </label>
          <label>
            Default expanded depth{' '}
            <input
              type="number"
              min={0}
              max={4}
              value={depth}
              onChange={(e) => setDepth(Number(e.target.value))}
              style={{ width: '4em' }}
            />
          </label>
        </div>
        <JsonTree key={`${sample}-${depth}`} value={SAMPLES[sample]} defaultExpandedDepth={depth} />
      </div>
    </div>
  );
}
