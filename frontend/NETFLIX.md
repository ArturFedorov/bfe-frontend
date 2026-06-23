# Netflix JavaScript Foundations — Interview Prep

> **Role:** Software Engineer 4, JavaScript Foundations — Warsaw
> **Team:** JSF (JavaScript Foundations) within JavaScript Platform org
> **What they build:** Developer experience — dependency management, supply chain security, TypeScript standards, Node.js LTS migrations, "UI Paved Road"
> **Their product:** Not an app — the DX for every UI engineer at Netflix
> **Source:** Official Netflix JSF Interview Preparation Guide (Feb 2026) + JD

---

## What Netflix Told You Directly

From the official prep guide:

> "We won't be doing LeetCode in this role."
> "Questions like 'Design Netflix' are not particularly interesting to us. We care more about JavaScript-related architectures, e.g. Package design or API design."
> "Don't go too deep. These are just pointers — it's more about general understanding."

**L4 expectations from the guide:**
1. **Autonomy and Proactiveness** — translate team/project goals into actions and results
2. **Technical Proficiency** — code, architecture, documentation, understanding scale
3. **Customer & Cross-Functional Collaboration** — work with PMs, program managers, customer groups
4. **Clear Communication** — one of your most important tools
5. **Comfortable with disagreement** — public disagreement, both giving and receiving

---

## Interview Structure

Based on the prep guide + confirmed Netflix SWE reports:

### 1. Recruiter Screen (30 min)
Background, motivation, Netflix culture values alignment.

### 2. Technical Phone Screen (45–60 min)
Live coding on CoderPad. Practical task tied to what the team builds — expect dependency analysis, tooling, or JS ecosystem tasks.

### 3. Hiring Manager Interview (45–60 min)
Past work, cultural alignment, fit with JSF specifically.

### 4. Virtual Onsite (~8 rounds, split over 2 days)
- Technical coding rounds (practical, team-related)
- JavaScript architecture / API design rounds (NOT "Design Netflix" type)
- Behavioral / cultural rounds (Netflix Culture Memo heavy)
- 1-2 director interviews (reduces bias)

---

## What This Team Actually Does

From the JD:

1. **Dependency management** — defining how Netflix manages npm packages across thousands of services
2. **Supply chain security** — scanning, auditing, blocking vulnerable/malicious packages
3. **TypeScript standards** — evolving TypeScript practices company-wide
4. **Node.js LTS migrations** — automating annual LTS migrations for thousands of services
5. **Code sharing patterns** — how code is shared across browser + server
6. **Libraries, tools, workflows** — building abstractions that make JS developers productive
7. **Community engagement** — reconciling internal needs with external JS ecosystem trends

**Critical quote from the JD:** "Code is a very small slice of this team's impact."

---

## Technical Areas (from the official prep guide)

The guide explicitly lists these topics to review. **You don't need to be an expert in all of them**, but you should be familiar.

### Priority 1 — Explicitly Listed

| # | Area | What to Know | Prep Guide Quote |
|---|------|-------------|-----------------|
| T1 | **SDLC: Bundling** | How bundlers work (Webpack, Vite, esbuild, Rollup), why we use them, trade-offs | "It's good to understand how these tools work and why we use them" |
| T2 | **SDLC: Task Runners** | npm scripts, how task runners resolve dependencies between tasks | Same |
| T3 | **SDLC: Linting** | How ESLint works, writing custom rules, config inheritance | Same |
| T4 | **SDLC: Transpilers** | Babel, SWC, TypeScript compilation, source maps | Same |
| T5 | **SDLC: Monorepos** | Workspace management, dependency hoisting, affected detection, Nx/Turborepo | "Managing monorepos" |
| T6 | **SDLC: CI/CD** | Pipelines for JavaScript, testing in CI, deployment strategies | "CI/CD pipelines for JavaScript" |
| T7 | **TypeScript** | Generics, Utility Types (Pick, Omit, Partial), type narrowing, beyond basic interfaces | "Move beyond basic interfaces" |
| T8 | **Dependency Management** | How package managers differ, versioning, publishing, peerDeps vs deps vs devDeps, security | "Not only from the perspective of a user, but also from the package publisher" |
| T9 | **Node.js** | Event loop, streams, buffers | "Understanding basics like the event loop, streams, and buffers" |
| T10 | **Testing Strategies** | Testing pyramid vs trophy, unit vs integration, JS testing tooling, limitations | "How do you decide what requires a unit test versus an integration test?" |

