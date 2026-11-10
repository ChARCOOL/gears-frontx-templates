import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { declarations } from "../../../__test-utils__/css-declarations";
import type { CalendarRef } from "../../../core/model";
import { englishTranslate as t } from "../../../i18n/english";
import { CalendarList } from "../calendar-list";
import type { CalendarListProps } from "../calendar-list";

import styles from "../calendar-list.module.css";
import calendarListCss from "../calendar-list.module.css?raw";

const CALENDARS: readonly CalendarRef[] = [
  { colorFamily: "turquoise", id: "cal-courses", name: "Courses" },
  { colorFamily: "purple", id: "cal-exams", name: "Exams" },
  { colorFamily: "orange", id: "cal-events", name: "Events" },
];

const baseProps = (
  overrides: Partial<CalendarListProps> = {}
): CalendarListProps => ({
  calendars: CALENDARS,
  direction: "ltr",
  hiddenCalendarIds: [],
  onHiddenCalendarIdsChange: vi.fn<() => void>(),
  t,
  ...overrides,
});

describe(CalendarList, () => {
  it("renders every calendar as a checked-by-default colour legend row", () => {
    render(<CalendarList {...baseProps()} />);

    expect(screen.getByRole("region", { name: "Calendars" })).toBeVisible();
    expect(screen.getByRole("checkbox", { name: "Courses" })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: "Exams" })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: "Events" })).toBeChecked();
  });

  it("derives checked state from hidden ids and emits the complete hidden-id list", async () => {
    const onHiddenCalendarIdsChange =
      vi.fn<(hiddenCalendarIds: readonly string[]) => void>();

    render(
      <CalendarList
        {...baseProps({
          hiddenCalendarIds: ["cal-exams"],
          onHiddenCalendarIdsChange,
        })}
      />
    );

    expect(screen.getByRole("checkbox", { name: "Courses" })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: "Exams" })).not.toBeChecked();

    const user = userEvent.setup();
    await user.click(screen.getByRole("checkbox", { name: "Courses" }));

    expect(onHiddenCalendarIdsChange).toHaveBeenCalledWith([
      "cal-exams",
      "cal-courses",
    ]);

    await user.click(screen.getByRole("checkbox", { name: "Exams" }));

    expect(onHiddenCalendarIdsChange).toHaveBeenLastCalledWith([]);
  });

  it("passes each calendar and hidden state to the renderCalendar slot", () => {
    const renderCalendar = vi.fn<
      (calendar: CalendarRef, hidden: boolean) => React.ReactNode
    >((calendar: CalendarRef, hidden: boolean) => (
      <span>{`${calendar.name}:${hidden ? "hidden" : "visible"}`}</span>
    ));

    render(
      <CalendarList
        {...baseProps({ hiddenCalendarIds: ["cal-exams"], renderCalendar })}
      />
    );

    expect(screen.getByText("Courses:visible")).toBeVisible();
    expect(screen.getByText("Exams:hidden")).toBeVisible();
    expect(renderCalendar).toHaveBeenCalledWith(CALENDARS[0], false);
    expect(renderCalendar).toHaveBeenCalledWith(CALENDARS[1], true);
  });

  it("uses the creation callback without inventing a creation form", async () => {
    const onCreateCalendar = vi.fn<() => void>();

    render(<CalendarList {...baseProps({ onCreateCalendar })} />);

    const create = screen.getByRole("button", { name: "Create calendar" });
    const user = userEvent.setup();
    await user.click(create);

    expect(onCreateCalendar).toHaveBeenCalledOnce();
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("allows the creation affordance to be replaced by a slot", () => {
    render(
      <CalendarList
        {...baseProps({
          renderCreateCalendar: () => (
            <button type="button">Open calendar settings</button>
          ),
        })}
      />
    );

    expect(
      screen.getByRole("button", { name: "Open calendar settings" })
    ).toBeVisible();
    expect(
      screen.queryByRole("button", { name: "Create calendar" })
    ).toBeNull();
  });

  it("renders the ordinary empty collection section when there are no calendars", () => {
    render(<CalendarList {...baseProps({ calendars: [] })} />);

    expect(screen.getByRole("region")).toBeInTheDocument();
    expect(screen.queryByRole("checkbox")).toBeNull();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("fills a checked blue calendar with the blue accent", () => {
    render(
      <CalendarList
        {...baseProps({
          calendars: [{ colorFamily: "blue", id: "cal-blue", name: "Blue" }],
        })}
      />
    );

    const forcedColors = calendarListCss.slice(
      calendarListCss.indexOf("@media (forced-colors: active)")
    );

    expect(screen.getByRole("checkbox", { name: "Blue" })).toHaveClass(
      styles.colorBlue
    );
    expect(
      declarations(calendarListCss, ".colorBlue").get("--calendar-color")
    ).toBe("var(--cal-color-blue-accent)");
    expect(
      declarations(calendarListCss, ".colorBlue[data-checked]").get(
        "background-color"
      )
    ).toBe("var(--calendar-color)");
    expect(
      declarations(forcedColors, ".colorBlue[data-checked]").get(
        "background-color"
      )
    ).toBe("Highlight");
  });

  it("gives lavender, violet and brown calendars their own accent class", () => {
    render(
      <CalendarList
        {...baseProps({
          calendars: [
            { colorFamily: "lavender", id: "cal-lavender", name: "Lavender" },
            { colorFamily: "violet", id: "cal-violet", name: "Violet" },
            { colorFamily: "brown", id: "cal-brown", name: "Brown" },
          ],
        })}
      />
    );

    expect(screen.getByRole("checkbox", { name: "Lavender" })).toHaveClass(
      styles.colorLavender
    );
    expect(screen.getByRole("checkbox", { name: "Violet" })).toHaveClass(
      styles.colorViolet
    );
    expect(screen.getByRole("checkbox", { name: "Brown" })).toHaveClass(
      styles.colorBrown
    );
    expect(
      declarations(calendarListCss, ".colorBrown").get("--calendar-color")
    ).toBe("var(--cal-color-brown-accent)");
  });

  it("mutes the name and the unticked box of a hidden calendar", () => {
    render(
      <CalendarList
        {...baseProps({ hiddenCalendarIds: ["cal-exams"] })}
      />
    );

    expect(screen.getByText("Exams")).toHaveAttribute("data-hidden");
    expect(screen.getByText("Courses")).not.toHaveAttribute("data-hidden");
    expect(screen.getByRole("checkbox", { name: "Exams" })).toHaveClass(
      styles.hiddenCheckbox
    );
    expect(
      declarations(calendarListCss, ".name[data-hidden]").get("color")
    ).toBe("var(--cal-color-muted)");
  });

  it("highlights a row on hover with the shared state colour", () => {
    expect(
      declarations(calendarListCss, ".row:hover").get("background-color")
    ).toBe("var(--cal-state-hover)");
  });

  describe("options menu", () => {
    const OPTION_CALENDARS: readonly CalendarRef[] = [
      {
        canDelete: true,
        canWrite: true,
        colorFamily: "blue",
        id: "cal-personal",
        isDefault: false,
        name: "Personal",
      },
      {
        canDelete: false,
        canWrite: true,
        colorFamily: "orange",
        id: "cal-events",
        isDefault: true,
        name: "Events",
      },
    ];

    const optionActions = () => ({
      onDeleteCalendar: vi.fn<(calendarId: string) => void>(),
      onMakeDefaultCalendar: vi.fn<(calendarId: string) => void>(),
      onShowOnlyCalendar: vi.fn<(calendarId: string) => void>(),
      onShowPreviouslyVisible: vi.fn<() => void>(),
    });

    it("renders no options button when no option callback is passed", () => {
      render(<CalendarList {...baseProps()} />);

      expect(screen.queryByRole("button", { name: /Options for/ })).toBeNull();
    });

    it("opens the menu with Show only, Make default and Delete", async () => {
      const user = userEvent.setup();

      render(
        <CalendarList
          {...baseProps({ calendars: OPTION_CALENDARS, ...optionActions() })}
        />
      );

      await user.click(
        screen.getByRole("button", { name: "Options for Personal" })
      );

      expect(
        screen.getByRole("button", { name: "Show only this calendar" })
      ).toBeEnabled();
      expect(
        screen.getByRole("button", { name: "Make default" })
      ).toBeEnabled();
      expect(screen.getByRole("button", { name: "Delete" })).toBeEnabled();
    });

    it("disables Make default for the default calendar and Delete without permission", async () => {
      const user = userEvent.setup();

      render(
        <CalendarList
          {...baseProps({ calendars: OPTION_CALENDARS, ...optionActions() })}
        />
      );

      await user.click(screen.getByRole("button", { name: "Options for Events" }));

      expect(
        screen.getByRole("button", { name: "Make default" })
      ).toBeDisabled();
      expect(screen.getByRole("button", { name: "Delete" })).toBeDisabled();
    });

    it("shows only the calendar and closes the menu", async () => {
      const user = userEvent.setup();
      const actions = optionActions();

      render(
        <CalendarList
          {...baseProps({ calendars: OPTION_CALENDARS, ...actions })}
        />
      );

      await user.click(
        screen.getByRole("button", { name: "Options for Personal" })
      );
      await user.click(
        screen.getByRole("button", { name: "Show only this calendar" })
      );

      expect(actions.onShowOnlyCalendar).toHaveBeenCalledWith("cal-personal");
      expect(
        screen.queryByRole("button", { name: "Make default" })
      ).toBeNull();
    });

    it("offers Show previously visible on the calendar shown alone", async () => {
      const user = userEvent.setup();
      const actions = optionActions();

      render(
        <CalendarList
          {...baseProps({
            calendars: OPTION_CALENDARS,
            soloCalendarId: "cal-personal",
            ...actions,
          })}
        />
      );

      await user.click(
        screen.getByRole("button", { name: "Options for Personal" })
      );

      expect(
        screen.queryByRole("button", { name: "Show only this calendar" })
      ).toBeNull();
      await user.click(
        screen.getByRole("button", { name: "Show previously visible" })
      );

      expect(actions.onShowPreviouslyVisible).toHaveBeenCalledOnce();
    });

    it("makes and deletes the calendar through its callbacks", async () => {
      const user = userEvent.setup();
      const actions = optionActions();

      render(
        <CalendarList
          {...baseProps({ calendars: OPTION_CALENDARS, ...actions })}
        />
      );

      await user.click(
        screen.getByRole("button", { name: "Options for Personal" })
      );
      await user.click(screen.getByRole("button", { name: "Make default" }));

      expect(actions.onMakeDefaultCalendar).toHaveBeenCalledWith("cal-personal");

      await user.click(
        screen.getByRole("button", { name: "Options for Personal" })
      );
      await user.click(screen.getByRole("button", { name: "Delete" }));

      expect(actions.onDeleteCalendar).toHaveBeenCalledWith("cal-personal");
    });
  });
});
