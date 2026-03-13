# 19. Calendar

**Difficulty:** Hard  
**Topics:** DOM manipulation, date math, event handling, state management

---

## Description

Build a calendar date picker that displays a month grid. Users can click to select a date, navigate between months, and optionally constrain selectable dates to a min/max range.

## Requirements

- Render a month view grid showing day numbers for the current month
- Display the month name and year as a header
- Clicking a day cell selects that date and calls the `onSelect` callback
- `nextMonth()` and `prevMonth()` navigate between months and re-render
- `minDate` and `maxDate` options disable dates outside the range (they should not be selectable)
- `getSelected()` returns the currently selected `Date` or `null`
- `setDate(date)` programmatically selects a date and navigates to its month
- `destroy()` removes all listeners and cleans up the DOM

## Examples

```ts
const container = document.getElementById('calendar')!;

const cal = createCalendar({
  container,
  initialDate: new Date(2024, 0, 15),
  onSelect: (date) => console.log('Selected:', date),
  minDate: new Date(2024, 0, 1),
  maxDate: new Date(2024, 11, 31),
});

cal.nextMonth();
cal.setDate(new Date(2024, 5, 20));
console.log(cal.getSelected()); // Date object for June 20, 2024
cal.destroy();
```

## Approach Hints

<details>
<summary>Hint 1</summary>
Use <code>new Date(year, month, 1).getDay()</code> to determine the starting weekday of the month, and <code>new Date(year, month + 1, 0).getDate()</code> to get the number of days in the month.
</details>

<details>
<summary>Hint 2</summary>
Render a 7-column grid (Sun–Sat). Fill the first row with empty cells for days before the 1st, then fill cells with day numbers. Add a <code>disabled</code> class to cells outside the min/max range.
</details>

<details>
<summary>Hint 3</summary>
Store <code>viewYear</code> and <code>viewMonth</code> separately from the selected date. Navigation updates the view, while selection updates the selected date.
</details>