### Priority 2 — "Good to Be Aware Of"

| # | Area | What to Know | Prep Guide Quote |
|---|------|-------------|-----------------|
| T11 | **Developer Experience / API Design** | How other engineers interface with tools you build | "Think about basics of API design" |
| T12 | **Performance: JS/Node.js** | Debugging, profiling, typical performance issues | "Knowing what are typical issues with performance and how to solve them" |
| T13 | **Browser Runtime** | Caching strategies, security, critical rendering path | "Since one of our main goals is to cater to UI engineers" |
| T14 | **Core Web Vitals** | LCP, INP, CLS metrics | Explicitly listed |
| T15 | **Real User Monitoring (RUM)** | How RUM works, what it measures | Explicitly listed |
| T16 | **CDN Mechanics** | How CDNs work, caching, invalidation | Explicitly listed |

---

## Recommended Solve Order (by interview likelihood)

| Order | Task # | Task | Tier |
|-------|--------|------|------|
| 1 | N1 | Semver parser | Tier 1 — Almost Certain |
| 2 | N2 | Semver comparator | Tier 1 |
| 3 | N3 | Semver range matcher | Tier 1 |
| 4 | N7 | Dependency version resolver | Tier 1 |
| 5 | N4 | Dependency graph builder | Tier 1 |
| 6 | N9 | Phantom dependency detector | Tier 1 |
| 7 | N8 | Lockfile differ | Tier 1 |
| 8 | N56 | Type narrowing exercises | Tier 1 |
| 9 | N49 | Implement `Pick<T, K>` | Tier 1 |
| 10 | N50 | Implement `Omit<T, K>` | Tier 1 |
| 11 | N53 | Type-safe EventEmitter | Tier 1 |
| 12 | N51 | Implement `DeepPartial<T>` | Tier 1 |
| 13 | N34 | EventEmitter | Tier 1 |
| 14 | N35 | Streaming file processor | Tier 1 |
| 15 | N39 | Async task queue with concurrency | Tier 1 |
| 16 | N15 | Implement `require()` | Tier 1 |
| 17 | N61 | ESLint rule builder | Tier 2 — High Probability |
| 18 | N30 | Config extends resolver | Tier 2 |
| 19 | N17 | Dual package builder | Tier 2 |
| 20 | N18 | Package.json exports resolver | Tier 2 |
| 21 | N27 | Task runner | Tier 2 |
| 22 | N19 | Simplified module bundler | Tier 2 |
| 23 | N57 | Test harness | Tier 2 |
| 24 | N58 | Mock function | Tier 2 |
| 25 | N10 | Vulnerability scanner | Tier 2 |
| 26 | N11 | License checker | Tier 2 |
| 27 | N12 | Typosquatting detector | Tier 2 |
| 28 | N13 | Package integrity verifier | Tier 2 |
| 29 | N65 | Fluent API builder | Tier 3 — Likely |
| 30 | N25 | CLI argument parser | Tier 3 |
| 31 | N66 | Error boundary with context | Tier 3 |
| 32 | N38 | Plugin system | Tier 3 |
| 33 | N20 | Dead export finder | Tier 3 |
| 34 | N22 | Find-and-replace codemod | Tier 3 |
| 35 | N21 | Import sorter | Tier 3 |
| 36 | N40 | Package publish validator | Tier 3 |
| 37 | N48 | Breaking change detector | Tier 3 |
| 38 | N42 | Version bump calculator | Tier 3 |
| 39 | N5 | Circular dependency detector | Tier 4 — Possible |
| 40 | N6 | Transitive dependency finder | Tier 4 |
| 41 | N14 | Dependency diff reporter | Tier 4 |
| 42 | N16 | Module resolution tracer | Tier 4 |
| 43 | N44 | Monorepo workspace resolver | Tier 4 |
| 44 | N45 | Migration script runner | Tier 4 |
| 45 | N47 | Node.js version compatibility checker | Tier 4 |
| 46 | N37 | Worker pool | Tier 4 |
| 47 | N36 | HTTP server with middleware | Tier 4 |
| 48 | N52 | Implement `DeepReadonly<T>` | Tier 4 |
| 49 | N54 | Type-safe builder pattern | Tier 4 |
| 50 | N55 | Conditional type parser | Tier 4 |
| 51 | N59 | Spy on object method | Tier 4 |
| 52 | N60 | Snapshot testing | Tier 4 |
| 53 | N62 | Source map parser | Tier 4 |
| 54 | N63 | CI pipeline config generator | Tier 4 |
| 55 | N64 | Git hook runner | Tier 4 |
| 56 | N67 | Deprecation warning system | Tier 4 |
| 57 | N23 | Codemod engine | Tier 4 |
| 58 | N24 | API deprecation migrator | Tier 4 |
| 59 | N26 | File watcher with debounced rebuild | Tier 4 |
| 60 | N28 | Progress reporter | Tier 4 |
| 61 | N29 | Interactive prompt system | Tier 4 |
| 62 | N31 | ESLint config merger | Tier 4 |
| 63 | N32 | Schema validator | Tier 4 |
| 64 | N33 | Config migration tool | Tier 4 |
| 65 | N41 | Changelog generator | Tier 4 |
| 66 | N43 | Package health scorer | Tier 4 |
| 67 | N46 | Automated PR creator | Tier 4 |

