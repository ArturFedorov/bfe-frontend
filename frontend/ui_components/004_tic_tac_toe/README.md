# 4. Tic-Tac-Toe

**Difficulty:** Easy  
**Topics:** Game logic, 2D arrays, state management

---

## Description

Build a Tic-Tac-Toe game engine. Players alternate placing X and O on a 3x3 board. The game detects wins (row, column, diagonal) and draws. The game prevents moves after a win and supports resetting.

## Requirements

- Players alternate between "X" and "O", starting with "X"
- `makeMove(row, col)` places the current player's mark and returns `true`, or `false` if invalid
- Detect wins across rows, columns, and both diagonals
- Detect a draw when the board is full with no winner
- Invalid moves: occupied cell, out of bounds, or game already won
- `reset()` clears the board and resets to player "X"
- `getBoard()` returns the current 3x3 board state
- `getWinner()` returns the winning player or `null`

## Examples

```ts
const game = createTicTacToe();

game.makeMove(0, 0); // X
game.makeMove(1, 1); // O
game.makeMove(0, 1); // X
game.makeMove(1, 0); // O
game.makeMove(0, 2); // X wins!

console.log(game.getWinner()); // 'X'
console.log(game.isDraw());    // false

game.reset();
console.log(game.getBoard());  // all nulls
```

## Approach Hints

<details>
<summary>Hint 1</summary>
Represent the board as a 2D array of <code>(string | null)[][]</code>. Initialize all cells to <code>null</code>.
</details>

<details>
<summary>Hint 2</summary>
After each move, check all 8 possible winning lines (3 rows, 3 columns, 2 diagonals). A line wins if all three cells are the same non-null value.
</details>

<details>
<summary>Hint 3</summary>
A draw occurs when every cell is non-null and there is no winner. Check this condition after verifying no win exists.
</details>
