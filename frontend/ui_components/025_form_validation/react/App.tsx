import FormValidation from './FormValidation';

/**
 * Demo harness for Form with Validation.
 *
 * Tweak the sample props below as you build the component out. This file is
 * auto-discovered by the playground router (../../src/App.tsx).
 */
export default function App() {
  return (
    <div className="demo">
      <h2>Form with Validation</h2>
      <p className="demo-note">
        Implement <code>FormValidation</code> in <code>FormValidation.tsx</code>. The full
        requirements live in this folder&apos;s <code>README.md</code>.
      </p>
      <div className="demo-stage">
        <FormValidation />
      </div>
    </div>
  );
}
