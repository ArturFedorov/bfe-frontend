# Algorithms — Learning and Solving Plan

**Goal:** pass a LeetCode-style round (Meta: two Mediums in about 40 minutes, often without running
the code) by recognising the pattern fast, writing a correct first draft, and proving it by hand.

**Material:** `algo/001–090` (scenario-framed classics, see `TASKS.md`) and `algo/meta/001–047`
(LeetCode-framed Meta favourites). Every folder has `README.md`, a stub, a test suite and a
`solution.ts`. Run one task with `npx jest algo/<folder>`.

This plan has five parts: **how to solve one problem**, **how to recognise the pattern**, **the
templates to know cold**, **how to learn so it sticks**, and **the order to work in**.

---

## 1. How to solve one problem (the 40-minute method)

Use the same steps every time, out loud, even when practising alone. In the interview this *is*
the communication score.

| Step | Time | What you do | What you say |
| --- | --- | --- | --- |
| 1. Understand | 3 min | Restate the problem, walk through one example by hand, list edge cases | "So I need… For `[2,7,11]` the answer is… What about empty input, duplicates, negatives?" |
| 2. Match | 2 min | Find the signal in the statement (section 2) and name the pattern | "Sorted input and a target pair, so two pointers" |
| 3. Brute force | 1 min | One sentence plus complexity; do not code it | "Check every pair, O(n²); we can do better" |
| 4. Plan | 3 min | Name the data structure, the invariant and the loop; write 3–5 comment lines | "The window always has at most k distinct values…" |
| 5. Code | 10 min | Write it straight from the comments; clear names; no clever one-liners | Narrate only decisions, not keystrokes |
| 6. Prove | 3 min | Dry-run the smallest interesting example line by line; then each edge case | "i=0, sum=2, map={0:1}…" |
| 7. Analyse | 1 min | Time and space, and why | "Each index enters and leaves the window once: O(n)" |
| 8. Follow-up | rest | Answer the README's interviewer follow-up | "As a stream I'd keep only…" |

**If you are stuck after 5 minutes on step 2:** solve a smaller version (n = 2, n = 3), or ask
"what would make this easy?" (sorted? a map? processed from the end?). Saying this out loud
earns credit even before the idea arrives.

**Before saying "done", check:** off-by-one at both ends, empty input, single element, all
duplicates, negative numbers, and that you return in every branch.

---

## 2. Pattern recognition — signal → pattern

| If the problem says… | Think | Practise on |
| --- | --- | --- |
| Sorted array, find a pair or triple | Two pointers from both ends | algo 019, 023; meta 001 |
| Contiguous subarray or substring, "longest/shortest with condition" | Sliding window (grow right, shrink left) | algo 012–015; meta 016 |
| Subarray **sum** equals or divisible by k, negatives allowed | Prefix sum + hash map of seen sums | meta 011, 012 |
| Many range queries, or weighted random | Prefix sums (+ binary search) | meta 013 |
| Sorted, or "minimum value that works" / monotonic yes-no | Binary search (on index or on the answer) | meta 019–022 |
| "k largest / k closest / k most frequent", merge k sorted | Heap of size k, or quickselect | meta 023–026 |
| Matching brackets, nested structure, undo, "previous smaller/greater" | Stack, monotonic stack | algo 058, 060, 063, 064; meta 002, 003 |
| Max or min over a moving window | Monotonic deque | algo 065 |
| Intervals, meetings, overlaps | Sort by start, then sweep | algo 024–031 |
| Tree: depth, path, subtree property | DFS returning a value from children | algo 032–041; meta 033, 037 |
| Tree: by level, by column, closest to root | BFS with a queue | algo 034, 039; meta 030 |
| BST | Use the order: in-order is sorted, prune by range | meta 032, 034, 036 |
| Grid, islands, flood fill | DFS/BFS on implicit graph, mark visited | algo 045; meta 041 |
| Shortest path, unweighted | BFS (level = distance) | algo 046, 050; meta 038 |
| Dependencies, prerequisites, ordering | Topological sort (Kahn or DFS colours) | algo 051–057 |
| Groups that merge, "connected" equivalence | Union-find | meta 040 |
| Copy a structure with pointers | Map from old node to new node | meta 027, 039 |
| "All combinations / subsets / permutations" | Backtracking (choose, explore, unchoose) | meta 043–045, 047 |
| "Can it be split / how many ways", overlapping subproblems | DP (memoised recursion first, then table) | meta 046 |
| Design a class with O(1) operations | Map + array, or Map + linked list | algo 089; meta 017 |

---

## 3. Templates to know cold (TypeScript)

Write each from memory in under 3 minutes. JavaScript has **no built-in heap or deque**, so the
heap is the one most worth drilling.

