import { describe, expect, it } from "vitest";
import {
  applyTrackEffects,
  calculateGameResult,
  canTransition,
  clampTrack,
  resolveCheck
} from "../src";

describe("resolveCheck", () => {
  it("treats a natural 20 as a breakthrough", () => {
    expect(resolveCheck(20, 0, false, false, 30).outcome).toBe("breakthrough");
  });

  it("treats a natural 1 as a setback", () => {
    expect(resolveCheck(1, 3, true, true, 5).outcome).toBe("setback");
  });

  it("applies attribute, specialty, and support modifiers", () => {
    expect(resolveCheck(7, 2, true, true, 13)).toEqual({
      modifier: 6,
      total: 13,
      outcome: "success"
    });
  });

  it("returns a mixed result within four points below the DC", () => {
    expect(resolveCheck(6, 2, true, false, 13).outcome).toBe("mixed");
  });
});

describe("tracks and outcomes", () => {
  it("clamps tracks to zero through eight", () => {
    expect(clampTrack(-5)).toBe(0);
    expect(clampTrack(12)).toBe(8);
  });

  it("applies multiple track effects", () => {
    expect(
      applyTrackEffects(
        {
          publicTrust: 4,
          equity: 3,
          implementationCapacity: 4,
          politicalSupport: 4
        },
        [
          { track: "publicTrust", amount: 6 },
          { track: "equity", amount: -4 }
        ]
      )
    ).toMatchObject({ publicTrust: 8, equity: 0 });
  });

  it("calculates durable adoption", () => {
    expect(
      calculateGameResult({
        publicTrust: 5,
        equity: 5,
        implementationCapacity: 5,
        politicalSupport: 5
      })
    ).toMatchObject({ adoption: "adopted", legacy: "durable", total: 20 });
  });

  it("does not confuse adoption with a durable outcome", () => {
    expect(
      calculateGameResult({
        publicTrust: 1,
        equity: 1,
        implementationCapacity: 8,
        politicalSupport: 8
      })
    ).toMatchObject({ adoption: "adopted", legacy: "crisis" });
  });
});

describe("phase transitions", () => {
  it("allows only the next fixed phase", () => {
    expect(canTransition("lobby", "briefing")).toBe(true);
    expect(canTransition("lobby", "hearing")).toBe(false);
  });
});
