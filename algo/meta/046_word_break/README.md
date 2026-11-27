# 046. Word Break (LeetCode 139)

**Difficulty:** Medium
**Topics:** Dynamic Programming, Memoization, Hash Set, String

---

## Description

Given a string `s` and a list of dictionary words `wordDict`, return `true` if
`s` can be split into a sequence of one or more dictionary words laid end to
end, and `false` otherwise. A dictionary word may be used any number of times.

## Examples

```ts
wordBreak('leetcode', ['leet', 'code']); // true  ('leet' + 'code')

wordBreak('applepenapple', ['apple', 'pen']); // true  (reuses 'apple')

wordBreak('catsandog', ['cats', 'dog', 'sand', 'and', 'cat']); // false
```

## Constraints

- `1 <= s.length <= 300`
- `1 <= wordDict.length <= 1000`
- `1 <= wordDict[i].length <= 20`
- `s` and every `wordDict[i]` consist of lowercase English letters.
- All words in `wordDict` are unique.

## Target

O(n · L) substring checks (n = `s.length`, L = longest word) with a boolean DP
array `dp[i]` = "prefix of length `i` can be segmented" and a `Set` of words;
O(n + total dictionary size) space. The large-input test (`'aaa…ab'` with
dictionary `['a', 'aa', 'aaa', …]`) makes plain recursion without memoization
explore exponentially many splits and time out.

## Interviewer follow-up

- **LC 140 — Word Break II:** return every valid segmentation as space-joined sentences. (Memoized DFS returning lists; output can be exponential.)
- Why is limiting the inner loop to the longest dictionary word a meaningful optimization? When would a Trie beat a `Set`?
- Top-down memoized DFS vs bottom-up DP — trade-offs in stack depth and readability.
