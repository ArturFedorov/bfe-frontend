import FileExplorer from './FileExplorer';

/**
 * Demo harness for File Explorer.
 *
 * Tweak the sample props below as you build the component out. This file is
 * auto-discovered by the playground router (../../src/App.tsx).
 */
export default function App() {
  return (
    <div className="demo">
      <h2>File Explorer</h2>
      <p className="demo-note">
        Implement <code>FileExplorer</code> in <code>FileExplorer.tsx</code>. The full
        requirements live in this folder&apos;s <code>README.md</code>.
      </p>
      <div className="demo-stage">
        <FileExplorer />
      </div>
    </div>
  );
}
