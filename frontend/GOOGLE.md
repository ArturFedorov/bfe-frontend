# Google Frontend Interview — Question Bank

> Compiled from confirmed Google interview reports, GreatFrontEnd, Front End Interview Handbook, and Glassdoor submissions (2024–2026).
> Organized by round type to match Google's actual interview structure:
> **2 DSA + 1 Frontend + 1 System Design + 1 Behavioral**

---

## Category 1: JavaScript Polyfills & Utilities

*"Implement X from scratch" — tests if you understand what your tools actually do*

| # | Task | Difficulty | Frequency |
|---|------|-----------|-----------|
| P1 | `Array.prototype.map` | Easy | Very High |
| P2 | `Array.prototype.filter` | Easy | Very High |
| P3 | `Array.prototype.reduce` | Medium | Very High |
| P4 | `Array.prototype.flat(depth)` | Medium | High |
| P5 | `Array.prototype.find` / `findIndex` | Easy | Medium |
| P6 | `Array.prototype.some` / `every` | Easy | Medium |
| P7 | `Function.prototype.bind` | Medium | Very High |
| P8 | `Function.prototype.call` / `apply` | Medium | High |
| P9 | `Promise.all` | Medium | Very High |
| P10 | `Promise.race` | Medium | High |
| P11 | `Promise.allSettled` | Medium | Medium |
| P12 | `Promise.any` | Medium | Medium |
| P13 | Custom `Promise` implementation (basic) | Hard | Medium |
| P14 | `debounce` (with leading/trailing options) | Medium | Very High |
| P15 | `throttle` (with leading/trailing options) | Medium | Very High |
| P16 | `once` (function runs only once) | Easy | High |
| P17 | `memoize` (with custom key support) | Medium | High |
| P18 | `curry` / partial application | Medium | High |
| P19 | `deepClone` (handle cycles, Date, RegExp, Map, Set) | Hard | High |
| P20 | `deepEqual` | Medium | Medium |
| P21 | `JSON.stringify` | Hard | Medium |
| P22 | `JSON.parse` (recursive descent parser) | Hard | Medium |
| P23 | `Object.assign` (shallow) | Easy | Medium |
| P24 | `Object.create` | Medium | Medium |
| P25 | `Object.keys` / `Object.values` / `Object.entries` | Easy | Low |
| P26 | `EventEmitter` (.on, .off, .once, .emit) | Medium | Very High |
| P27 | `String.prototype.trim` | Easy | Low |
| P28 | `setInterval` using `setTimeout` | Easy | High |
| P29 | `clearAllTimers` | Easy | Medium |
| P30 | `Array.prototype.flat` without recursion (stack-based) | Medium | Medium |

---

## Category 2: Vanilla UI Components

*Build in HTML/CSS/JS with no frameworks — this IS the Google frontend round*

| # | Task | Difficulty | Frequency | Notes |
|---|------|-----------|-----------|-------|
| U1 | Autocomplete / typeahead | Hard | Very High | Most asked UI component |
| U2 | Color swatch picker with slider | Medium | High | Confirmed asked (2025) |
| U3 | Nested/indeterminate checkboxes | Medium | High | Confirmed asked |
| U4 | Tic-Tac-Toe game | Medium | High | Confirmed asked |
| U5 | Infinite scroll / auto-loading posts | Medium | High | Confirmed asked |
| U6 | Image carousel | Medium | High | |
| U7 | Tooltip component | Medium | Medium | |
| U8 | Modal / dialog with focus trap | Medium | Medium | Accessibility focus |
| U9 | Drag-and-drop sortable list | Hard | Medium | Pointer events |
| U10 | Star rating component | Easy | Medium | |
| U11 | Accordion / collapsible sections | Easy | Medium | |
| U12 | Tab component with keyboard nav | Medium | Medium | |
| U13 | Slider / range input component | Medium | High | |
| U14 | Dynamic table from row/column input | Medium | High | Confirmed asked |
| U15 | Progress bar with animation | Easy | Medium | |
| U16 | File explorer / tree view | Hard | Medium | Recursive DOM |
| U17 | Stopwatch with start/stop/lap/reset | Medium | Medium | |
| U18 | Form with multi-step wizard | Medium | Medium | |
| U19 | Calendar date picker | Hard | Medium | |
| U20 | Spreadsheet (basic grid with formulas) | Hard | Low | Senior only |

