import { describe, expect, it } from "vitest";
import { calculateRecommendationEffects, scenarioSchema } from "@plans-and-parcels/game-core";
import { copperlineScenario } from "../src";

describe("Copperline scenario", () => {
  it("matches the public scenario contract", () => {
    expect(() => scenarioSchema.parse(copperlineScenario)).not.toThrow();
  });

  it("contains six unique playable roles", () => {
    const ids = copperlineScenario.roles.map((role) => role.id);
    expect(ids).toHaveLength(6);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("contains the four civic tracks and ten commitments", () => {
    expect(copperlineScenario.startingTracks).toEqual({
      publicTrust: 4,
      equity: 3,
      implementationCapacity: 4,
      politicalSupport: 4
    });
    expect(copperlineScenario.commitments).toHaveLength(10);
  });

  it("uses unique content identifiers", () => {
    for (const collection of [
      copperlineScenario.evidence,
      copperlineScenario.factions,
      copperlineScenario.programs,
      copperlineScenario.commitments,
      copperlineScenario.hearingChallenges
    ]) {
      const ids = collection.map((item) => item.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it("applies unsupported costs only when implementation support is absent", () => {
    const unsupported = calculateRecommendationEffects(copperlineScenario, {
      programId: "compact-transit",
      commitmentIds: ["durable-affordability"],
      supportedCommitmentIds: [],
      customCommitments: [],
      responsibleParties: {},
      implementationSources: {},
      timings: {},
      tradeoff: "",
      unresolvedRisk: "",
      finalized: false
    });
    const supported = calculateRecommendationEffects(copperlineScenario, {
      programId: "compact-transit",
      commitmentIds: ["durable-affordability"],
      supportedCommitmentIds: ["durable-affordability"],
      customCommitments: [],
      responsibleParties: {},
      implementationSources: {},
      timings: {},
      tradeoff: "",
      unresolvedRisk: "",
      finalized: false
    });

    expect(unsupported).toContainEqual({
      track: "implementationCapacity",
      amount: -1
    });
    expect(supported).not.toContainEqual({
      track: "implementationCapacity",
      amount: -1
    });
    expect(supported).toEqual(
      expect.arrayContaining([
        { track: "politicalSupport", amount: 1 },
        { track: "equity", amount: 2 },
        { track: "publicTrust", amount: 1 }
      ])
    );
  });
});
