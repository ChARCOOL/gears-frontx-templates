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
