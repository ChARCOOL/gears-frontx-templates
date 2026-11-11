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
