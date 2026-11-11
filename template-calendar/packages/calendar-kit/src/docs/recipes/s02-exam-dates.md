# S2: Exam dates

The same term picker as S1, with a different colour for the selection. Use it for a second kind of range that sits on the same month view.

Parts: `MonthGrid`.
Props: as S1.

<!-- generated:example demo/examples/recipes/s02-exam-dates.tsx -->

```tsx
// demo/examples/recipes/s02-exam-dates.tsx
import { useState } from "react";

import { MonthGrid, calendarDate } from "@gears-frontx/calendar-kit";
import type { CalendarDateRange } from "@gears-frontx/calendar-kit";

// Host CSS on `.exam-term` sets the purple selection tokens for this subtree.
export function ExamDatesPicker() {
  const [range, setRange] = useState<CalendarDateRange | null>(null);

  return (
    <div className="exam-term">
      <MonthGrid
        date={calendarDate("2026-09-01")}
        events={[]}
        onSelectedDateRangeChange={setRange}
        selectedDateRange={range}
        selectionMode="date-range"
        trailingGutter
        weekNumbering={{ termStart: calendarDate("2026-09-08") }}
      />
    </div>
  );
}
```

<!-- /generated -->

Rules:

- The colour comes from host CSS on a wrapper. Set the `--cal-*` selection tokens on the wrapper class. Do not target kit class names.
- A token set on a wrapper reaches every descendant that reads it, so keep the wrapper to the month grid only.
