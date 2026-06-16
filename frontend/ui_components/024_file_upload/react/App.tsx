import FileUpload from './FileUpload';

/**
 * Demo harness for File Upload with Preview.
 *
 * Tweak the sample props below as you build the component out. This file is
 * auto-discovered by the playground router (../../src/App.tsx).
 */
export default function App() {
  return (
    <div className="demo">
      <h2>File Upload with Preview</h2>
      <p className="demo-note">
        Implement <code>FileUpload</code> in <code>FileUpload.tsx</code>. The full
        requirements live in this folder&apos;s <code>README.md</code>.
      </p>
      <div className="demo-stage">
        <FileUpload />
      </div>
    </div>
  );
}
