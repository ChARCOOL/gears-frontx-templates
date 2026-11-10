import { fireEvent, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  timedEvent as fixtureTimedEvent,
  UTC,
} from "../../../__test-utils__/fixtures";
import type { CalendarEvent } from "../../../core/model";
import { calendarDate, parseLocalTime, utcInstant } from "../../../core/model";
import { englishTranslate as t } from "../../../i18n/english";
import { DayGrid } from "../day-grid";

// jsdom has no layout, so each hour row is given a fixed height for the pointer-to-slot lookup.
const rowHeight = 43;

const rowCenter = (hour: number): number => hour * rowHeight + rowHeight / 2;

const stubRowRects = (): void => {
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(
    function (this: HTMLElement) {
      const rows = Array.from(
        this.closest("section")?.querySelectorAll('[role="gridcell"]') ?? []
      );
      const index = rows.indexOf(this);

      return index < 0
        ? new DOMRect()
        : new DOMRect(0, index * rowHeight, 100, rowHeight);
    }
  );
};

const gridCells = (container: HTMLElement): HTMLElement[] =>
  Array.from(container.querySelectorAll<HTMLElement>('[role="gridcell"]'));

const architecture: CalendarEvent = fixtureTimedEvent({
  attendees: [],
  calendarId: null,
  colorFamily: "turquoise",
  conferencingProviderId: null,
  description: "",
  end: utcInstant("2026-08-24T10:00:00.000Z"),
  endDate: calendarDate("2026-08-24"),
  endTime: parseLocalTime("10:00"),
  id: "architecture",
  location: null,
  recurrenceRule: null,
  start: utcInstant("2026-08-24T09:00:00.000Z"),
  startDate: calendarDate("2026-08-24"),
  startTime: parseLocalTime("09:00"),
  timeZone: UTC,
  title: "Architecture",
});

const baseProps = {
  date: calendarDate("2026-08-24"),
  events: [architecture],
  locale: "en-US",
  now: utcInstant("2026-08-23T06:00:00.000Z"),
  t,
  timeZone: UTC,
};

describe("DayGrid paint-and-move", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("paints a range from pointer down to pointer up as one selection", () => {
    stubRowRects();
    const onPaintSelect = vi.fn();
    const { container } = render(
      <DayGrid
        {...baseProps}
        events={[]}
        interactionMode="paint-and-move"
        onPaintSelect={onPaintSelect}
      />
    );
    const cells = gridCells(container);

    fireEvent.pointerDown(cells[13], { clientY: rowCenter(13) });
    fireEvent.pointerMove(cells[15], { clientY: rowCenter(15) });
    fireEvent.pointerUp(cells[15], { clientY: rowCenter(15) });

    expect(onPaintSelect).toHaveBeenCalledTimes(1);
    const range = onPaintSelect.mock.calls[0]?.[0];
    expect(range.cells).toHaveLength(3);
    expect(range.start.start).toBe(utcInstant("2026-08-24T13:00:00.000Z"));
    expect(range.end.end).toBe(utcInstant("2026-08-24T16:00:00.000Z"));
  });

  it("clears the painted range once the pointer leaves the grid after the paint is emitted", () => {
    stubRowRects();
    const { container } = render(
      <DayGrid {...baseProps} events={[]} interactionMode="paint-and-move" />
    );
    const cells = gridCells(container);

    fireEvent.pointerDown(cells[13], { clientY: rowCenter(13) });
    fireEvent.pointerUp(cells[13], { clientY: rowCenter(13) });
    expect(container.querySelector("[data-paint]")).not.toBeNull();

    // The host's form opens over the grid, so the pointer leaves it.
    for (
      let node: HTMLElement | null = cells[13].parentElement;
      node !== null && node !== container;
      node = node.parentElement
    ) {
      fireEvent.pointerLeave(node);
    }

    expect(container.querySelector("[data-paint]")).toBeNull();
  });

  it("does not open the quick-create form on a click in paint-and-move mode", () => {
    stubRowRects();
    const onQuickCreate = vi.fn();
    const { container } = render(
      <DayGrid
        {...baseProps}
        events={[]}
        interactionMode="paint-and-move"
        onQuickCreate={onQuickCreate}
      />
    );

    fireEvent.click(gridCells(container)[13], { clientY: rowCenter(13) });

    expect(onQuickCreate).not.toHaveBeenCalled();
  });
});