```ts
// Binary search — first index where pred(i) is true (lower bound)
let lo = 0, hi = n; // answer in [lo, hi]
while (lo < hi) {
  const mid = lo + ((hi - lo) >> 1);
  if (pred(mid)) hi = mid; else lo = mid + 1;
}
return lo;
```

```ts
// Sliding window — longest window that satisfies a condition
let left = 0, best = 0;
for (let right = 0; right < s.length; right++) {
  add(s[right]);
  while (!valid()) remove(s[left++]);
  best = Math.max(best, right - left + 1);
}
```

```ts
// Prefix sum + map — count subarrays with sum k
const seen = new Map<number, number>([[0, 1]]);
let sum = 0, count = 0;
for (const x of nums) {
  sum += x;
  count += seen.get(sum - k) ?? 0;
  seen.set(sum, (seen.get(sum) ?? 0) + 1);
}
```

```ts
// BFS on a grid — queue with a head index (Array.shift is O(n))
const queue: Array<[number, number]> = [[sr, sc]];
seen[sr][sc] = true;
for (let head = 0; head < queue.length; head++) {
  const [r, c] = queue[head];
  for (const [dr, dc] of DIRS) {
    const nr = r + dr, nc = c + dc;
    if (nr < 0 || nc < 0 || nr >= rows || nc >= cols || seen[nr][nc] || grid[nr][nc] === 1) continue;
    seen[nr][nc] = true;
    queue.push([nr, nc]);
  }
}
```

```ts
// Min-heap — the one data structure JS does not give you
class MinHeap<T> {
  private items: T[] = [];
  constructor(private less: (a: T, b: T) => boolean) {}
  get size() { return this.items.length; }
  peek() { return this.items[0]; }
  push(x: T) {
    const a = this.items; a.push(x);
    for (let i = a.length - 1; i > 0; ) {
      const p = (i - 1) >> 1;
      if (!this.less(a[i], a[p])) break;
      [a[i], a[p]] = [a[p], a[i]]; i = p;
    }
  }
  pop(): T | undefined {
    const a = this.items; const top = a[0]; const last = a.pop();
    if (a.length > 0 && last !== undefined) {
      a[0] = last;
      for (let i = 0; ; ) {
        const l = 2 * i + 1, r = l + 1; let m = i;
        if (l < a.length && this.less(a[l], a[m])) m = l;
        if (r < a.length && this.less(a[r], a[m])) m = r;
        if (m === i) break;
        [a[i], a[m]] = [a[m], a[i]]; i = m;
      }
    }
    return top;
  }
}
```

```ts
// Union-find with path compression and union by size
const parent = Array.from({ length: n }, (_, i) => i);
const size = new Array(n).fill(1);
const find = (x: number): number => (parent[x] === x ? x : (parent[x] = find(parent[x])));
const union = (a: number, b: number) => {
  let ra = find(a), rb = find(b);
  if (ra === rb) return;
  if (size[ra] < size[rb]) [ra, rb] = [rb, ra];
  parent[rb] = ra; size[ra] += size[rb];
};
```

```ts
// Backtracking — choose, explore, unchoose
const out: number[][] = [];
const path: number[] = [];
const dfs = (start: number) => {
  out.push([...path]);
  for (let i = start; i < nums.length; i++) {
    path.push(nums[i]);
    dfs(i + 1);
    path.pop();
  }
};
dfs(0);
```

Also know: DFS on a tree returning a value (height, sum), iterative in-order with a stack,
Kahn's topological sort, monotonic stack ("next greater"), and merging two sorted lists.

### JavaScript traps that cost interviews

- `arr.sort()` sorts **as strings**: always `arr.sort((a, b) => a - b)`.
- `Array.shift()` is O(n): use a head index for queues.
- Spreading or slicing inside a loop (`[...path]`, `s.slice()`) is O(n) per step: say so when
  you do it.
- Strings are immutable: build with an array and `join('')`.
- Integers are exact only up to 2^53: mention it for large sums and products.
- Recursion depth is roughly 10k frames: for 10^5-deep lists or trees, go iterative.
- `Math.floor((lo + hi) / 2)` is fine in JS (no overflow), but `lo + ((hi - lo) >> 1)` shows you know why.
- `new Array(n).fill([])` shares **one** array: use `Array.from({ length: n }, () => [])`.

---

## 4. How to learn so it sticks

**One problem, one attempt loop**
1. Read only the README. Set a 25-minute timer (40 for Hard).
2. Solve with the method in section 1. Run the tests only after a hand dry-run.
3. Stuck? Use the hint ladder, one rung at a time, 5 minutes apart:
   README **Target** line → the pattern table in section 2 → the matching template in section 3 →
   `solution.ts`.
4. After green, read `solution.ts` anyway and note one thing it does better.
5. Log it (section 6) as **clean** (no hints, under time), **hinted**, or **failed**.

