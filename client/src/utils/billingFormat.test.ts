import { describe, expect, it } from "vitest";
import { formatCurrency, formatDate } from "./billingFormat";

describe("billing formatting", () => {
  it("formats integer cents as US currency", () => {
    expect(formatCurrency(125000)).toBe("$1,250.00");
    expect(formatCurrency(45)).toBe("$0.45");
  });

  it("formats dates in UTC without shifting the calendar day", () => {
    expect(formatDate("2026-08-15T00:00:00.000Z")).toBe("Aug 15, 2026");
  });

  it("supports the long month format used in the parent portal", () => {
    expect(formatDate("2026-08-15T00:00:00.000Z", "long")).toBe(
      "August 15, 2026"
    );
  });
});
