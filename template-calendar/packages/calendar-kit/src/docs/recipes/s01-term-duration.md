# S1: Term duration

Pick a date range inside one month, for example a term from 8 to 26 September. Days outside the term are blocked. The host keeps the range and clears it on demand.

Parts: `MonthGrid`.
Props: `selectionMode="date-range"`, `selectedDateRange`, `onSelectedDateRangeChange`, `getCellState`, `weekNumbering` (`{ termStart }`), `trailingGutter`.

<!-- generated:example demo/examples/recipes/s01-term-duration.tsx -->

```tsx
// demo/examples/recipes/s01-term-duration.tsx
import { useState } from "react";

import { MonthGrid, calendarDate } from "@gears-frontx/calendar-kit";
import type { CalendarDateRange } from "@gears-frontx/calendar-kit";

const termStart = calendarDate("2026-09-08");
const termEnd = calendarDate("2026-09-26");

const isOutsideTerm = (date: string): boolean =>
  date < termStart || date > termEnd;

export function TermDurationPicker() {
  const [range, setRange] = useState<CalendarDateRange | null>(null);

  return (
    <>
      <button type="button" onClick={() => setRange(null)}>
        Clear
      </button>
      <MonthGrid
        date={calendarDate("2026-09-01")}
        events={[]}
        getCellState={(cell) =>
          isOutsideTerm(cell.date) ? { unavailable: true } : undefined
        }
        onSelectedDateRangeChange={setRange}
        selectedDateRange={range}
        selectionMode="date-range"
        trailingGutter
        weekNumbering={{ termStart }}
      />
    </>
  );
}
```

<!-- /generated -->

Rules:

- `selectedDateRange={null}` is controlled and empty. `undefined` is uncontrolled.
- `getCellState` marks a day `unavailable`, which blocks it visually. The day stays in the range, so the host removes it when it saves the term.
- Term week numbers need `weekNumbering={{ termStart }}`. The default is `"month"`.
- Memoize `getCellState` when it depends on host data. It runs for every cell on each render.
