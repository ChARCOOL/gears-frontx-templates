import { describe, expect, it } from "vitest";

import { declarations } from "../../../../__test-utils__/css-declarations";

import inputCss from "../input.module.css?raw";

describe("Input disabled look", () => {
  it("uses the subtle colour for text and icon when disabled", () => {
    const control = declarations(inputCss, ".shell:has(:disabled) .control");
    const icon = declarations(inputCss, ".shell:has(:disabled) .icon");

    expect(control.get("color")).toBe("var(--cal-color-subtle)");
    expect(icon.get("color")).toBe("var(--cal-color-subtle)");
  });
});