**Focus:** Complete orders 1–28 (Tier 1 + 2) before the interview. 29–38 (Tier 3) if time permits.

---

## Category 1: Practical Coding Tasks (Phone Screen + Onsite)

Netflix doesn't ask abstract LeetCode. They ask you to build things related to what the team works on. For JSF, expect tasks from these sub-categories. Each is a standalone coding exercise (30–90 min).

### 1A — Semver & Dependency Resolution

| # | Task | Description | Difficulty | Status |
|---|------|------------|-----------|--------|
| N1 | Semver parser | Parse version strings (`1.2.3`, `1.2.3-beta.1`) into `{major, minor, patch, prerelease}` | Easy | ⬜ |
| N2 | Semver comparator | Implement `compare(a, b)` → `-1 / 0 / 1` and `gt()`, `lt()`, `eq()` | Easy | ⬜ |
| N3 | Semver range matcher | Implement `satisfies(version, range)` for `^`, `~`, `>=`, `<`, `||` | Medium | ⬜ |
| N4 | Dependency graph builder | Given a set of `package.json` objects, build a directed graph of all dependencies | Medium | ⬜ |
| N5 | Circular dependency detector | Traverse a dependency graph, detect and report all cycles | Medium | ⬜ |
| N6 | Transitive dependency finder | Given package A, find ALL packages it depends on (direct + transitive) | Medium | ⬜ |
| N7 | Dependency version resolver | Given a dependency tree with semver ranges, resolve to concrete versions (simplified npm install) | Hard | ⬜ |
| N8 | Lockfile differ | Compare two `package-lock.json` files, output added/removed/changed packages with version diffs | Medium | ⬜ |
| N9 | Phantom dependency detector | Scan code for `require()`/`import` calls, compare against `package.json` — flag packages used but not declared | Medium | ⬜ |

### 1B — Supply Chain Security

| # | Task | Description | Difficulty | Status |
|---|------|------------|-----------|--------|
| N10 | Vulnerability scanner | Given a dependency tree + CVE database (JSON), flag all affected packages with severity | Medium | ⬜ |
| N11 | License checker | Traverse all dependencies, extract license fields, flag incompatible licenses (e.g. GPL in MIT project) | Medium | ⬜ |
| N12 | Typosquatting detector | Given a package name, generate likely typosquat variants (swaps, missing chars, doubled chars) | Easy | ⬜ |
| N13 | Package integrity verifier | Compute SHA-512 hash of a tarball, compare against registry-reported integrity hash | Easy | ⬜ |
| N14 | Dependency diff reporter | Compare `node_modules` before/after an install, report new packages added with risk assessment | Medium | ⬜ |

### 1C — Module Systems & Resolution

| # | Task | Description | Difficulty | Status |
|---|------|------------|-----------|--------|
| N15 | Implement `require()` | Module resolution algorithm — `node_modules` lookup, caching, JSON loading, index.js fallback | Hard | ⬜ |
| N16 | Module resolution tracer | Given an import statement + filesystem, trace the full resolution path and explain each step | Medium | ⬜ |
| N17 | Dual package builder | Given a source file, output both CJS (`module.exports`) and ESM (`export`) versions | Medium | ⬜ |
| N18 | `package.json` exports resolver | Implement conditional exports resolution — match `"."`, `"./sub"`, conditions (`import`/`require`/`node`/`browser`) | Hard | ⬜ |
| N19 | Simplified module bundler | Resolve imports from entry point, build dependency graph, concatenate into single output file | Hard | ⬜ |