---

## Category 3: DOM & Browser API Tasks

*Tests whether you actually understand the platform, not just the framework*

| # | Task | Difficulty | Frequency |
|---|------|-----------|-----------|
| D1 | Implement `document.getElementsByClassName` | Medium | High |
| D2 | Implement `document.getElementsByTagName` | Medium | High |
| D3 | Implement `document.querySelector` (basic) | Hard | Medium |
| D4 | Implement event delegation system | Medium | Very High |
| D5 | Flatten a nested DOM tree to an array | Medium | Medium |
| D6 | Serialize/deserialize a DOM tree to JSON | Hard | Medium |
| D7 | Virtual DOM diffing (simplified) | Hard | Medium |
| D8 | `MutationObserver`-based change detector | Medium | Low |
| D9 | Implement `requestAnimationFrame` throttle | Medium | Medium |
| D10 | Build a DOM-like tree structure from scratch | Medium | High |

---

## Category 4: Async & Concurrency Patterns

| # | Task | Difficulty | Frequency |
|---|------|-----------|-----------|
| A1 | Async task runner with concurrency limit | Hard | High |
| A2 | Retry with exponential backoff | Medium | High |
| A3 | Cancelable promise / AbortController wrapper | Medium | Medium |
| A4 | Implement `sleep(ms)` | Easy | Medium |
| A5 | Sequential vs parallel promise execution | Medium | High |
| A6 | Lazy/deferred promise | Medium | Medium |
| A7 | Streaming API with generators | Medium | High |
| A8 | File system API with generators | Medium | High |
| A9 | Rate limiter (token bucket in JS) | Hard | Medium |
| A10 | Batch async requests (group N requests) | Medium | Medium |

---

## Category 5: JavaScript Conceptual / Output Questions

*"What does this print?" — tests deep language knowledge*

| # | Topic | Difficulty | Frequency |
|---|-------|-----------|-----------|
| C1 | `var` vs `let` in loops with closures | Medium | Very High |
| C2 | `this` binding — arrow vs regular functions | Medium | Very High |
| C3 | Promise execution order vs setTimeout | Medium | High |
| C4 | Prototype chain — `instanceof`, `__proto__` | Medium | High |
| C5 | Hoisting — `var`, `function`, `let`, `class` | Medium | High |
| C6 | Event loop — microtask vs macrotask ordering | Medium | High |
| C7 | Coercion traps — `==` vs `===`, `+` operator | Easy | Medium |
| C8 | `typeof null`, `typeof NaN`, `NaN === NaN` | Easy | Medium |
| C9 | IIFE scope and variable shadowing | Medium | Medium |
| C10 | Generator `yield` execution order | Medium | Medium |
| C11 | `async/await` error propagation | Medium | High |
| C12 | WeakMap/WeakRef garbage collection behavior | Medium | Low |

---

## Category 6: Frontend System Design (L5 Round)

*35–45 min design discussion — architecture, API design, state management, performance, accessibility, i18n*

