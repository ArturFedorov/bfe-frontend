import { useReducer } from 'react';
import { initialWizardState, wizardReducer, type WizardStep } from './wizard_reducer';

/**
 * Demo harness for the wizard reducer — auto-discovered by the playground
 * (playground/App.tsx). The reducer is the task; this harness only wires it
 * to a step indicator, fields, and Back/Next/Submit buttons.
 */

const STEPS: readonly WizardStep[] = ['company', 'contacts', 'review', 'submitted'];

export default function Demo() {
  const [state, dispatch] = useReducer(wizardReducer, initialWizardState);
  const { step, data } = state;

  return (
    <div className="demo">
      <h2>Wizard Reducer</h2>
      <p className="demo-note">
        Implement <code>wizardReducer</code> in <code>wizard_reducer.ts</code>. Illegal
        transitions must be silent no-ops — try clicking Next with a blank field, Back on the
        first step, or Submit before review: nothing should happen and nothing should crash.
      </p>
      <div className="demo-stage">
        <ol style={{ display: 'flex', gap: '0.75rem', listStyle: 'none', padding: 0, margin: 0 }}>
          {STEPS.map((s) => (
            <li
              key={s}
              style={{
                padding: '0.25rem 0.6rem',
                borderRadius: 999,
                background: s === step ? '#fee2e2' : '#f3f4f6',
                color: s === step ? '#b91c1c' : '#6b7280',
                fontWeight: s === step ? 600 : 400,
                fontSize: '0.85rem',
              }}
            >
              {s}
            </li>
          ))}
        </ol>

        <div style={{ marginTop: '1rem' }}>
          {step === 'company' && (
            <label>
              Company name{' '}
              <input
                value={data.companyName}
                onChange={(e) =>
                  dispatch({ type: 'setField', field: 'companyName', value: e.target.value })
                }
              />
            </label>
          )}
          {step === 'contacts' && (
            <label>
              Contact email{' '}
              <input
                value={data.contactEmail}
                onChange={(e) =>
                  dispatch({ type: 'setField', field: 'contactEmail', value: e.target.value })
                }
              />
            </label>
          )}
          {step === 'review' && (
            <dl>
              <dt>Company</dt>
              <dd>{data.companyName || <em>(blank)</em>}</dd>
              <dt>Contact</dt>
              <dd>{data.contactEmail || <em>(blank)</em>}</dd>
            </dl>
          )}
          {step === 'submitted' && (
            <p>
              Submitted <strong>{data.companyName}</strong> ({data.contactEmail}). This state is
              terminal — every button below is now a no-op.
            </p>
          )}
        </div>

        <div className="demo-controls">
          <button onClick={() => dispatch({ type: 'back' })}>Back</button>
          <button onClick={() => dispatch({ type: 'next' })}>Next</button>
          <button onClick={() => dispatch({ type: 'submit' })}>Submit</button>
        </div>

        <pre style={{ marginTop: '1rem', fontSize: '0.8rem', color: '#6b7280' }}>
          {JSON.stringify(state, null, 2)}
        </pre>
      </div>
    </div>
  );
}