### 1D — Codemods & AST

| # | Task | Description | Difficulty | Status |
|---|------|------------|-----------|--------|
| N20 | Dead export finder | Parse files for `export` declarations, scan all files for matching `import` statements, report unused exports | Medium | ⬜ |
| N21 | Import sorter | Parse imports, group by type (node builtins → external → internal), sort alphabetically within groups | Medium | ⬜ |
| N22 | Find-and-replace codemod | Build with regex first, then rebuild with AST parser — compare approaches, discuss trade-offs | Medium | ⬜ |
| N23 | Codemod engine | Given an AST transform function, apply it across a directory of files, handle errors, report results | Hard | ⬜ |
| N24 | API deprecation migrator | Find all calls to `oldApi()`, rewrite to `newApi()` with argument transformation | Medium | ⬜ |

### 1E — CLI & Developer Tooling

| # | Task | Description | Difficulty | Status |
|---|------|------------|-----------|--------|
| N25 | CLI argument parser | Support flags (`--verbose`), named args (`--output=dist`), positional args, `--help` generation | Medium | ⬜ |
| N26 | File watcher with debounced rebuild | `fs.watch` on a directory, debounce changes, run a build command, report results | Medium | ⬜ |
| N27 | Task runner | Read tasks from a config, resolve task dependencies (topological sort), execute in parallel where possible | Hard | ⬜ |
| N28 | Progress reporter | Build a CLI progress bar + spinner for long-running operations with ETA calculation | Easy | ⬜ |
| N29 | Interactive prompt system | Build `confirm()`, `select()`, `multiSelect()` prompts for terminal using raw stdin | Medium | ⬜ |

### 1F — Config & Standards

| # | Task | Description | Difficulty | Status |
|---|------|------------|-----------|--------|
| N30 | Config extends resolver | Implement `tsconfig.json`-style `extends` — deep merge with override rules, resolve relative paths | Medium | ⬜ |
| N31 | ESLint config merger | Follow `extends` chains, merge rules with correct priority (last wins, per-rule overrides) | Medium | ⬜ |
| N32 | Schema validator | Given a JSON schema + config object, validate and return typed errors with paths | Medium | ⬜ |
| N33 | Config migration tool | Given old config format and new format spec, auto-migrate config files with dry-run mode | Medium | ⬜ |

### 1G — Node.js Internals & Patterns

| # | Task | Description | Difficulty | Status |
|---|------|------------|-----------|--------|
| N34 | EventEmitter | Implement `.on()`, `.off()`, `.once()`, `.emit()` — handle `.off()` during `.emit()` edge case | Medium | ⬜ |
| N35 | Streaming file processor | Read large files in chunks using Node.js streams, transform each chunk, pipe to output | Medium | ⬜ |
| N36 | HTTP server with middleware | Implement `use()`, `listen()`, request/response pipeline — Express-style middleware chaining | Medium | ⬜ |
| N37 | Worker pool | Distribute CPU-intensive tasks across `worker_threads`, collect results, handle failures, limit concurrency | Hard | ⬜ |
| N38 | Plugin system | Define plugin interface with lifecycle hooks (`init`, `transform`, `cleanup`), load dynamically, manage execution order | Medium | ⬜ |
| N39 | Async task queue with concurrency | Process tasks with configurable concurrency limit, retry on failure, report progress | Medium | ⬜ |

### 1H — Package Publishing & Registry

| # | Task | Description | Difficulty | Status |
|---|------|------------|-----------|--------|
| N40 | Package publish validator | Check: valid `package.json`, required fields present, no `postinstall` scripts, license OK, version not taken | Medium | ⬜ |
| N41 | Changelog generator | Parse git commits (conventional commits format), group by type, generate markdown changelog | Medium | ⬜ |
| N42 | Version bump calculator | Given current version + commit history, determine next version (major/minor/patch) per conventional commits | Medium | ⬜ |
| N43 | Package health scorer | Given package metadata (last publish date, open issues, download count, vulnerability count), compute health score | Easy | ⬜ |
| N44 | Monorepo workspace resolver | Discover packages from `workspaces` field, resolve inter-workspace dependencies, detect version mismatches | Medium | ⬜ |

### 1I — Migration & Automation

