import { describe, expect, it } from "vitest";
import { fitOnA4 } from "./export-image";

describe("fitOnA4", () => {
  it("uses the full 190mm width when the voucher fits on one page", () => {
    const r = fitOnA4(1520, 1618);
    expect(r.w).toBe(190);
    expect(r.y).toBe(6);
    expect(r.x).toBe(10);
    expect(r.h).toBeLessThanOrEqual(297 - 12);
  });

  it("shrinks a tall voucher so it stays inside the 6mm margins on one A4 page", () => {
    const r = fitOnA4(1000, 3000);
    expect(r.h).toBe(285);
    expect(r.w).toBe(95);
    expect(r.x).toBe(57.5);
  });
});
