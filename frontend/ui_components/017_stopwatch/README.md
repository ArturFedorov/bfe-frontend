# 17. Stopwatch

**Difficulty:** Medium  
**Topics:** Timers, setInterval, state management, time calculation

---

## Description

Build a stopwatch that tracks elapsed time with start, stop, reset, and lap functionality. The stopwatch uses intervals internally and exposes methods to control and query its state.

## Requirements

- `start()` begins or resumes the stopwatch
- `stop()` pauses the stopwatch without resetting
- `reset()` stops the stopwatch and clears elapsed time and laps
- `lap()` records the current elapsed time as a lap entry
- `getElapsed()` returns the total elapsed time in milliseconds
- `getLaps()` returns an array of all recorded lap times in milliseconds
- `isRunning()` returns `true` if the stopwatch is currently running
- Calling `start()` after `stop()` resumes from where it left off

## Examples

```ts
const sw = createStopwatch();

sw.start();
// ... some time passes ...
sw.lap();
sw.lap();
sw.stop();

console.log(sw.getElapsed()); // elapsed ms
console.log(sw.getLaps()); // [lap1ms, lap2ms]
console.log(sw.isRunning()); // false

sw.reset();
console.log(sw.getElapsed()); // 0
console.log(sw.getLaps()); // []
```

## Approach Hints

<details>
<summary>Hint 1</summary>
Store a <code>startTime</code> (from <code>Date.now()</code>) when starting, and an <code>accumulated</code> variable for time elapsed before the last stop. Elapsed = accumulated + (Date.now() - startTime).
</details>

<details>
<summary>Hint 2</summary>
On <code>stop()</code>, add <code>Date.now() - startTime</code> to <code>accumulated</code> and clear <code>startTime</code>. On <code>start()</code>, set <code>startTime = Date.now()</code>.
</details>

<details>
<summary>Hint 3</summary>
For laps, push the current <code>getElapsed()</code> value into an array each time <code>lap()</code> is called.
</details>