| # | Task | Description | Difficulty | Status |
|---|------|------------|-----------|--------|
| N45 | Migration script runner | Ordered execution, idempotency (track which migrations have run), rollback support, progress tracking | Medium | ⬜ |
| N46 | Automated PR creator | Given a list of repos + a transform function, apply changes, create branch, generate PR description | Medium | ⬜ |
| N47 | Node.js version compatibility checker | Parse `engines` field from `package.json`, check against target Node.js version, report incompatibilities | Easy | ⬜ |
| N48 | Breaking change detector | Compare two versions of a package's public API (exports), report removed/changed exports | Hard | ⬜ |

### 1J — TypeScript (NEW — from prep guide: "Move beyond basic interfaces")

| # | Task | Description | Difficulty | Status |
|---|------|------------|-----------|--------|
| N49 | Implement `Pick<T, K>` | Build the utility type from scratch using mapped types | Easy | ⬜ |
| N50 | Implement `Omit<T, K>` | Build using `Pick` + `Exclude` | Easy | ⬜ |
| N51 | Implement `DeepPartial<T>` | Recursively make all properties optional | Medium | ⬜ |
| N52 | Implement `DeepReadonly<T>` | Recursively make all properties readonly | Medium | ⬜ |
| N53 | Type-safe EventEmitter | Emit/on with event map generics — `emitter.on<'click'>((e: ClickEvent) => {})` | Medium | ⬜ |
| N54 | Type-safe builder pattern | Fluent API where methods chain and return narrowed types | Medium | ⬜ |
| N55 | Conditional type parser | Implement `ParseRoute<'/users/:id/posts/:postId'>` → `{id: string, postId: string}` | Hard | ⬜ |
| N56 | Type narrowing exercises | Discriminated unions, `in` operator, custom type guards, exhaustive switch | Medium | ⬜ |

### 1K — Testing (NEW — from prep guide: "Testing pyramid vs trophy")

| # | Task | Description | Difficulty | Status |
|---|------|------------|-----------|--------|
| N57 | Test harness | Implement minimal `describe()`, `it()`, `expect()` with matchers from scratch | Medium | ⬜ |
| N58 | Mock function | Implement `jest.fn()` — track calls, arguments, return values, mock implementations | Medium | ⬜ |
| N59 | Spy on object method | Implement `jest.spyOn()` — wrap a method, track calls, restore original | Medium | ⬜ |
| N60 | Snapshot testing | Implement `toMatchSnapshot()` — serialize, store, compare, update on flag | Medium | ⬜ |

### 1L — SDLC & CI/CD (NEW — from prep guide: "CI/CD pipelines for JavaScript")

| # | Task | Description | Difficulty | Status |
|---|------|------------|-----------|--------|
| N61 | ESLint rule builder | Write a custom ESLint rule that detects a specific pattern (e.g. no `console.log` in production code) | Medium | ⬜ |
| N62 | Source map parser | Parse a basic source map JSON, map a compiled position back to original source position | Medium | ⬜ |
| N63 | CI pipeline config generator | Given a monorepo structure, generate a CI config that only runs tests for affected packages | Medium | ⬜ |
| N64 | Git hook runner | Implement a pre-commit hook system — run linters/formatters on staged files only | Medium | ⬜ |

### 1M — DX & API Design (NEW — from prep guide: "How other engineers interface with your tools")

| # | Task | Description | Difficulty | Status |
|---|------|------------|-----------|--------|
| N65 | Fluent API builder | Design and implement a chainable API for a query builder or config builder | Medium | ⬜ |
| N66 | Error boundary with context | Build an error class hierarchy with codes, context, and serialization for CLI tools | Medium | ⬜ |
| N67 | Deprecation warning system | Implement `@deprecated` decorator / wrapper that logs warnings with migration path | Easy | ⬜ |

---

## Category 2: JavaScript Deep Knowledge

Netflix expects you to **deeply understand** how JavaScript works. For JSF specifically, you need internals-level knowledge.

