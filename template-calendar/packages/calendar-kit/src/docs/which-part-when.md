# Which part when

Find the goal in the first column, then use the component and prop in the second. The recipe in the last column has a sample that compiles.

| Goal | Component and prop | Recipe |
|---|---|---|
| Pick a date range in a month | `MonthGrid` `selectionMode="date-range"`, `selectedDateRange` | [S1](recipes/s01-term-duration.md) |
| Weekly grid with breaks | `WeekGrid` `visibleHours`, `slotMinutes`, `timeRanges` | [S4](recipes/s04-weekly-hours.md) |
| Paint availability by cell | `AvailabilityGrid` `paintMode="cells"`, `selectedRange` | [S6](recipes/s06-rooms-availability.md) |
| Add rows or columns to a painted set | `addAvailabilityCells`, `onHourClick`, `onDayClick` | [S8](recipes/s08-timeslot-hours.md) |
| Custom content in a cell | `renderCell`, with host `state` on each cell | [S11](recipes/s11-slot-picker.md) |
| Blocked days in a month | `getCellState` returning `{ unavailable: true }` | [S1](recipes/s01-term-duration.md) |
| Card with metadata rows | `WeekGrid` `renderEventMetadata`, or `EventCard` `renderMetadata` | [S5](recipes/s05-week-rich-cards.md) |
| Compact card with one joined line | `renderEvent` with `EventCard` `renderTitle`, `renderTime`, `renderMetadata` | [E2](recipes/e02-event-term.md) |
| Conflict look on a whole card | `getEventFrameProps` (`className`, `data-tone`) | [E1](recipes/e01-exam-term-solutions.md) |
| Hidden events behind a chip | `maxEventsPerSlot` with `onOverflowSelect` | [S12](recipes/s12-solutions-calendar.md) |
| Greyed weekend or closed-day header | `WeekGrid` `renderHeader`, using `date` | [E1](recipes/e01-exam-term-solutions.md) |
| Detail in a host sheet | `EventDetailContent`, `EventDetailSection`, `EventDetailRow`, `EventDetailDivider` | [E3](recipes/e03-event-detail-sheet.md) |
| Detail next to a card | `EventDetailPanel` `open` (host places it) | [E5](recipes/e05-event-popover.md) |
| Toolbar version select, filters, primary action | `CalendarToolbar` `renderLeading`, `renderTrailing` | [S12](recipes/s12-solutions-calendar.md) |
| Create-event form in a dialog | `CreateEventPanel` | [E6](recipes/e06-create-dialog.md) |
| Host page with its own inputs | none. Use host form controls | [E4](recipes/e04-event-wizard.md) |

## Invariants

- `busy` events are inert. No selection and no drag. A clickable block needs `access: "full"`.
- `available: false` makes an event unavailable and ignores activation. On `AvailabilityGrid` it blocks painting.
- `renderActions` replaces the kit's edit and delete buttons. The host wires its own handlers.
- `maxEventsPerSlot` needs `onOverflowSelect`.
- Do not put range or selection logic in `renderCell`. Use `selectedDateRange` or `selectedRange`.
- Do not add a second background layer beside `timeRanges` or `workingHours`.
- Keep the `columnheader` role when you use `renderHeader`.
- Do not set `outline` in `getEventFrameProps`. The focus ring owns it.
- Memoize `getCellState` and `renderCell` results, or key them by cell key. They run for every cell on each render.
- Do not read colours from hex. Use `colorFamily` and the `--cal-*` tokens.
- New strings go into `src/i18n/en.json`, under the `calendar.<area>.<camelCase>` key style.
