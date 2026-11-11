# E6: Create dialog

The create-event form as a dialog. The form takes the host's calendars, people and locations, and returns an error to keep itself open when the host rejects a draft.

Parts: `CreateEventPanel`.
Props: `calendars`, `people`, `locations`, `conferencingProviders`, `defaultOpen`, `onCancel`, `onSubmit`, `renderFields`, `renderFooter`, `renderError`.

<!-- generated:example demo/examples/recipes/e06-create-dialog.tsx -->

```tsx
// demo/examples/recipes/e06-create-dialog.tsx
import { CreateEventPanel } from "@gears-frontx/calendar-kit";

// Calendars, people and locations are host lists. The form returns an error
// to keep itself open when the host rejects a draft.
export function CreateDialog() {
  return (
    <CreateEventPanel
      calendars={[]}
      conferencingProviders={[]}
      defaultOpen
      locations={[]}
      onCancel={() => undefined}
      onSubmit={() => undefined}
      people={[]}
    />
  );
}
```

<!-- /generated -->

Rules:

- `onSubmit` returns `{ error }` to keep the form open. Return nothing to close it.
- The unsaved-changes guard runs on close. `onCancel` runs after a clean cancel or a confirmed discard.
- The expanded layout is an internal toggle with two columns. People sit on the right in expanded mode. The host has no prop to force it.
- The "0 days" label is not shown at zero. It shows for one or more days.