| # | Topic | What They'll Ask | Depth |
|---|-------|-----------------|-------|
| J1 | **Module systems** — CommonJS vs ESM, dynamic import(), top-level await, dual packages | "How do you ship a package that works in both CJS and ESM?" | Deep |
| J2 | **Node.js module resolution** — node_modules lookup, package.json `exports` field, conditional exports | "What happens when you `import` a package? Walk through every step." | Deep |
| J3 | **package.json anatomy** — `main`, `module`, `exports`, `types`, `engines`, `peerDependencies`, `overrides` | "What's the difference between dependencies, devDependencies, and peerDependencies at install time?" | Deep |
| J4 | **Semantic versioning** — `^`, `~`, `>=`, pre-release, build metadata, range intersection | "If A requires `^2.3.0` and B requires `~2.5.0`, what resolves?" | Deep |
| J5 | **npm internals** — install algorithm, hoisting, phantom dependencies, `node_modules/.package-lock.json` | "Why does npm sometimes install a different version than what's in package-lock.json?" | Deep |
| J6 | **TypeScript compiler** — structural typing, declaration files, project references, `tsconfig` extends | "How would you enforce a TypeScript standard across 500 repos?" | Deep |
| J7 | **AST manipulation** — Babel, jscodeshift, ts-morph, visitor pattern | "How do codemods work? What's the difference between Babel and TypeScript AST?" | Medium |
| J8 | **Node.js internals** — event loop phases, libuv, worker threads, cluster module, child processes | "How would you parallelize a security scan across 10,000 packages?" | Medium |
| J9 | **Security** — prototype pollution, ReDoS, path traversal, dependency confusion attacks, typosquatting | "How do you protect against a malicious npm package?" | Deep |
| J10 | **Performance** — V8 hidden classes, inline caching, JIT, deopt, memory profiling | "A developer reports their CLI tool is slow. How do you diagnose it?" | Medium |
| J11 | **TypeScript advanced** — Generics, Utility Types, conditional types, `infer`, type narrowing, `satisfies` | "Walk me through how you'd type a plugin system" | Deep |
| J12 | **Testing** — testing pyramid vs trophy, when to unit test vs integration test, mocking strategies, flaky tests | "How do you decide what to test and at what level?" | Medium |
| J13 | **Bundlers** — how Webpack/Vite/esbuild/Rollup work internally, tree shaking, code splitting | "When would you choose each? What matters at scale?" | Medium |
| J14 | **Linting & Transpilation** — how ESLint rules work (AST visitors), Babel plugin system, SWC | "How would you write a custom lint rule?" | Medium |
| J15 | **Browser runtime** — caching strategies, CSP, critical rendering path, Core Web Vitals, RUM, CDN mechanics | "Our customers are UI engineers — what are their struggles?" | Medium |

---

## Category 3: JavaScript Architecture & API Design

**NOT "Design Netflix" system design.** From the prep guide: "We care more about JavaScript-related architectures, e.g. Package design or API design."

| # | Task | Key Discussion Points |
|---|------|-----------------------|
| SD1 | **Design a package publishing pipeline** | Validation, security scanning, versioning, npm registry integration, rollback, notifications |
| SD2 | **Design a TypeScript config inheritance system** | `extends` chains, enforcement via CI, migration tooling, versioned standards, opt-in vs opt-out |
| SD3 | **Design a dependency audit tool** | Graph construction, staleness detection, impact analysis ("if I upgrade X, what breaks?"), visualization |
| SD4 | **Design a codemod pipeline** | AST transform execution, dry-run mode, error handling, PR creation, review/approval, progress tracking |
| SD5 | **Design a CLI tool API** | Argument parsing, plugin system, configuration, error handling, help generation, testing strategy |
| SD6 | **Design a Node.js LTS migration system** | Service discovery, compatibility testing, automated PRs, staged rollout, tracking dashboard |
| SD7 | **Design a supply chain security policy engine** | Block/warn/allow rules, CVE matching, license checking, real-time scanning on publish |
| SD8 | **Design a monorepo build system** | Workspace discovery, dependency graph, affected detection, incremental builds, remote caching |
| SD9 | **Design a shared library versioning strategy** | Semver enforcement, breaking change detection, migration guides, deprecation timeline |
| SD10 | **Design a developer experience metrics platform** | Build time tracking, dependency resolution time, DX survey integration, what to measure and why |

### Architecture Discussion Framework

```
1. Clarify scope — what are we solving, what are we NOT solving
2. Users — who uses this, how do they interface with it (API design)
3. Core architecture — components and data flow
4. Key workflows — walk through the critical user journey
5. Error handling — what breaks, how do we recover gracefully
6. Trade-offs — what did we choose, what did we give up, why
7. Testing strategy — how do we test this, what's hard to test
8. Adoption — how do you get 500 teams to actually use this
```

---

## Category 4: Behavioral / Netflix Culture

