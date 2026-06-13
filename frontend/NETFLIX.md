# Netflix JavaScript Foundations — Interview Prep

> **Role:** Software Engineer 4, JavaScript Foundations — Warsaw
> **Team:** JSF (JavaScript Foundations) within JavaScript Platform org
> **What they build:** Developer experience — dependency management, supply chain security, TypeScript standards, Node.js LTS migrations, "UI Paved Road"
> **Their product:** Not an app — the DX for every UI engineer at Netflix

---

## How Netflix Interviews Differ from Google

| Aspect | Google | Netflix |
|--------|--------|---------|
| Coding format | Google Docs, algorithm-focused | CoderPad/CodeSignal, **practical tasks** |
| LeetCode | Heavy — 2 DSA rounds | Minimal — "don't care how many LeetCode hards you memorized" |
| What they test | Problem-solving speed, optimal solutions | Production-quality code, trade-offs, ownership |
| System design | Whiteboard diagrams | Conversational, reasoning about scale + failure |
| Behavioral | 1 round (Googleyness) | **Very heavy** — multiple rounds on Culture Memo |
| Onsite | 4-5 rounds, 1 day | **~8 rounds**, often split over 2 days |
| Directors | None | 1-2 directors in the loop (reduces bias) |
| Question bank | Standardized | **Team-specific** — interviewers design their own |

---

## Interview Structure (Expected)

Based on confirmed Netflix SWE reports and the JSF team context:

### 1. Recruiter Screen (30 min)
Background, motivation, Netflix culture values alignment.

### 2. Technical Phone Screen (45–60 min)
Live coding on CoderPad. For frontend teams: README with starter files, stubbed-out component, milestone-based progression. **Practical task tied to what the team builds** — expect something related to package tooling, dependency analysis, or JS ecosystem tooling.

### 3. Hiring Manager Interview (45–60 min)
Past work, cultural alignment, fit with the JSF team specifically. Questions about how you've influenced developer experience, driven adoption, navigated ambiguity.

### 4. Virtual Onsite (~8 rounds, split over 2 days)
- 2 system design rounds (deep, conversational)
- 1-2 practical coding rounds
- 3-4 behavioral/cultural rounds (Netflix Culture Memo heavy)
- 1-2 director interviews

---

## What This Team Actually Does

From the JD directly:

1. **Dependency management** — defining how Netflix manages npm packages across thousands of services
2. **Supply chain security** — scanning, auditing, blocking vulnerable/malicious packages
3. **TypeScript standards** — evolving TypeScript practices company-wide
4. **Node.js LTS migrations** — automating annual LTS migrations for thousands of services
5. **Code sharing patterns** — how code is shared across browser + server
6. **Libraries, tools, workflows** — building abstractions that make JS developers productive
7. **Community engagement** — reconciling internal needs with external JS ecosystem trends

**Critical quote from the JD:** "Code is a very small slice of this team's impact." They care about influence, alignment, storytelling, and stakeholder management as much as technical ability.

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

---

## Category 3: System Design (Onsite — 2 Rounds)

Netflix system design is **conversational, not whiteboard**. They care about reasoning through trade-offs, failure modes, and scale. For JSF, designs will be about **developer tooling infrastructure**, not product features.

### Tier 1 — Highest Probability

| # | Task | Key Discussion Points |
|---|------|-----------------------|
| SD1 | **Design an internal npm registry** | Publishing pipeline, security scanning, access control, caching proxy for public npm, immutable versions, deprecation/yanking, developer portal |
| SD2 | **Design a Node.js LTS migration system** | Service discovery, automated PRs, compatibility testing, rollout strategy (canary → staged), rollback, tracking dashboard |
| SD3 | **Design a supply chain security platform** | Vulnerability database, dependency graph construction, policy engine (block/warn/allow), real-time scanning on publish, CVE notification pipeline |
| SD4 | **Design a company-wide TypeScript configuration system** | Config inheritance, enforcement mechanism (CI gates), migration tooling, versioned standards, opt-in vs opt-out |

### Tier 2 — High Probability

| # | Task | Key Discussion Points |
|---|------|-----------------------|
| SD5 | **Design a JavaScript dependency graph / audit tool** | Graph construction at scale, staleness detection, impact analysis ("if I upgrade X, what breaks?"), visualization |
| SD6 | **Design a codemod pipeline** | AST transform execution, dry-run mode, error handling, PR creation, review/approval flow, progress tracking |
| SD7 | **Design a package health scoring system** | Metrics (last publish, test coverage, vulnerability count, download trends), scoring algorithm, actionable recommendations |
| SD8 | **Design a developer experience metrics platform** | Build time tracking, dependency resolution time, DX survey integration, correlation analysis |

### Tier 3 — Possible

