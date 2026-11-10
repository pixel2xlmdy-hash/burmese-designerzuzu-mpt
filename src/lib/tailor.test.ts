import { describe, expect, it } from "vitest";

import {
  computeBalance,
  filterRecords,
  maskDMY,
  parseDMY,
  mergeImported,
  parseBackupRecords,
  pickNewer,
  toDMY,
  type TailorRecord,
} from "./tailor";

const rec = (id: string, name: string, phone: string, updatedAt = "2026-01-01T00:00:00Z"): TailorRecord => ({
  id,
  kind: "measurement",
  deleted: false,
  createdAt: updatedAt,
  updatedAt,
  data: {
    name,
    phone,
    date: "",
    dueDate: "",
    eventDate: "",
    fields: {},
    elbowNote: "",
    backWaist: [],
    sleeveLength: [],
    sleeveOpening: [],
    notes: "",
    total: "",
    deposit: "",
    designerSig: "",
    customerSig: "",
  },
});

describe("balance", () => {
  it("is total minus deposit/paid", () => {
    expect(computeBalance("150,000", "50,000")).toBe(100000);
  });
  it("reads Burmese digits", () => {
    expect(computeBalance("၁၀၀၀၀", "၂၅၀၀")).toBe(7500);
  });
  it("treats empty deposit as zero", () => {
    expect(computeBalance("80000", "")).toBe(80000);
  });
});

describe("DD/MM/YYYY dates", () => {
  it("formats as DD/MM/YYYY", () => {
    expect(toDMY(new Date(2026, 2, 5))).toBe("05/03/2026");
  });
  it("rejects impossible dates", () => {
    expect(parseDMY("31/02/2026")).toBeNull();
  });
  it("masks typed digits", () => {
    expect(maskDMY("09112026")).toBe("09/11/2026");
  });
});

describe("search", () => {
  const list = [rec("1", "Ma Hla", "09789104156"), rec("2", "Daw Mya", "09940744566")];
  it("filters by name", () => {
    expect(filterRecords(list, "mya").map((r) => r.id)).toEqual(["2"]);
  });
  it("filters by phone, including Burmese digits", () => {
    expect(filterRecords(list, "၉၁၀၄").map((r) => r.id)).toEqual(["1"]);
  });
});

describe("sync merge", () => {
  it("keeps the newer copy", () => {
    const older = rec("1", "Old", "", "2026-01-01T00:00:00Z");
    const newer = rec("1", "New", "", "2026-02-01T00:00:00Z");
    expect(pickNewer(older, newer)).toBe(newer);
    expect(pickNewer(newer, older)).toBe(newer);
  });
});

describe("backup import", () => {
  const now = "2026-11-10T00:00:00.000Z";
  const r = (id: string, updatedAt: string, deleted = false): TailorRecord => ({
    id,
    kind: "measurement",
    deleted,
    createdAt: updatedAt,
    updatedAt,
    data: { name: id } as never,
  });

  it("reads full backups, single-customer files and bare arrays", () => {
    const one = r("a", "2026-01-01T00:00:00Z");
    expect(parseBackupRecords(JSON.stringify({ records: [one] }))).toHaveLength(1);
    expect(parseBackupRecords(JSON.stringify([one, { bad: true }]))).toHaveLength(1);
    expect(() => parseBackupRecords("not json")).toThrow();
  });

  it("adds a customer that is not on this phone", () => {
    const inc = r("a", "2026-01-01T00:00:00Z");
    expect(mergeImported(undefined, inc, now)).toBe(inc);
  });

  it("keeps a newer local copy instead of overwriting it", () => {
    expect(mergeImported(r("a", "2026-05-01T00:00:00Z"), r("a", "2026-01-01T00:00:00Z"), now)).toBeNull();
  });

  it("restores a customer that was deleted on this phone", () => {
    const out = mergeImported(r("a", "2026-05-01T00:00:00Z", true), r("a", "2026-01-01T00:00:00Z"), now);
    expect(out?.deleted).toBe(false);
    expect(out?.updatedAt).toBe(now);
  });
});
