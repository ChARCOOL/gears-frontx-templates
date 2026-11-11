import { useState } from "react";

import { EventDetailPanel } from "@gears-frontx/calendar-kit";
import type { CalendarEvent } from "@gears-frontx/calendar-kit";

interface Props {
  readonly event: CalendarEvent;
}

// The kit has no anchored popover. The host places this panel and passes
// `open`, and the panel keeps its own edit, delete and close controls.
export function EventPopover({ event }: Props) {
  const [open, setOpen] = useState(true);

  return (
    <EventDetailPanel
      event={event}
      onDelete={(target) => {
        void target;
      }}
      onEdit={(target) => {
        void target;
      }}
      onClose={() => setOpen(false)}
      onOpenChange={setOpen}
      open={open}
      renderActions={() => <button type="button">Delete</button>}
      renderMetadata={(current) => <span>{current.location}</span>}
    />
  );
}
