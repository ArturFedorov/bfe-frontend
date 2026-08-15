# Data Structures Deep-Dive — Full Curriculum

**Student:** Artur Fedorov — Senior Frontend Engineer (Vue.js, TypeScript, Go)
**Target:** Google L5 Senior SWE
**Focus:** Data structure *internals* — how they actually work under the hood, not just how to use them to solve LeetCode problems
**Relationship to existing course:** This runs **parallel** to your practical DSA/LeetCode course. That course drills problem patterns; this one drills the structures themselves — the way the Go Language Deep-Dive runs parallel to the Go Ecosystem course.
**Depth:** Internals-level (mechanism, invariants, tradeoffs) — not full source-code depth, not just definitions

---

## Course Mechanics

### Lesson Format
Each lesson covers:
- Concept explanation with intuition — *why* the structure is built this way, not just what it does
- A Big-O table for every operation (not just "it's fast" — the actual complexity per operation, average vs. worst case)
- Canonical Go implementation sketch where it clarifies the mechanism
- 1–2 trap mistakes / interview gotchas
- Common Google interview questions tied to the structure

### Verification Loop (every lesson)
1. **Quick Check** — exactly 2 conceptual questions, no coding. Wait for answers.
2. **Diagnose** — identify gaps, re-explain only the weak points.
3. **Unlock** — proceed only once the mental model is solid.

This course is theory-only (no coding challenges) — matches your Go Language Deep-Dive format. Coding practice on these structures stays in the LeetCode course.

### Study Modes
- **"computer" / "bed"** — doesn't change format here since it's theory-only either way, but say which and I'll match pacing.

---

## Phase 1: Linear Structures, Revisited Deeper

### Lesson 1: Arrays & Dynamic Arrays Internals
- Contiguous memory layout, why indexing is O(1)
- Dynamic array growth: doubling strategy, amortized O(1) append — the actual proof sketch
- Why shrinking arrays usually *doesn't* halve capacity immediately (thrashing)
- Cache locality — why arrays outperform linked lists in practice despite same Big-O

| Operation | Average | Worst | Note |
|---|---|---|---|
| Access by index | O(1) | O(1) | direct offset calc |
| Append | O(1) amortized | O(n) | triggers resize |
| Insert at index | O(n) | O(n) | shifts elements |
| Delete at index | O(n) | O(n) | shifts elements |
| Search (unsorted) | O(n) | O(n) | — |

### Lesson 2: Linked Lists — All Variants
- Singly vs. doubly vs. circular — memory overhead per node
- Why linked lists lose the cache-locality war despite O(1) insert/delete
- Skip list preview (full lesson later) as "linked list + probabilistic shortcuts"

| Operation | Singly | Doubly |
|---|---|---|
| Access by index | O(n) | O(n) |
| Insert at head | O(1) | O(1) |
| Insert at tail (no tail ptr) | O(n) | O(1) w/ tail ptr |
| Delete (given node) | O(n)* | O(1) |
| Delete (given node)* | *needs prev pointer* | — |

