import { describe, expect, it } from "vitest";

import { declarations } from "../../__test-utils__/css-declarations";
import dayGridCss from "../../ui/day-grid/day-grid.module.css?raw";
import weekGridCss from "../../ui/week-grid/week-grid.module.css?raw";

const HATCH =
  "repeating-linear-gradient(-45deg, var(--cal-slot-non-working-stripe) 0 2px, transparent 2px 7px)";

describe("non-working hour hatch", () => {
  it.each([
    ["day", dayGridCss],
    ["week", weekGridCss],
  ])("hatches non-working hours in the %s grid", (_, css) => {
    expect(declarations(css, ".nonWorkingHour").get("background-image")).toBe(
      HATCH
    );
  });
});