| # | Task | Key Discussion Points |
|---|------|-----------------------|
| SD9 | **Design a monorepo tooling platform** | Workspace discovery, dependency graph, affected detection, incremental builds, remote caching |
| SD10 | **Design an A/B testing framework for developer tools** | Feature flags for CLI/tooling, metrics collection, rollout strategy |
| SD11 | **Design a cross-platform code sharing system** | Shared packages between browser + Node.js, conditional exports, tree shaking, testing strategy |
| SD12 | **Design a JavaScript runtime version management system** | Similar to nvm/fnm but at enterprise scale — CI integration, team-level pinning, auto-upgrade |

### System Design Framework for Netflix

Netflix cares more about **reasoning and trade-offs** than perfect diagrams:

```
1. Clarify scope — what are we solving, what are we NOT solving
2. Users and scale — who uses this, how many services/packages/developers
3. Core architecture — components and data flow
4. Data model — what do we store, how do we query it
5. Key workflows — walk through the critical user journey
6. Failure modes — what breaks, how do we detect it, how do we recover
7. Trade-offs — what did we choose, what did we give up, why
8. Adoption strategy — how do you get 500 teams to actually use this
```

The last two are **Netflix-specific**. Google rarely asks about adoption. Netflix always does — "the human-facing elements of technology."

---

## Category 4: Behavioral / Netflix Culture (3-4 Rounds)

This is the biggest difference from Google. Netflix behavioral rounds are **heavy** and based on their Culture Memo. Expect 3-4 rounds focused on these values:

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

### Expected Behavioral Questions

| # | Question | What They're Testing |
|---|----------|---------------------|
| B1 | "Tell me about a time you made a decision with incomplete information" | Judgment |
| B2 | "Describe a situation where you disagreed with a technical approach. What did you do?" | Courage, Communication |
| B3 | "Tell me about a time you had to drive adoption of a new tool or standard across multiple teams" | **Directly relevant to JSF** — Impact, Communication |
| B4 | "How do you prioritize when everything is important?" | Judgment, Selflessness |
| B5 | "Tell me about a time you failed. What did you learn?" | Curiosity, Courage |
| B6 | "Describe your approach to understanding a complex system before contributing to it" | Curiosity — "seeks to deeply understand before writing code" |
| B7 | "How do you build alignment across teams with different priorities?" | Communication, Inclusion — critical for JSF's cross-cutting role |
| B8 | "Tell me about a time you simplified a complex problem" | Innovation — "address complex architectural problems with simple, intuitive designs" |
| B9 | "How have you measured the impact of developer tooling or infrastructure work?" | Impact — JSF measures success by "collective velocity of every UI engineer" |
| B10 | "Tell me about a time you championed a change that wasn't popular initially" | Courage, Innovation |

### Your Strongest Stories (from CV + experience)

1. **Vue 3 Migration Working Group** — Led resolution of 679 blocking specs, 400+ MRs in 6 months. Drove adoption across multiple teams. Presented at conference. Maps to: Judgment, Impact, Communication, driving adoption.

2. **Duo Agent Platform** — Designed component architecture for agentic AI interaction flows. Novel problem space, cross-team design reviews. Maps to: Innovation, Curiosity, Communication.

3. **Security Policy Platform** — Top 3 company priority. Designed REST API, built full-stack features across Vue/Rails/Go. Maps to: Impact, Judgment.

4. **Quality Improvement Epic** — Test coverage +35%, bugs -19%. Infrastructure work that benefits everyone. Maps to: Selflessness, Impact.

5. **Career pivot** — Finance → engineering, self-taught. Maps to: Curiosity, Courage.

---

## Category 5: JavaScript Ecosystem Knowledge

For JSF specifically, you'll be asked about the broader JS ecosystem — trends, tools, opinions:

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

---

## Prep Priority (4-Week Plan)

### Week 1: Netflix Culture + JS Deep Knowledge
- Read the Netflix Culture Memo thoroughly
- Prepare 8-10 behavioral stories mapped to Netflix values
- Study J1-J5 (module systems, resolution, package.json, semver, npm internals)
- Study J9 (supply chain security attacks)

### Week 2: System Design
- SD1 (npm registry) — full mock design
- SD2 (Node.js LTS migration) — full mock design
- SD3 (supply chain security) — full mock design
- Review SD4-SD8 key discussion points

### Week 3: Practical Coding
- N3 (semver parser) — implement from scratch
- N1 (dependency resolver) — implement simplified version
- N2 (vulnerability scanner) — implement graph traversal + matching
- N6 (CLI tool) — build a small CLI with argument parsing

### Week 4: Integration + Mock Interviews
- N11 (`require()` from scratch) — deep JS internals
- Practice coding with trade-off discussions (Netflix style)
- 2-3 full mock behavioral rounds
- Review ecosystem knowledge E1-E10

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
