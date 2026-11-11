# E5: Event detail popover

An event detail panel shown next to a card, with a two-line title, edit, delete, close, time zone and description.

Parts: `EventDetailPanel`.
Props: `event`, `open`, `onOpenChange`, `onClose`, `onEdit`, `onDelete`, `renderActions`, `renderMetadata`.

<!-- generated:example demo/examples/recipes/e05-event-popover.tsx -->

```tsx
// demo/examples/recipes/e05-event-popover.tsx
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
```

<!-- /generated -->

Rules:

- `EventDetailPanel` is controlled by `open`. The kit draws it inline and has no anchored popover in gears.
- To place it next to a card, the host wraps the content in its own popover and passes the card position.
- `renderActions` replaces the edit and delete buttons, so the host sets the delete look.
