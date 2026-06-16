import FormWizard from './FormWizard';

/**
 * Demo harness for Form Wizard.
 *
 * Tweak the sample props below as you build the component out. This file is
 * auto-discovered by the playground router (../../src/App.tsx).
 */
export default function App() {
  return (
    <div className="demo">
      <h2>Form Wizard</h2>
      <p className="demo-note">
        Implement <code>FormWizard</code> in <code>FormWizard.tsx</code>. The full
        requirements live in this folder&apos;s <code>README.md</code>.
      </p>
      <div className="demo-stage">
        <FormWizard />
      </div>
    </div>
  );
}
