import { WeekGrid } from "@gears-frontx/calendar-kit";
import type { CalendarDate, CalendarEvent } from "@gears-frontx/calendar-kit";

export const ExamWeek = ({
  date,
  events,
  conflictIds,
}: {
  readonly date: CalendarDate;
  readonly events: readonly CalendarEvent[];
  readonly conflictIds: ReadonlySet<string>;
}) => (
  <WeekGrid
    date={date}
    events={events}
    getEventFrameProps={({ event }) =>
      conflictIds.has(event.id)
        ? { className: "exam-conflict", "data-tone": "conflict" }
        : undefined
    }
  />
);
