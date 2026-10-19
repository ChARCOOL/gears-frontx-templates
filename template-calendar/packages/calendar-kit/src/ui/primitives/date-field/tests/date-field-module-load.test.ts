import { afterEach, expect as assert, it, vi } from "vitest";

afterEach(() => {
  vi.unstubAllGlobals();
});

// The package root is imported where there is no DOM (SSR, dev mock servers), so loading the
// module must not construct DOM objects.
it("loads without DOMRect", async () => {
  vi.resetModules();
  vi.stubGlobal("DOMRect", undefined);

  await assert(import("../date-field")).resolves.toHaveProperty("DateField");
});