**Spaced repetition** — redo from a blank file:
- **hinted or failed:** after 1 day, 3 days, then 7 days, until it is clean twice in a row.
- **clean:** once after 14 days, then only in mocks.

Reset a task with `git checkout <commit-with-stub> -- <file>`, or keep a blank copy and solve in
a scratch file.

**Mistake journal:** one line per bug you made ("forgot `seen.set(0, 1)` in prefix sum").
Re-read it before every mock. Most interview failures repeat the same five mistakes.

---

## 5. Order of work

A sequence, not a calendar. Move on when the stage's exit check passes.

| Stage | Goal | Volume | Exit check |
| --- | --- | --- | --- |
| A | Turn the LeetCode classics you already solved into interview speed | 19 tasks, 20 min each | 15 of 19 clean |
| B | Close the Meta gaps topic by topic | 47 tasks in `algo/meta/` | Each topic: every task clean once; you can name each pattern from the title |
| C | Practise the real format: two problems, 40 minutes | At least 10 pairs | 8 of the last 10 pairs both correct in time |
| D | Peak for the interview, no new material | 7 days | Every hinted/failed task clean twice |

### Stage A — Classics you already have (redo from blank, 20 min each)

The repo tasks use scenario names; the LeetCode column says which classic each one is.

| Topic | Task | LeetCode | Difficulty | Pattern |
| --- | --- | --- | --- | --- |
| Stacks | algo 058 bracket validator | 20 | Easy | Stack |
| Stacks | algo 060 path normalizer | 71 | Medium | Stack of segments |
| Stacks | algo 063 build speed watch | 739 | Medium | Monotonic stack |
| Stacks | algo 064 formula calculator | 227 | Medium | Stack / recursive descent |
| Two pointers | algo 019 gift card pair | 167 | Medium | Converging pointers |
| Two pointers | algo 023 capacity triplet | 15 | Medium | Sort + pinned pointer |
| Two pointers | algo 022 calendar intersection | 986 | Medium | Two pointers over intervals |
| Sliding window | algo 012 longest unique run | 3 | Medium | Variable window + set |
| Sliding window | algo 015 min coverage window | 76 | Hard | Need/have counts |
| Sliding window | algo 065 sliding max latency | 239 | Hard | Monotonic deque |
| Intervals | algo 026 merge busy slots | 56 | Medium | Sort + sweep |
| Intervals | algo 029 min rooms | 253 | Medium | Sweep line or heap |
| Trees | algo 034 level snapshot | 102 | Medium | BFS by level |
| Trees | algo 039 minimap view | 199 | Medium | BFS, last node per level |
| Trees | algo 040 component diameter | 543 | Easy | Height + global best |
| Trees | algo 038 common container | 236 | Medium | Return found nodes up |
| Graphs | algo 045 rack outage clusters | 200 | Medium | Grid DFS/BFS |
| Graphs | algo 052 build order (Kahn) | 207 | Medium | Topological sort |
| Design | algo 089 LRU query cache | 146 | Medium | Map in insertion order |

### Stage B — Meta gaps (`algo/meta/`, Easy first within each topic)