### Lesson 3: Stacks & Queues — Implementation Internals
- Array-backed vs. linked-list-backed tradeoffs
- Circular buffer queue — why `%capacity` avoids the O(n) shift trap
- Deque internals (why Go's `container/list` beats slice-shifting)

---

## Phase 2: Trees — Deep Dive

*(This is the phase you flagged — going past "trees" as one topic into each structural variant and why it exists.)*

### Lesson 4: Binary Trees — Fundamentals & Traversal Internals
- Full / complete / perfect / balanced — precise definitions, not interchangeable
- Recursive vs. iterative traversal (explicit stack mechanics for iterative in/pre/postorder)
- Morris traversal — O(1) space traversal using threaded pointers (Google favorite "can you do it without recursion or a stack")

### Lesson 5: Binary Search Trees — Invariants & Degeneration
- The BST invariant and why it alone guarantees nothing about balance
- Degenerate case: sorted insertion order → O(n) linked list in disguise
- Why "BST" without a balancing guarantee is an interview trap if you don't call it out

| Operation | Average | Worst (degenerate) |
|---|---|---|
| Search | O(log n) | O(n) |
| Insert | O(log n) | O(n) |
| Delete | O(log n) | O(n) |

### Lesson 6: AVL Trees — Self-Balancing via Rotations
- Balance factor invariant: height(left) − height(right) ∈ {−1, 0, 1}
- Four rotation cases: LL, RR, LR, RL — the actual pointer surgery
- Why AVL trees are more rigidly balanced than Red-Black (more rotations on insert, faster lookups)

| Operation | Guaranteed |
|---|---|
| Search | O(log n) |
| Insert | O(log n) (≤2 rotations) |
| Delete | O(log n) (up to O(log n) rotations) |

### Lesson 7: Red-Black Trees — Balancing via Color Invariants
- The 5 red-black invariants (root black, red node's children black, equal black-height on every path, etc.)
- Why "approximately balanced" (height ≤ 2·log(n+1)) is the tradeoff for fewer rotations than AVL
- Insert/delete recoloring + rotation cases — the mechanism, not full case-by-case memorization
- **Trap:** interviewers rarely ask you to implement one from scratch — they ask *why* Java's TreeMap / C++'s std::map / Go's absence of one matters

| Operation | Guaranteed |
|---|---|
| Search | O(log n) |
| Insert | O(log n) (≤2 rotations, O(log n) recolors) |
| Delete | O(log n) (≤3 rotations) |

**AVL vs. Red-Black, side by side:**

| | AVL | Red-Black |
|---|---|---|
| Balance strictness | Tighter | Looser |
| Lookup speed | Faster | Slightly slower |
| Insert/delete speed | Slower (more rotations) | Faster (fewer rotations) |
| Typical use | Read-heavy workloads | Write-heavy workloads (e.g. Linux CFS scheduler, Java TreeMap) |

### Lesson 8: B-Trees & B+ Trees — Disk-Oriented Structures
- Why binary trees are wrong for disk/DB indexes (each pointer-hop = a disk seek)
- B-Tree: multi-key nodes, minimize tree height to minimize disk reads
- B+ Tree: data only in leaves, leaves linked — why every real database index uses this, not a B-Tree
- Order/branching factor and how it's chosen relative to disk page size

| Operation | B-Tree / B+ Tree |
|---|---|
| Search | O(log_b n) — b = branching factor |
| Insert | O(log_b n) |
| Delete | O(log_b n) |
| Range query | O(log_b n + k) — B+ Tree only, via leaf linked list |

### Lesson 9: Tries & Radix Trees
- Standard trie: O(1)-ish per-character array/map, memory cost per node
- Radix tree (compressed trie): collapsing single-child chains — why it trades memory for a bit more traversal logic
- Ternary search trees as a memory-efficient alternative to array-per-node tries

| Operation | Standard Trie | Radix Tree |
|---|---|---|
| Insert | O(m) — m = key length | O(m) |
| Search | O(m) | O(m) |
| Space | O(alphabet × nodes) | O(nodes), fewer nodes |

### Lesson 10: Segment Trees — Range Queries & Lazy Propagation
- Build: O(n) bottom-up, array-backed binary tree over ranges
- Range query / point update vs. range update with lazy propagation
- Why segment trees beat prefix-sum arrays when updates are frequent

| Operation | Without Lazy Prop | With Lazy Prop |
|---|---|---|
| Build | O(n) | O(n) |
| Point update | O(log n) | O(log n) |
| Range update | O(n) | O(log n) |
| Range query | O(log n) | O(log n) |

### Lesson 11: Fenwick Trees (Binary Indexed Trees)
- The bit-manipulation trick (`i & -i`) that makes BITs simpler than segment trees for prefix sums
- When to reach for a Fenwick tree instead of a segment tree (simpler, less memory, but less flexible)

| Operation | Complexity |
|---|---|
| Build | O(n log n) or O(n) with a trick |
| Point update | O(log n) |
| Prefix sum query | O(log n) |

---

## Phase 3: Heaps & Priority Structures

### Lesson 12: Binary Heaps Internals
- Array representation: why `2i+1`/`2i+2`/`(i-1)/2` works without pointers
- Sift-up (insert) vs. sift-down (extract) — the actual comparison/swap chain
- Why heapify-from-bottom is O(n), not O(n log n) — the proof intuition, not just the fact

| Operation | Complexity |
|---|---|
| Peek | O(1) |
| Insert | O(log n) |
| Extract-min/max | O(log n) |
| Build heap (heapify) | O(n) |

### Lesson 13: d-ary Heaps & Advanced Heap Variants
- d-ary heap: tradeoff of shallower tree (faster decrease-key-ish ops) vs. more comparisons per sift-down
- Fibonacci heap & pairing heap — conceptual only: why Dijkstra's *theoretical* O(E + V log V) needs one, and why almost nobody implements them in practice

---

## Phase 4: Graphs Deep Dive

### Lesson 14: Graph Representations & Tradeoffs
- Adjacency list vs. adjacency matrix vs. edge list — when each wins
- Dense vs. sparse graph threshold for choosing representation

| Representation | Space | Edge lookup | Iterate neighbors |
|---|---|---|---|
| Adjacency list | O(V+E) | O(degree) | O(degree) |
| Adjacency matrix | O(V²) | O(1) | O(V) |
| Edge list | O(E) | O(E) | O(E) |

### Lesson 15: Union-Find (Disjoint Set Union)
- Path compression + union by rank/size — why combined they get you α(n), effectively O(1)
- Where this beats DFS-based cycle detection (Kruskal's MST, dynamic connectivity)

| Operation | Without optimization | With path compression + union by rank |
|---|---|---|
| Find | O(n) | O(α(n)) ≈ O(1) |
| Union | O(n) | O(α(n)) ≈ O(1) |

### Lesson 16: Minimum Spanning Trees — Prim's & Kruskal's
- Kruskal's: sort edges + Union-Find, greedy edge selection
- Prim's: grow from a vertex with a min-heap, greedy edge selection
- When to pick which (dense graph → Prim's with adjacency matrix; sparse → Kruskal's)

| Algorithm | Complexity |
|---|---|
| Kruskal's (with Union-Find) | O(E log E) |
| Prim's (with min-heap) | O(E log V) |

### Lesson 17: Shortest Path Algorithms
- Dijkstra: greedy + min-heap, why it fails with negative weights
- Bellman-Ford: relax all edges V−1 times, detects negative cycles
- Floyd-Warshall: all-pairs via DP, why it's O(V³) but simple

| Algorithm | Complexity | Handles negative weights? |
|---|---|---|
| Dijkstra (min-heap) | O((V+E) log V) | No |
| Bellman-Ford | O(V·E) | Yes (detects negative cycles) |
| Floyd-Warshall | O(V³) | Yes |

### Lesson 18: Strongly Connected Components & Articulation Points
- Tarjan's algorithm (single-pass, low-link values)
- Kosaraju's algorithm (two-pass, DFS + transpose graph)
- Articulation points / bridges — discovery time vs. low-link comparison

| Algorithm | Complexity |
|---|---|
| Tarjan's SCC | O(V+E) |
| Kosaraju's SCC | O(V+E) |
| Articulation points / bridges | O(V+E) |

---

## Phase 5: Specialized & Probabilistic Structures

### Lesson 19: Skip Lists
- Layered linked lists with probabilistic "express lanes"
- Why average O(log n) despite being "just a linked list" — the coin-flip intuition
- Where used in practice (Redis sorted sets)

| Operation | Average | Worst |
|---|---|---|
| Search | O(log n) | O(n) |
| Insert | O(log n) | O(n) |
| Delete | O(log n) | O(n) |

### Lesson 20: Bloom Filters
- Bit array + k hash functions — why false positives are possible but false negatives never are
- Sizing: tradeoff between bit array size, hash count, and false positive rate

| Operation | Complexity |
|---|---|
| Insert | O(k) — k = number of hash functions |
| Query | O(k) |
| Space | O(m) — m = bit array size, independent of n |

### Lesson 21: LFU Cache & Advanced Eviction Structures
- LRU recap (HashMap + doubly linked list) vs. LFU's extra dimension: frequency
- O(1) LFU: frequency buckets, each a doubly linked list of same-frequency keys

| Operation | LRU | LFU (O(1) design) |
|---|---|---|
| Get | O(1) | O(1) |
| Put | O(1) | O(1) |

### Lesson 22: Consistent Hashing (System-Design Adjacent)
- The ring, virtual nodes, why it minimizes remapping when nodes join/leave
- Bridges directly into your Hash Maps theory (already complete) and system design rounds

---

## Progress Tracker

| Lesson | Topic | Status |
|---|---|---|
| 1 | Arrays & Dynamic Arrays Internals | Not started |
| 2 | Linked Lists — All Variants | Not started |
| 3 | Stacks & Queues Internals | Not started |
| 4 | Binary Trees — Fundamentals & Traversal | Not started |
| 5 | Binary Search Trees — Invariants | Not started |
| 6 | AVL Trees | Not started |
| 7 | Red-Black Trees | Not started |
| 8 | B-Trees & B+ Trees | Not started |
| 9 | Tries & Radix Trees | Not started |
| 10 | Segment Trees | Not started |
| 11 | Fenwick Trees (BIT) | Not started |
| 12 | Binary Heaps Internals | Not started |
| 13 | d-ary & Advanced Heaps | Not started |
| 14 | Graph Representations | Not started |
| 15 | Union-Find | Not started |
| 16 | MST — Prim's & Kruskal's | Not started |
| 17 | Shortest Path Algorithms | Not started |
| 18 | SCC & Articulation Points | Not started |
| 19 | Skip Lists | Not started |
| 20 | Bloom Filters | Not started |
| 21 | LFU Cache & Eviction Structures | Not started |
| 22 | Consistent Hashing | Not started |

---

*Data Structures Deep-Dive · Artur Fedorov · Generated by Claude*