| # | Task | Difficulty | Frequency | Key Focus Areas |
|---|------|-----------|-----------|-----------------|
| S1 | Design a News Feed | Hard | Very High | Infinite scroll, pagination, optimistic updates |
| S2 | Design a Chat Application | Hard | Very High | WebSocket vs polling, message ordering, offline |
| S3 | Design Google Docs (collaborative editor) | Hard | High | OT vs CRDT, cursor presence, conflict resolution |
| S4 | Design an Email Client | Hard | High | List virtualization, thread view, offline cache |
| S5 | Design Emoji Autocomplete | Medium | High | Trie, debounce, keyboard nav, skin tone variants |
| S6 | Design Google Analytics SDK | Hard | High | Beacon API, batching, sampling, error handling |
| S7 | Design JS Bin / CodeSandbox | Hard | Medium | iframe sandboxing, eval, code editor integration |
| S8 | Design an Image Gallery (Google Photos) | Medium | High | Lazy loading, responsive grid, virtualization |
| S9 | Design a Kanban Board (Trello) | Medium | Medium | Drag-and-drop state, optimistic updates, sync |
| S10 | Design a Calendar App | Hard | Medium | Time zone handling, recurring events, drag resize |
| S11 | Design a Video Player | Medium | Medium | Adaptive bitrate, buffering, controls, a11y |
| S12 | Design a Notification System | Medium | Medium | Push vs pull, priority queue, badge counts |

### System Design Framework (for L5)

```
1. Requirements (functional + non-functional)
2. Component Architecture (diagram)
3. Data Model / State Shape
4. API Design (REST/GraphQL/WebSocket)
5. Rendering Strategy (CSR/SSR/Streaming)
6. Performance (code splitting, caching, virtualization)
7. Accessibility & i18n
8. Error Handling & Offline Support
9. Trade-offs Discussion
```

---

## Category 7: Web Security

| # | Topic | Difficulty | Frequency | What They Ask |
|---|-------|-----------|-----------|---------------|
| W1 | XSS — Stored, Reflected, DOM-based | Medium | High | Identify vulnerability in code + fix |
| W2 | CSRF / XSRF | Medium | High | Explain attack vector + token prevention |
| W3 | CORS | Medium | High | Preflight, same-origin policy, workarounds |
| W4 | Content Security Policy (CSP) | Medium | Medium | Header configuration |
| W5 | Cookie security — HttpOnly, Secure, SameSite | Medium | Medium | When to use which flag |
| W6 | JWT vs Session — security tradeoffs | Medium | Medium | Token storage, refresh flow |
| W7 | Clickjacking / iframe protection | Easy | Low | X-Frame-Options, CSP frame-ancestors |
| W8 | Subresource Integrity (SRI) | Easy | Low | CDN trust, hash verification |

---

## Category 8: Performance & Rendering

| # | Topic | Difficulty | Frequency |
|---|-------|-----------|-----------|
| X1 | Critical Rendering Path (Parse → Style → Layout → Paint → Composite) | Medium | High |
| X2 | Reflow vs Repaint — what triggers each | Medium | High |
| X3 | Core Web Vitals — LCP, INP, CLS | Medium | Medium |
| X4 | Code splitting & lazy loading strategies | Medium | Medium |
| X5 | Tree shaking — how it works, what breaks it | Medium | Medium |
| X6 | Service Workers & caching strategies | Medium | Medium |
| X7 | Web Workers for CPU-intensive tasks | Medium | Medium |
| X8 | `requestAnimationFrame` vs `setTimeout` for animation | Medium | High |
| X9 | Layout thrashing — causes and prevention | Medium | Medium |
| X10 | Resource hints — preload, prefetch, preconnect | Easy | Medium |

---

## Category 9: CSS Deep Dive

| # | Topic | Difficulty | Frequency |
|---|-------|-----------|-----------|
| Y1 | Box Model — `border-box` vs `content-box` | Easy | High |
| Y2 | `position` values — static, relative, absolute, fixed, sticky | Easy | High |
| Y3 | Flexbox vs Grid — when to use which | Easy | Medium |
| Y4 | CSS specificity calculation rules | Easy | Medium |
| Y5 | Block Formatting Context (BFC) | Medium | Medium |
| Y6 | CSS `contain` property for performance | Medium | Low |
| Y7 | CSS animations vs JS animations — tradeoffs | Medium | Medium |
| Y8 | Responsive design — media queries vs container queries | Easy | Medium |
| Y9 | `z-index` stacking context rules | Medium | Medium |
| Y10 | CSS-in-JS vs CSS Modules vs utility-first — tradeoffs | Easy | Low |

