# CreateEventPopover

`CreateEventPopover` is a host-neutral create-event form. It accepts a neutral `CreateEventDraft`, injected calendar/resource options, a translation callback, an optional `now?: UtcInstant` reference instant, and an `onSubmit` callback; it does not call application APIs or create adapters.

The form renders inline in the host container and is shadow-root safe; the host places it. Use `defaultDraft`/`defaultOpen` for uncontrolled usage, or pair the controlled props with their change callbacks.

## Props

<!-- generated:props CreateEventPopoverProps -->

| Prop | Type | Required | Description |
| --- | --- | --- | --- |
| `calendars` | `readonly CalendarRef[]` | yes | Calendars offered in the schedule field. |
| `conferencingProviders` | `readonly CalendarResourceOption[]` | yes | Conferencing providers offered in the conferencing select. |
| `locations` | `readonly CalendarResourceOption[]` | yes | Locations offered in the location combobox. |
| `onCancel` | `() => void` | yes | Called when the form closes without saving: a clean cancel, or a confirmed discard. |
| `onSubmit` | `(draft: CreateEventDraft) => Promise<CreateEventResult> \| undefined` | yes | Called with a valid draft; a returned `error` keeps the form open. |
| `people` | `readonly CalendarResourceOption[]` | yes | People offered in the people combobox. |
| `className` | `string` |  | Class added to the component root. |
| `defaultDraft` | `CreateEventDraft` |  | Initial draft when uncontrolled. Also the baseline for the unsaved-changes check. |
| `defaultOpen` | `boolean` |  | Initial open state when uncontrolled. |
| `draft` | `CreateEventDraft` |  | Controlled draft. |
| `kind` | `CreateEventKind` |  | Kind the form edits. `reminder` shows the reminder fields and hides the event-only ones. |
| `now` | `UtcInstant` |  | Reference instant for the time-zone offset label. |
| `onDraftChange` | `(draft: CreateEventDraft) => void` |  | Called on every field edit. |
| `onKindChange` | `(kind: CreateEventKind) => void` |  | Shows the Event/Reminder switch in the header and reports the kind the user picks. |
| `onOpenChange` | `(open: boolean) => void` |  | Called on open and close, including after submit and a confirmed discard. |
| `open` | `boolean` |  | Controlled open state. |
| `ref` | `((instance: CreateEventPopoverHandle \| null) => void \| (() => VoidOrUndefinedOnly)) \| Ref…` |  | Lets the host close the form through its own unsaved-changes prompt. |
| `renderError` | `(error: CreateEventSubmitError) => ReactNode` |  | Replaces how a submit error is shown. |
| `renderFields` | `() => ReactNode` |  | Extra host fields rendered after the kit's fields. |
| `renderFooter` | `() => ReactNode` |  | Content added above the Cancel/Save row. |
| `renderHeader` | `() => ReactNode` |  | Content added below the header row. |

