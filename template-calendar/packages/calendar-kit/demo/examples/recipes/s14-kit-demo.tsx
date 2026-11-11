import { EventCard } from "@gears-frontx/calendar-kit";

import { timedEvent } from "./schedule-fixtures";

const event = timedEvent({
  colorFamily: "violet",
  date: "2026-09-21",
  end: "11:00",
  id: "demo",
  location: "Room A-12",
  start: "09:00",
  title: "Design review",
});

// EventCard works standalone. Inside WeekGrid, use renderEventMetadata instead.
export function KitDemoCard() {
  return (
    <EventCard
      event={event}
      renderMetadata={() => <span>Room A-12</span>}
    />
  );
}