---

## Category 10: HTML & Accessibility

| # | Topic | Difficulty | Frequency |
|---|-------|-----------|-----------|
| Z1 | Semantic HTML — `<article>`, `<section>`, `<nav>`, `<main>` | Easy | Medium |
| Z2 | ARIA roles, states, and properties | Medium | Medium |
| Z3 | Focus management & tab order | Medium | High |
| Z4 | Screen reader testing — what to look for | Medium | Medium |
| Z5 | Keyboard navigation patterns | Medium | High |
| Z6 | Form accessibility — labels, fieldsets, error messages | Easy | Medium |
| Z7 | Color contrast requirements (WCAG 4.5:1) | Easy | Low |
| Z8 | `<dialog>` element vs custom modal | Easy | Medium |

---

## Priority Order for Google L5 Frontend

Based on confirmed interview frequency and round structure:

### Must-Know (Week 1–2)
- P7, P9, P14, P15 (Promise.all, debounce, throttle)
- P7 bind, P26 EventEmitter
- U1 Autocomplete, U3 Nested checkboxes, U5 Infinite scroll
- C1–C6 (output questions)
- D4 Event delegation

### High Priority (Week 3–4)
- P1–P4 (Array polyfills)
- P16–P19 (deepClone, memoize, curry)
- U2 Color swatch, U4 Tic-Tac-Toe, U6 Carousel
- S1 News Feed, S2 Chat App
- W1–W3 (XSS, CSRF, CORS)

### Important (Week 5–6)
- A1 Concurrency limiter, A2 Retry with backoff
- U8 Modal, U9 Drag-and-drop, U16 File explorer
- S3 Collaborative editor, S6 Analytics SDK
- X1–X2 Critical rendering path, reflow/repaint
- Z3, Z5 Focus management, keyboard nav

### Good to Have (Week 7–8)
- P21–P22 (JSON.stringify/parse)
- D5–D7 (DOM serialize, virtual DOM diff)
- S7–S12 (remaining system design)
- X5–X9 (advanced performance)
- Y5–Y9 (advanced CSS)

---

## Lesson Curriculum Mapping

| Lesson | Topic | Questions Covered |
|--------|-------|-------------------|
| F1 | Closures & Scope | C1, C9, P16, P17 |
| F2 | Prototypal Inheritance & `this` | C2, C4, P24 |
| F3 | Promises & Async Patterns | P9–P13, C3, A4, A5 |
| F4 | Event Loop & Microtasks | C3, C6, P14, P15, P28 |
| F5 | Iterators, Generators & Proxy | C10, A7, A8 |
| F6 | DOM Traversal & Manipulation | D1–D3, D5, D10 |
| F7 | Event System | D4, P26 |
| F8 | Build: Autocomplete | U1 |
| F9 | Build: Drag & Drop | U9 |
| F10 | Build: Virtual Scroll | U5 |
| F11 | Array method polyfills | P1–P6, P30 |
| F12 | Function polyfills | P7, P8, P18 |
| F13 | JSON.parse / JSON.stringify | P21, P22 |
| F14 | deepClone / deepEqual | P19, P20 |
| F15 | EventEmitter / Observable | P26 |
| F16 | XSS | W1, W4 |
| F17 | CSRF & CORS | W2, W3 |
| F18 | HTTP deep dive | W5, W6 |
| F19 | Authentication | W6, W7 |
| F20 | Design: News Feed | S1 |
| F21 | Design: Chat App | S2 |
| F22 | Design: Collaborative Editor | S3 |
| F23 | Design: Image Gallery | S8 |
| F24 | Design: Google Docs Toolbar | S6, S7 |
| F25 | Critical Rendering Path | X1, X2, X8, X9 |
| F26 | Performance Optimization | X3–X7, X10 |
| F27 | Accessibility | Z1–Z8 |
| F28 | Internationalization | — |