This is the biggest difference from Google. Netflix behavioral rounds are **heavy** and based on the Culture Memo.

**From the prep guide:**
> "Read the Culture Memo several times. Be comfortable explicitly calling out phrases from it — just make sure it makes sense. Be authentic."
> "Keep it concise. Emphasize YOUR role — when you talk too much about 'we' instead of 'I', it's hard to tell whether the success is yours or your team's."
> "Use STAR-L (STARR) — Situation, Task, Action, Result + Learning/Reflection."

### Netflix Culture Values They Test

| Value | What They're Looking For | Your Story |
|-------|-------------------------|------------|
| **Judgment** | Making wise decisions despite ambiguity | Vue 3 migration — decided to tackle 679 blocking specs as a working group instead of waiting for perfect tooling |
| **Communication** | Concise, articulate, listen well | Led design reviews for Duo Agent Platform across frontend and product teams |
| **Curiosity** | Learn rapidly, seek to understand before acting | Self-taught engineer pivot from finance, continuous learning across Go/TS/Vue |
| **Courage** | Say what you think even if controversial, make tough calls | Identified UX gaps in policy editor, shipped redesign improving discoverability 20% |
| **Inclusion** | Collaborate effectively with diverse people | Cross-team collaboration on Vue 3 across multiple engineering teams |
| **Selflessness** | Seek what's best for Netflix, not yourself | Quality improvement epic: test coverage +35%, customer bugs -19% — infrastructure work that helps everyone |
| **Innovation** | Challenge prevailing assumptions, find new approaches | Duo Agent Platform — designed component architecture for a genuinely new problem space (agentic AI UI) |
| **Impact** | Accomplish amazing amounts of important work | Top Talent 3 consecutive years, 400+ MRs in 6 months |

### Additional from prep guide:
| Value | What They're Looking For |
|-------|-------------------------|
| **Autonomy** | Translate team goals into actions without being told |
| **Comfortable with disagreement** | Public disagreement — both accepting it and offering it |
| **Cross-functional collaboration** | Work with PMs, program managers, not just engineers |

### Expected Behavioral Questions

| # | Question | What They're Testing |
|---|----------|---------------------|
| B1 | "Tell me about a time you made a decision with incomplete information" | Judgment |
| B2 | "Describe a situation where you disagreed with a technical approach. What did you do?" | Courage, Communication |
| B3 | "Tell me about a time you had to drive adoption of a new tool or standard across multiple teams" | **Directly relevant to JSF** — Impact, Communication |
| B4 | "How do you prioritize when everything is important?" | Judgment, Selflessness |
| B5 | "Tell me about a time you failed. What did you learn?" | Curiosity, Courage |
| B6 | "Describe your approach to understanding a complex system before contributing to it" | Curiosity |
| B7 | "How do you build alignment across teams with different priorities?" | Communication, Inclusion |
| B8 | "Tell me about a time you simplified a complex problem" | Innovation |
| B9 | "How have you measured the impact of developer tooling or infrastructure work?" | Impact |
| B10 | "Tell me about a time you championed a change that wasn't popular initially" | Courage, Innovation |
| B11 | "Describe a time you publicly disagreed with someone. How did you handle it?" | Comfortable with disagreement |
| B12 | "Tell me about a time you worked with non-engineering stakeholders" | Cross-functional collaboration |

### Your Strongest Stories (from CV + experience)

1. **Vue 3 Migration Working Group** — Led resolution of 679 blocking specs, 400+ MRs in 6 months. Drove adoption across multiple teams. Presented at conference. Maps to: Judgment, Impact, Communication, driving adoption.

2. **Duo Agent Platform** — Designed component architecture for agentic AI interaction flows. Novel problem space, cross-team design reviews. Maps to: Innovation, Curiosity, Communication.

3. **Security Policy Platform** — Top 3 company priority. Designed REST API, built full-stack features across Vue/Rails/Go. Maps to: Impact, Judgment.

4. **Quality Improvement Epic** — Test coverage +35%, bugs -19%. Infrastructure work that benefits everyone. Maps to: Selflessness, Impact.

5. **Career pivot** — Finance → engineering, self-taught. Maps to: Curiosity, Courage.

### Behavioral Tips (from the prep guide)

- Don't focus on only one situation for the whole interview — have several stories ready
- Don't list too many projects per answer — one project, deep, with clear personal impact
- Use "I" not "we" — make your role explicit
- STAR-L: add Learning/Reflection to show you think beyond the task
- Be prepared to call out Culture Memo phrases explicitly

