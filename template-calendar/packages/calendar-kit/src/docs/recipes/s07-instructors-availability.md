# S7: Instructors availability

The S6 grid with sparse data. Each instructor has cells only for the hours they teach or are free.

Parts: `AvailabilityGrid`.
Props: as S6. Use `headerFormat="weekday"` when the column shows only the weekday.

<!-- generated:example demo/examples/recipes/s07-instructors-availability.tsx -->

```tsx
// demo/examples/recipes/s07-instructors-availability.tsx
import { useState } from "react";

import { AvailabilityGrid } from "@gears-frontx/calendar-kit";
import type { CalendarSelectionRange } from "@gears-frontx/calendar-kit";

import { hourCells } from "./schedule-fixtures";

// Only the hours an instructor checked are passed as cells, so the rest stay unpainted.
const instructorCells = hourCells("2026-09-21", 9, 12);

export function InstructorAvailability() {
  const [selected, setSelected] = useState<CalendarSelectionRange | null>(null);

  return (
    <AvailabilityGrid
      cells={instructorCells}
      headerFormat="weekday"
      onSelectedRangeChange={setSelected}
      paintMode="cells"
      selectedRange={selected}
      showHourLabels
    />
  );
}
```

<!-- /generated -->

Rules:

- Build `cells` from host data in one place. Keep one grid per instructor.
- The grid paints only the cells it gets. Hours with no cell are not paintable.
