/**
 * Demo-only stand-in for the "heavy" admin panel chunk — loaded via a real
 * dynamic import() from demo.tsx so the playground build actually code-splits
 * it. Not part of the task.
 */
export default function HeavyAdminPanel() {
  return (
    <div
      style={{
        marginTop: '1rem',
        border: '1px solid #e5e7eb',
        borderRadius: 8,
        padding: '1rem 1.25rem',
        background: '#f0fdf4',
      }}
    >
      <h3 style={{ marginTop: 0 }}>Admin panel</h3>
      <p style={{ marginBottom: 0 }}>
        Pretend these are the heavy charts, editors and the permissions grid — this chunk arrived
        via a dynamic import roughly one second after it was requested.
      </p>
    </div>
  );
}
