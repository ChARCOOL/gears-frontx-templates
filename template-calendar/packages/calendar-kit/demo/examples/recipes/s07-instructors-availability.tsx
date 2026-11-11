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
