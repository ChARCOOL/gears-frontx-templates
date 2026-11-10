import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect as assert, it, vi } from "vitest";

import { timedEvent, UTC } from "../../../__test-utils__/fixtures";
import { calendarDate, parseLocalTime } from "../../../core/model";
import type { CalendarResizeRequest } from "../../../core/model";
import { englishTranslate as t } from "../../../i18n/english";
import { WeekGrid } from "../week-grid";
import type { WeekGridProps } from "../week-grid";

const DATE = calendarDate("2026-08-24");

const renderWeek = (props: Partial<WeekGridProps>) =>
  render(
    <WeekGrid
      date={DATE}
      events={[]}
      timeZone={UTC}
      locale="en-US"
      t={t}
      direction="ltr"
      interactionMode="paint-and-move"
      {...props}
    />
  );

const timedCell = (time: string): HTMLElement =>
  screen.getByRole("gridcell", {
    name: new RegExp(`Monday, August 24, 2026 ${time}`, "u"),
  });

const handle = (): HTMLElement | null =>
  document.querySelector<HTMLElement>("[data-resize-handle]");

const frame = (): HTMLElement => {
  const element = document.querySelector<HTMLElement>("[data-event-id]");

  if (element === null) {
    throw new Error("Expected an event frame");
  }

  return element;
};

/** Drags the handle until the pointer is over `time`'s slot, then releases. */
const dragHandleTo = (time: string): void => {
  const grip = handle();

  if (grip === null) {
    throw new Error("Expected a resize handle");
  }

  document.elementsFromPoint = () => [timedCell(time)];
  fireEvent.pointerDown(grip, { button: 0, pointerId: 1 });
  fireEvent.pointerMove(grip, { pointerId: 1 });
  fireEvent.pointerUp(grip, { pointerId: 1 });
};

describe("WeekGrid resize", () => {
  beforeEach(() => {
    HTMLElement.prototype.setPointerCapture = vi.fn();
  });

  afterEach(() => {
    Reflect.deleteProperty(document, "elementsFromPoint");
  });

  it("asks the host to end the event where the handle is released", () => {
    const onResizeRequest = vi.fn<(request: CalendarResizeRequest) => void>();
    renderWeek({ events: [timedEvent("resize")], onResizeRequest });

    dragHandleTo("11:00");

    assert(onResizeRequest).toHaveBeenCalledOnce();
    assert(onResizeRequest.mock.calls[0]?.[0].event.id).toBe("resize");
    assert(onResizeRequest.mock.calls[0]?.[0].to.endTime).toStrictEqual(
      parseLocalTime("12:00")
    );
  });

  it("refuses an end at or before the start", () => {
    const onResizeRequest = vi.fn<(request: CalendarResizeRequest) => void>();
    renderWeek({ events: [timedEvent("resize")], onResizeRequest });

    dragHandleTo("08:00");

    assert(onResizeRequest).not.toHaveBeenCalled();
  });

  it("does not ask when the end stays where it is", () => {
    const onResizeRequest = vi.fn<(request: CalendarResizeRequest) => void>();
    renderWeek({ events: [timedEvent("resize")], onResizeRequest });

    dragHandleTo("09:00");

    assert(onResizeRequest).not.toHaveBeenCalled();
  });

  it("shows the new size until the host answers, then restores it on cancel", () => {
    let request: CalendarResizeRequest | undefined;
    renderWeek({
      events: [timedEvent("resize")],
      onResizeRequest: (value) => {
        request = value;
      },
    });
    const before = frame().style.blockSize;
    document.elementsFromPoint = () => [timedCell("11:00")];
    const grip = handle();

    if (grip === null) {
      throw new Error("Expected a resize handle");
    }

    fireEvent.pointerDown(grip, { button: 0, pointerId: 1 });
    fireEvent.pointerMove(grip, { pointerId: 1 });

    assert(frame().style.blockSize).not.toBe(before);

    fireEvent.pointerUp(grip, { pointerId: 1 });

    assert(frame().style.blockSize).not.toBe(before);

    act(() => {
      request?.cancel();
    });

    assert(frame().style.blockSize).toBe(before);
  });

  it("moves the end one slot with Alt+ArrowDown on the focused card", () => {
    const onResizeRequest = vi.fn<(request: CalendarResizeRequest) => void>();
    renderWeek({ events: [timedEvent("resize")], onResizeRequest });

    fireEvent.keyDown(screen.getByRole("button", { name: /resize/u }), {
      altKey: true,
      key: "ArrowDown",
    });

    assert(onResizeRequest.mock.calls[0]?.[0].to.endTime).toStrictEqual(
      parseLocalTime("11:00")
    );
  });

  it.each([
    [
      "a recurring event",
      timedEvent({ id: "resize", recurrenceRule: "FREQ=WEEKLY;BYDAY=MO" }),
    ],
    ["an event pinned with movable: false", timedEvent({ id: "resize", movable: false })],
    ["an unavailable event", timedEvent({ available: false, id: "resize" })],
  ])("has no handle on %s", (_name, event) => {
    renderWeek({ events: [event] });

    assert(handle()).toBeNull();
  });

  it("has no handle outside paint-and-move mode", () => {
    renderWeek({
      events: [timedEvent("resize")],
      interactionMode: "quick-create",
    });

    assert(handle()).toBeNull();
  });
});
