/**
 * Autocomplete — React implementation.
 *
 * TODO: Replace this placeholder with a real implementation that satisfies the
 * requirements in ../README.md. Build it idiomatically with hooks (useState,
 * useEffect with cleanup, useRef, etc.). Keep the exported props stable so the
 * demo harness in App.tsx keeps rendering.
 */
export interface AutocompleteProps {
  // TODO: declare the props this component needs.
}

export default function Autocomplete(_props: AutocompleteProps) {
  return (
    <div
      style={{
        border: '2px dashed #c0c4cc',
        borderRadius: 8,
        padding: '2rem',
        textAlign: 'center',
        color: '#6b7280',
      }}
    >
      <strong>Autocomplete</strong>
      <p style={{ margin: '0.5rem 0 0' }}>
        Not implemented yet — build me in <code>Autocomplete.tsx</code>.
      </p>
    </div>
  );
}
