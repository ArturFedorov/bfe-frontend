# 031. Error Boundary

**Difficulty:** Medium
**Topics:** Class Components, Error Boundaries, Render Props, Lifecycle

---

## Scenario

One malformed partner record used to white-screen the entire integration
dashboard — one widget's render threw and took the whole tree down. Build the
`ErrorBoundary` that wraps each dashboard widget: it shows a fallback (as a
render prop receiving the error and a `reset` function), recovers when the
user retries, and also auto-recovers when a `resetKey` changes (e.g. the user
navigates to a different partner, so the crashed state is no longer relevant).

**Why a class?** Error boundaries are the one remaining class-only feature:
catching a render error requires the `static getDerivedStateFromError` /
`componentDidCatch` lifecycle pair, and React provides no hook equivalent —
there is no `useErrorBoundary`. A function component has no way to intercept a
throw from its children's render phase; hooks run *inside* the render that is
throwing. So this component must be a `class extends Component`.

## Acceptance Criteria

- Renders `children` normally when nothing has thrown.
- When a descendant throws during render, catches it via
  `static getDerivedStateFromError` and renders `fallback({ error, reset })`
  instead of the broken subtree.
- The `fallback` render prop receives the original `Error` object and a
  `reset` function; calling `reset` clears the error state and re-renders
  `children` (a fresh mount of the subtree).
- When the `resetKey` prop changes while in the error state, the boundary
  clears the error automatically (compare in `componentDidUpdate`). A
  `resetKey` change without an error does nothing special.
- Calls the optional `onError(error, errorInfo)` callback when it catches
  (via `componentDidCatch`) — the logging hook.
- Errors thrown **outside** the render/lifecycle phase — e.g. inside a child's
  event handler — are NOT caught: the children stay rendered and the fallback
  never appears. (This mirrors React's actual boundary semantics.)

## Example

```tsx
<ErrorBoundary
  resetKey={partnerId}
  onError={logToSentry}
  fallback={({ error, reset }) => (
    <div role="alert">
      <p>Widget failed: {error.message}</p>
      <button onClick={reset}>Try again</button>
    </div>
  )}
>
  <PartnerHealthWidget partnerId={partnerId} />
</ErrorBoundary>
```

## Target

- `class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState>`
- `ErrorBoundaryFallbackProps`: `{ error: Error; reset: () => void }`
- `ErrorBoundaryProps`: `{ children: ReactNode; fallback: (props: ErrorBoundaryFallbackProps) => ReactNode; resetKey?: unknown; onError?: (error: Error, errorInfo: ErrorInfo) => void }`
- `ErrorBoundaryState`: `{ error: Error | null }`

## Interviewer follow-up

Event-handler errors bypass boundaries. If the team wants *all* widget errors
— including ones from `onClick` handlers and rejected promises — to show this
fallback, what pattern gets you there (hint: `useState` can rethrow into the
render phase), and what are the trade-offs versus a global `window.onerror`
handler?