Also accepts the shared props `direction`, `locale`, `messages`, `t`, `timeZone`, `translations`; see [Internationalization](../../docs/i18n.md#per-component-overrides).
<!-- /generated -->

## Behaviour

- The header shows an event-type title (`Event` by default), a slot for host header content, a close icon action with its accessible label, and a divider. The body scrolls inside its region above the Cancel/Save footer.
- Title, schedule, time range, all-day switch, dates with a day count once they span a day, recurrence, timezone, people, conferencing, location, and description fields update one draft.
- With `onKindChange`, the header shows an Event/Reminder switch and `kind` selects the form. Reminder shows title, URL, time range, all-day, and repeat; it hides calendar, time zone, people, conferencing, location, and description, and switching to it clears those draft fields. Switching to Event clears `url`. The URL must be an `http(s)` link without credentials, at most 2048 characters, and shows `Enter a valid value` while invalid.
- Dates and times use the large icon-left field treatment; the schedule shows its calendar colour as a dot in the selected value and each option, and people tags use stroke tags with dismiss and clear-all actions.
- Timed events leave the end date empty when it is the same as the start date; the day-span indicator is shown only for a positive span.
- Date rows are masked date inputs: the locale's date mask is typed segment by segment and commits as soon as it parses, the calendar button ahead of the value (or `Alt+ArrowDown`) opens a picker whose selection writes the row directly, and the optional end date clears from the trailing clear button.
- The location control starts as a secondary `Add a location` action and opens the injected location combobox when requested.
- The people and location comboboxes use the shared 36px form-field skin; selected people use 24px removable chips inside the same form-layer frame.
- Timed and all-day ranges are validated by the React-free core helper before `onSubmit` runs. The Save action is disabled while the draft is invalid or submitting.
- Repeat offers Doesn’t repeat, Daily, Weekly, Biweekly, Monthly, Yearly and Custom. The Custom option's label never changes, whatever rule it holds.
- Custom expands an editor inline under the Repeat field; the interval is a number field from 1 to 30. Every change is written to the draft immediately as an RFC 5545 rule body such as `FREQ=WEEKLY;BYDAY=MO,WE`. While it is open, the other fields and Save are disabled and Repeat stays live. Save keeps the rule, Cancel restores the preset and rule from when it opened, and Escape collapses it like Save. Choosing another preset closes it; choosing Custom again reopens the saved rule. Weekday choices are toggle buttons in display order; `Ends: Never` omits an end and `Ends: On` appends `UNTIL=YYYYMMDD`.
- A one-line summary under the Repeat field describes the current rule for every choice, for example "Repeats every 2 weeks on Tuesday and Thursday until Wed, Sep 30, 2026". "Does not repeat" shows no summary.
- A pending submit disables duplicate attempts. A host error is rendered without closing the form.
- A clean cancel closes immediately. A dirty cancel, or an outside press in a dirty form, opens an alert dialog with keep-editing and discard actions; that press does not reach its target. An outside press in a clean form does nothing. Confirmed discard closes the form.
- `ref` takes a `CreateEventPopoverHandle`; its `requestCancel()` runs the same cancel path as the close control and resolves `true` once the form closed, or `false` when the user kept editing or a save is running.
- `renderHeader`, `renderFields`, `renderFooter`, `renderError`, and shell render props provide host composition without app imports.

All labels come from `t`; `locale`, `timeZone`, `direction`, and `now` are presentation inputs. When `now` is omitted, the time-zone label follows the wall clock. The title is plain text, and the kit does not invent an event-type data contract.

## Messages

Translate these ids, or override them with `translations`; see [Internationalization](../../docs/i18n.md).

<!-- generated:messages calendar.create_event -->

| Translation ID | English | Values |
| --- | --- | --- |
| `calendar.create_event.all_day` | All day |  |
| `calendar.create_event.back` | Back |  |
| `calendar.create_event.calendarSchedule` | Schedule: |  |
| `calendar.create_event.cancel` | Cancel |  |
| `calendar.create_event.close` | Close |  |
| `calendar.create_event.create_dialog` | Create event |  |
| `calendar.create_event.dayCount_one` | {{count}} day | `count` |
| `calendar.create_event.dayCount_other` | {{count}} days | `count` |
| `calendar.create_event.discard.confirm` | Discard |  |
| `calendar.create_event.discard.keep` | Keep |  |
| `calendar.create_event.discard.message` | Discard unsaved changes? |  |
| `calendar.create_event.discard.title` | Changed |  |
| `calendar.create_event.error.endBeforeStart` | End must be after start |  |
| `calendar.create_event.error.invalid` | Enter a valid value |  |
| `calendar.create_event.error.required` | Title is required |  |
| `calendar.create_event.field.calendar` | Calendar |  |
| `calendar.create_event.field.conferencing` | Conferencing |  |
| `calendar.create_event.field.description` | Description |  |
| `calendar.create_event.field.end_date` | End date |  |
| `calendar.create_event.field.end_time` | End time |  |
| `calendar.create_event.field.location` | Location |  |
| `calendar.create_event.field.people` | People |  |
| `calendar.create_event.field.repeat` | Repeat |  |
| `calendar.create_event.field.start_date` | Start date |  |
| `calendar.create_event.field.start_time` | Start time |  |
| `calendar.create_event.field.timezone` | Time zone |  |
| `calendar.create_event.field.title` | Title |  |
| `calendar.create_event.field.url` | URL |  |
| `calendar.create_event.kind.event` | Event |  |
| `calendar.create_event.kind.label` | Event type |  |
| `calendar.create_event.kind.reminder` | Reminder |  |
| `calendar.create_event.location.no_results` | No locations |  |
| `calendar.create_event.no_options` | No options available |  |
| `calendar.create_event.people.no_results` | No people |  |
| `calendar.create_event.placeholder.calendar` | Choose a calendar |  |
| `calendar.create_event.placeholder.conferencing` | Add conferencing |  |
| `calendar.create_event.placeholder.location` | Add a location |  |
| `calendar.create_event.placeholder.people` | Add people |  |
| `calendar.create_event.placeholder.url` | Add a URL |  |
| `calendar.create_event.repeat.biweekly` | Biweekly |  |
| `calendar.create_event.repeat.custom` | Custom… |  |
| `calendar.create_event.repeat.daily` | Daily |  |
| `calendar.create_event.repeat.ends` | Ends |  |
| `calendar.create_event.repeat.every` | Every |  |
| `calendar.create_event.repeat.hint.daily` | Repeats every day |  |
| `calendar.create_event.repeat.hint.dailyEvery_one` | Repeats every {{count}} day | `count` |
| `calendar.create_event.repeat.hint.dailyEvery_other` | Repeats every {{count}} days | `count` |
| `calendar.create_event.repeat.hint.monthly` | Repeats every month on day {{day}} | `day` |
| `calendar.create_event.repeat.hint.monthlyEvery_one` | Repeats every {{count}} month on day {{day}} | `count`, `day` |
| `calendar.create_event.repeat.hint.monthlyEvery_other` | Repeats every {{count}} months on day {{day}} | `count`, `day` |
| `calendar.create_event.repeat.hint.until` | {{frequency}} until {{date}} | `frequency`, `date` |
| `calendar.create_event.repeat.hint.weekly` | Repeats every week on {{weekdays}} | `weekdays` |
| `calendar.create_event.repeat.hint.weeklyEvery_one` | Repeats every {{count}} week on {{weekdays}} | `count`, `weekdays` |
| `calendar.create_event.repeat.hint.weeklyEvery_other` | Repeats every {{count}} weeks on {{weekdays}} | `count`, `weekdays` |
| `calendar.create_event.repeat.hint.yearly` | Repeats every year on {{date}} | `date` |
| `calendar.create_event.repeat.hint.yearlyEvery_one` | Repeats every {{count}} year on {{date}} | `count`, `date` |
| `calendar.create_event.repeat.hint.yearlyEvery_other` | Repeats every {{count}} years on {{date}} | `count`, `date` |
| `calendar.create_event.repeat.monthly` | Monthly |  |
| `calendar.create_event.repeat.never` | Never |  |
| `calendar.create_event.repeat.none` | Doesn’t repeat |  |
| `calendar.create_event.repeat.on` | on {{weekday}} | `weekday` |
| `calendar.create_event.repeat.on_date` | On |  |
| `calendar.create_event.repeat.onWeekdays` | On |  |
| `calendar.create_event.repeat.unit_label` | every {{count}} {{unit}} | `count`, `unit` |
| `calendar.create_event.repeat.unit.day_one` | day |  |
| `calendar.create_event.repeat.unit.day_other` | days |  |
| `calendar.create_event.repeat.unit.month_one` | month |  |
| `calendar.create_event.repeat.unit.month_other` | months |  |
| `calendar.create_event.repeat.unit.week_one` | week |  |
| `calendar.create_event.repeat.unit.week_other` | weeks |  |
| `calendar.create_event.repeat.weekly` | Weekly |  |
| `calendar.create_event.repeat.yearly` | Yearly |  |
| `calendar.create_event.save` | Save |  |
| `calendar.create_event.saving` | Saving… |  |
| `calendar.create_event.submitError` | Unable to create event |  |
| `calendar.create_event.weekday.friday` | Friday |  |
| `calendar.create_event.weekday.monday` | Monday |  |
| `calendar.create_event.weekday.saturday` | Saturday |  |
| `calendar.create_event.weekday.sunday` | Sunday |  |
| `calendar.create_event.weekday.thursday` | Thursday |  |
| `calendar.create_event.weekday.tuesday` | Tuesday |  |
| `calendar.create_event.weekday.wednesday` | Wednesday |  |

<!-- /generated -->

<!-- generated:messages calendar.dateField -->

| Translation ID                    | English       | Values |
| --------------------------------- | ------------- | ------ |
| `calendar.dateField.chooseDate`   | Choose date   |        |
| `calendar.dateField.clear`        | Clear date    |        |
| `calendar.dateField.openCalendar` | Open calendar |        |

<!-- /generated -->

## Related

- [WeekGrid](../week-grid/week-grid.md)
- [DayGrid](../day-grid/day-grid.md)
- [Customization](../../docs/customization.md)
- [Recipes](../../docs/recipes.md)
