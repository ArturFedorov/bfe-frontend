import { useState } from 'react';
import { Customer, FieldDef, Group, SegmentBuilder } from './segment_builder';

/**
 * Demo harness for the audience segment builder — auto-discovered by the
 * playground (playground/App.tsx). This file is not part of the task: the
 * spec lives in README.md and the grader is segment_builder.test.tsx.
 *
 * The parent owns the tree (fully controlled) and shows the JSON next to the
 * builder, plus an undo stack built purely from the values `onChange`
 * delivered — a working implementation with structural sharing makes each
 * undo entry cheap because untouched subtrees are shared between versions.
 */

const FIELDS: FieldDef[] = [
  { name: 'country', label: 'Country', type: 'string' },
  { name: 'orders', label: 'Orders (90d)', type: 'number' },
  { name: 'plan', label: 'Plan', type: 'enum', options: ['free', 'pro', 'team'] },
  { name: 'channel', label: 'Preferred channel', type: 'enum', options: ['email', 'push', 'in-app'] },
  { name: 'tags', label: 'Tags', type: 'string' },
];

const COUNTRIES = ['Germany', 'France', 'Spain', 'Poland', 'Italy', 'Sweden'];
const PLANS = ['free', 'free', 'pro', 'pro', 'team'];
const CHANNELS = ['email', 'push', 'in-app'];
const TAG_POOL = ['vip', 'newsletter', 'beta', 'churn-risk', 'referrer'];

const CUSTOMERS: Customer[] = Array.from({ length: 60 }, (_, i) => {
  const tags = TAG_POOL.filter((_, t) => (i * 7 + t * 3) % 5 === 0);
  const customer: Customer = {
    id: `cust-${String(i + 1).padStart(3, '0')}`,
    country: COUNTRIES[i % COUNTRIES.length],
    plan: PLANS[i % PLANS.length],
    channel: CHANNELS[(i * 2) % CHANNELS.length],
    tags,
  };
  if (i % 9 !== 0) customer.orders = (i * 13) % 40; // every 9th customer has no orders field
  return customer;
});

const INITIAL: Group = {
  id: 'root',
  kind: 'group',
  op: 'AND',
  children: [
    { id: 'r1', kind: 'rule', field: 'country', operator: 'eq', value: 'Germany' },
    {
      id: 'g1',
      kind: 'group',
      op: 'OR',
      children: [
        { id: 'r2', kind: 'rule', field: 'orders', operator: 'gt', value: 10 },
        { id: 'r3', kind: 'rule', field: 'plan', operator: 'in', value: ['pro', 'team'] },
      ],
    },
  ],
};

let idCounter = 0;
const newId = () => `node-${++idCounter}`;

export default function Demo() {
  const [history, setHistory] = useState<Group[]>([INITIAL]);
  const value = history[history.length - 1];

  const onChange = (next: Group) => setHistory((h) => [...h, next]);
  const undo = () => setHistory((h) => (h.length > 1 ? h.slice(0, -1) : h));
  const reset = () => setHistory([INITIAL]);

  return (
    <div className="demo">
      <h2>Audience Segment Builder</h2>
      <p className="demo-note">
        Implement <code>evaluate</code>, <code>countMatches</code>, <code>operatorsForType</code> and{' '}
        <code>SegmentBuilder</code> in <code>segment_builder.tsx</code>. The parent owns the tree and passes it
        back in; every edit arrives through <code>onChange</code> and is pushed onto an undo stack. Change a
        field and watch the operator list and value control adapt; toggle <em>Match all / Match any</em>; the
        status line recounts the 60 sample customers on every render (every 9th customer has no{' '}
        <code>orders</code> field, so <em>Orders does not equal 0</em> excludes them).
      </p>
      <div className="demo-stage">
        <div className="demo-controls">
          <button onClick={undo} disabled={history.length <= 1}>
            Undo ({history.length - 1})
          </button>
          <button onClick={reset}>Reset</button>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', flexWrap: 'wrap', marginTop: '1rem' }}>
          <div style={{ flex: '2 1 420px' }}>
            <SegmentBuilder value={value} onChange={onChange} fields={FIELDS} customers={CUSTOMERS} newId={newId} />
          </div>
          <pre style={{ flex: '1 1 260px', fontSize: '0.75rem', margin: 0, maxHeight: 480, overflow: 'auto' }}>
            {JSON.stringify(value, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}