---

## Category 5: JavaScript Ecosystem Knowledge

For JSF specifically, you'll be asked about the broader JS ecosystem:

| # | Topic | What They Might Ask |
|---|-------|---------------------|
| E1 | **Package managers** — npm vs yarn vs pnpm | "What are the trade-offs? What would you recommend at Netflix scale and why?" |
| E2 | **Monorepo tools** — Nx, Turborepo, Lerna, Bazel | "How would you approach code sharing across hundreds of packages?" |
| E3 | **Bundlers** — Webpack, Vite, esbuild, Rollup, Rspack | "When would you choose each? What matters at scale?" |
| E4 | **TypeScript trends** — strict mode adoption, `satisfies`, const type params, decorators | "How do you evolve TS standards across a large org without breaking everything?" |
| E5 | **Node.js releases** — LTS schedule, V8 upgrades, new APIs (fetch, test runner, permission model) | "Walk me through how you'd plan an LTS migration for 1000 services" |
| E6 | **Runtime alternatives** — Deno, Bun | "Should Netflix care about these? Why or why not?" |
| E7 | **Supply chain incidents** — event-stream, colors.js, ua-parser-js, log4shell | "What would you build to prevent the next colors.js incident?" |
| E8 | **TC39 proposals** — decorators, signals, pattern matching, records/tuples | "Which upcoming proposals would have the most impact on Netflix's codebase?" |
| E9 | **Module federation** — Module Federation, import maps | "How do you share runtime dependencies across micro-frontends?" |
| E10 | **AI in DX** — Copilot, AI code review, automated refactoring | "How should JSF think about AI's impact on developer tooling?" |
| E11 | **Testing tools** — Jest, Vitest, Node.js test runner, Playwright, Testing Library | "What are the limitations of current JS testing tools?" |
| E12 | **Linting ecosystem** — ESLint flat config, Biome, oxlint | "Where is the linting ecosystem heading?" |

---

## Prep Priority (4-Week Plan)

### Week 1: Netflix Culture + TypeScript + Dependency Management
- Read the Netflix Culture Memo **several times**
- Prepare 8-10 behavioral stories using STAR-L framework
- Study T7 (TypeScript advanced), T8 (Dependency Management)
- Solve N1-N9 (semver + dependency tasks)
- Solve N49-N56 (TypeScript exercises)

### Week 2: Node.js + Tooling + Testing
- Study T9 (Node.js internals), T10 (Testing strategies)
- Study T1-T6 (SDLC: bundling, linting, transpilers, monorepos, CI/CD)
- Solve N15, N30-N31 (module resolution, config inheritance)
- Solve N34-N39 (Node.js patterns)
- Solve N57-N60 (testing tasks)

### Week 3: Security + Architecture + DX
- Study T8 security aspects, T11 (DX/API design)
- Solve N10-N14 (supply chain security)
- Solve N20-N24 (codemods/AST)
- Practice SD1-SD5 (architecture discussions — NOT system design)
- Solve N61-N67 (SDLC, DX tasks)

### Week 4: Integration + Mock Interviews
- Study T12-T16 (performance, browser runtime, CWV, RUM, CDN)
- Practice 2-3 full mock behavioral rounds
- Practice 2-3 architecture discussions
- Review ecosystem knowledge E1-E12
- Review all solved tasks for patterns

### What NOT to Prep
- ❌ LeetCode — "We won't be doing this in this role"
- ❌ "Design Netflix" type system design — "Not particularly interesting to us"
- ❌ Expert-level depth in every topic — "Don't go too deep"

---

## Key Differences in How to Present Yourself

| Google | Netflix JSF |
|--------|-------------|
| "I solved this optimally in O(n)" | "I built this tool that 200 engineers use daily" |
| Correct answer matters most | Reasoning + trade-offs matter most |
| Show you can code fast | Show you can design for adoption |
| Technical depth | Technical depth + stakeholder influence |
| Individual performance | Impact on developer ecosystem |
| "Here's the optimal algorithm" | "Here's why I chose this approach and what I'd change at 10x scale" |

**Your GitLab experience maps perfectly:** Vue 3 migration = driving adoption across teams. Duo Agent Platform = building DX for AI. Security Policy Platform = cross-functional delivery. Frame everything through the lens of **developer impact**, not just personal technical achievement.
