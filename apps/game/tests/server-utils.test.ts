import { describe, expect, it } from "vitest";
import { randomD20, randomRoomCode, randomToken } from "../src/server/auth";
import { safeDisplayName } from "../src/server/http";

describe("room identifiers", () => {
  it("creates six-character unambiguous room codes", () => {
    for (let index = 0; index < 100; index += 1) {
      expect(randomRoomCode()).toMatch(/^[23456789A-HJ-NP-Z]{6}$/);
    }
  });

  it("creates 128-bit URL-safe credentials", () => {
    expect(randomToken()).toMatch(/^[A-Za-z0-9_-]{22}$/);
  });

  it("rolls only values from one through twenty", () => {
    const rolls = Array.from({ length: 500 }, () => randomD20());
    expect(Math.min(...rolls)).toBeGreaterThanOrEqual(1);
    expect(Math.max(...rolls)).toBeLessThanOrEqual(20);
  });
});

describe("display-name privacy boundary", () => {
  it("normalizes harmless whitespace", () => {
    expect(safeDisplayName("  Alex   Planner  ")).toBe("Alex Planner");
  });

  it("rejects blank and overlong names", () => {
    expect(safeDisplayName("")).toBeNull();
    expect(safeDisplayName("A".repeat(41))).toBeNull();
  });
});
