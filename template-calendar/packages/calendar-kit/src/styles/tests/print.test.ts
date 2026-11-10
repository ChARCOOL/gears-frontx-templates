import { describe, expect, it } from "vitest";

const stylesheets = import.meta.glob<string>("../../ui/**/*.module.css", {
  eager: true,
  import: "default",
  query: "?raw",
});

const css = (name: string): string => {
  const source = stylesheets[`../../ui/${name}`];

  if (source === undefined) {
    throw new TypeError(`No stylesheet ${name}`);
  }

  return source;
};

// Print rules are flat, so one brace-matched block and a flat rule scan are enough.
const printBlock = (source: string): string => {
  const start = source.indexOf("@media print {");

  if (start === -1) {
    return "";
  }

  let depth = 0;

  for (
    let index = start + "@media print ".length;
    index < source.length;
    index += 1
  ) {
    if (source[index] === "{") {
      depth += 1;
    } else if (source[index] === "}") {
      depth -= 1;

      if (depth === 0) {
        return source.slice(start, index + 1);
      }
    }
  }

  throw new TypeError("Unclosed @media print block");
};

/** Declarations that apply to `selector` inside `@media print`, as property to value. */
const printDeclarations = (
  source: string,
  selector: string,
): Map<string, string> => {
  const found = new Map<string, string>();

  for (const [, selectorList, body] of printBlock(source).matchAll(
    /([^{}]+)\{([^{}]*)\}/gu,
  )) {
    const selectors = selectorList.split(",").map((item) => item.trim());

    if (!selectors.includes(selector)) {
      continue;
    }

    for (const declaration of body.split(";")) {
      const [prop, ...value] = declaration.split(":");

      if (prop !== undefined && value.length > 0) {
        found.set(prop.trim(), value.join(":").trim());
      }
    }
  }

  return found;
};

describe("print styles", () => {
  it.each([
    ["week-grid/week-grid.module.css", ".container"],
    ["week-grid/week-grid.module.css", ".interactionSurface"],
    ["day-grid/day-grid.module.css", ".dayGrid"],
    ["month-grid/month-grid.module.css", ".container"],
    ["month-grid/month-grid.module.css", ".monthGrid"],
  ])(
    "%s prints all of %s instead of the part that fits its scroll area",
    (file, selector) => {
      const rules = printDeclarations(css(file), selector);

      expect(rules.get("overflow")).toBe("visible");
      expect(rules.get("block-size")).toBe("auto");
      expect(rules.get("print-color-adjust")).toBe("exact");
    },
  );

  it("prints the agenda in full and keeps each day on one page", () => {
    const source = css("agenda-view/agenda-view.module.css");

    expect(printDeclarations(source, ".groups").get("overflow")).toBe(
      "visible",
    );
    expect(printDeclarations(source, ".dayGroup").get("break-inside")).toBe(
      "avoid",
    );
    expect(
      printDeclarations(source, ".dayGroup").get("content-visibility"),
    ).toBe("visible");
  });

  it.each([
    ["week-grid/week-grid.module.css"],
    ["day-grid/day-grid.module.css"],
    ["agenda-view/agenda-view.module.css"],
  ])("%s hides the current-time line on paper", (file) => {
    expect(
      printDeclarations(css(file), ".nowLine.nowLine").get("display"),
    ).toBe("none");
  });

  it("leaves the side panel and the toolbar controls off the page", () => {
    expect(
      printDeclarations(
        css("calendar-side-panel/calendar-side-panel.module.css"),
        ".panel",
      ).get("display"),
    ).toBe("none");
    expect(
      printDeclarations(
        css("calendar-toolbar/calendar-toolbar.module.css"),
        ".actions",
      ).get("display"),
    ).toBe("none");
  });

  it("keeps an event card on one page", () => {
    expect(
      printDeclarations(css("event-card/event-card.module.css"), ".card").get(
        "break-inside",
      ),
    ).toBe("avoid");
  });
});
