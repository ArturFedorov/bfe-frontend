# Shared test helpers

Imported by the Tier 4 (074–091) test suites. Not part of any task.

| File | Provides |
| --- | --- |
| `deferred.ts` | `deferred<T>()` — promise with exposed resolve/reject; `flush()` |
| `fake_readable_stream.ts` | `streamFromChunks`, `controllableStream`, `encode`, `splitBytes`; installs `ReadableStream`/`TextEncoder`/`TextDecoder` globals for jsdom |
| `fake_event_source.ts` | `FakeEventSource` with `open()`, `emit()`, `error()`, `FakeEventSource.latest`; `installFakeEventSource()` / `restoreEventSource()` |
| `fake_observers.ts` | `FakeIntersectionObserver`, `FakeResizeObserver` with `trigger()`, `setElementSize()`; `installFakeObservers()` / `restoreObservers()` |
