import { describe, expect, it } from "vitest";

import { isChunkLoadFailure } from "./chunk-reload";

describe("isChunkLoadFailure", () => {
  it("recognizes the blank-screen failure the preview reported", () => {
    const error = new TypeError(
      "Failed to fetch dynamically imported module: /src/routes/index.tsx?tsr-split=component",
    );
    expect(isChunkLoadFailure(error)).toBe(true);
  });

  it("recognizes a chunk error carried as a plain string or a cause", () => {
    expect(isChunkLoadFailure("Importing a module script failed.")).toBe(true);
    const wrapped = new Error("route load failed", {
      cause: new Error("Failed to fetch dynamically imported module: /src/routes/index.tsx"),
    });
    expect(isChunkLoadFailure(wrapped)).toBe(true);
  });

  it("does not treat ordinary failures as a missing chunk", () => {
    expect(isChunkLoadFailure(new Error("Network request failed"))).toBe(false);
    expect(isChunkLoadFailure(new Error("Cannot read properties of undefined"))).toBe(false);
    expect(isChunkLoadFailure(undefined)).toBe(false);
  });
});