| Topic | Task | LeetCode | Difficulty | Pattern |
| --- | --- | --- | --- | --- |
| Strings | meta 001 valid palindrome II | 680 | Easy | Two pointers, one skip |
| Strings | meta 004 valid word abbreviation | 408 | Easy | Two pointers + number parsing |
| Strings | meta 007 add strings and binary | 415, 67 | Easy | Digit-by-digit with carry |
| Strings | meta 002 min remove to make valid | 1249 | Medium | Stack of indices |
| Strings | meta 003 min add to make valid | 921 | Medium | Balance counter |
| Strings | meta 005 custom sort string | 791 | Medium | Counting |
| Strings | meta 006 group shifted strings | 249 | Medium | Canonical key |
| Strings | meta 008 maximum swap | 670 | Medium | Last index of each digit |
| Arrays and math | meta 009 next permutation | 31 | Medium | Pivot, swap, reverse suffix |
| Arrays and math | meta 010 pow(x, n) | 50 | Medium | Fast exponentiation |
| Prefix sums | meta 011 subarray sum equals k | 560 | Medium | Prefix sum + map |
| Prefix sums | meta 012 continuous subarray sum | 523 | Medium | Prefix mod + first index |
| Prefix sums | meta 013 random pick with weight | 528 | Medium | Prefix sums + binary search |
| Hashing | meta 014 sparse vector dot product | 1570 | Medium | Index → value map |
| Arrays | meta 015 buildings with an ocean view | 1762 | Medium | Scan from the right |
| Sliding window | meta 016 max consecutive ones III | 1004 | Medium | Window with at most k zeros |
| Design | meta 017 insert delete getRandom O(1) | 380 | Medium | Map + array, swap-remove |
| Arrays | meta 018 diagonal traverse | 498 | Medium | Index arithmetic by diagonal |
| Binary search | meta 020 kth missing positive | 1539 | Easy | Search on missing count |
| Binary search | meta 019 find peak element | 162 | Medium | Compare with neighbour |
| Binary search | meta 021 first and last position | 34 | Medium | Lower and upper bound |
| Binary search | meta 022 search in rotated array | 33 | Medium | Find the sorted half |
| Heaps | meta 023 kth largest element | 215 | Medium | Quickselect or size-k heap |
| Heaps | meta 024 k closest points | 973 | Medium | Size-k max-heap |
| Heaps | meta 025 top k frequent | 347 | Medium | Count + bucket sort or heap |
| Heaps | meta 026 merge k sorted lists | 23 | Hard | Heap of list heads |
| Linked lists | meta 029 add two numbers | 2 | Medium | Walk both lists with carry |
| Linked lists | meta 027 copy list with random pointer | 138 | Medium | Old → new node map |
| Linked lists | meta 028 insert into sorted circular list | 708 | Medium | Find the gap or the wrap |
| Trees | meta 032 range sum of BST | 938 | Easy | DFS with pruning |
| Trees | meta 034 closest BST value | 270 | Easy | Walk one root-to-leaf path |
| Trees | meta 033 sum root to leaf numbers | 129 | Medium | DFS carrying the number |
| Trees | meta 030 vertical order traversal | 314 | Medium | BFS with column index |
| Trees | meta 031 LCA with parent pointers | 1650 | Medium | Two pointers that switch lists |
| Trees | meta 035 all nodes distance k | 863 | Medium | Parent map + BFS |
| Trees | meta 036 BST to sorted doubly linked list | 426 | Medium | In-order, link prev and current |
| Trees | meta 037 binary tree max path sum | 124 | Hard | Gain from each side + global best |
| Graphs | meta 042 nested list weight sum | 339 | Medium | DFS with depth |
| Graphs | meta 038 shortest path in binary matrix | 1091 | Medium | BFS, 8 directions |
| Graphs | meta 039 clone graph | 133 | Medium | Old → new node map |
| Graphs | meta 040 accounts merge | 721 | Medium | Union-find on emails |
| Graphs | meta 041 making a large island | 827 | Hard | Island ids + area map |
| Backtracking | meta 043 subsets | 78 | Medium | Choose / skip |
| Backtracking | meta 044 permutations | 46 | Medium | Used flags |
| Backtracking | meta 045 letter combinations | 17 | Medium | One digit per level |
| DP | meta 046 word break | 139 | Medium | Prefix DP or memoised DFS |
| Backtracking | meta 047 remove invalid parentheses | 301 | Hard | BFS by removals, or counted DFS |

### Stage C — Timed pairs (40 minutes, no running code until both are dry-run)

Each pair mixes a task you have seen with one from a different topic, so you can't guess the
pattern in advance. Do them in order, then repeat with your own shuffles.

| Pair | Problem 1 (seen pattern) | Problem 2 (different topic) |
| --- | --- | --- |
| 1 | meta 001 valid palindrome II | meta 011 subarray sum equals k |
| 2 | algo 026 merge intervals | meta 039 clone graph |
| 3 | meta 002 min remove to make valid | meta 030 vertical order |
| 4 | algo 038 lowest common ancestor | meta 023 kth largest |
| 5 | meta 015 buildings ocean view | meta 038 shortest path in binary matrix |
| 6 | meta 004 valid word abbreviation | meta 013 random pick with weight |
| 7 | algo 039 right side view | meta 040 accounts merge |
| 8 | meta 016 max consecutive ones III | meta 027 copy random list |
| 9 | meta 022 search rotated array | meta 035 all nodes distance k |
| 10 | algo 015 minimum window | meta 024 k closest points |

### Stage D — The last week

| Day | Do | Then |
| --- | --- | --- |
| 1 | One timed pair, out loud | Re-read the mistake journal |
| 2 | One timed pair, recorded; watch it back | Redo two hinted/failed tasks |
| 3 | One timed pair | Write the heap and union-find templates from memory |
| 4 | One timed pair | Redo two hinted/failed tasks |
| 5 | One timed pair with someone else as interviewer, if possible | Re-read section 3 traps |
| 6 | One easy pair for confidence | Redo anything still not clean twice |
| 7 | Rest; skim the pattern table in section 2 | Sleep |

---

## 6. Progress log

Copy a row per attempt. Status: **C** clean, **H** hinted, **F** failed.

| Date | Task | Status | Time | Mistake or insight |
| --- | --- | --- | --- | --- |
| | | | | |
