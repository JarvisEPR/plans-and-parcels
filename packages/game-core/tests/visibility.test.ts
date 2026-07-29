import { describe, expect, it } from "vitest";
import type { ScenarioDefinition } from "../src";
import { filterScenarioForAudience, makeInitialRoomState } from "../src";

const scenario = {
  schemaVersion: 1,
  id: "test",
  version: "1",
  title: "Test",
  subtitle: "Test",
  durationMinutes: 10,
  minimumPlayers: 1,
  maximumPlayers: 1,
  publicBrief: "Public",
  facilitatorBrief: "Secret facilitator brief",
  startingTracks: {
    publicTrust: 4,
    equity: 4,
    implementationCapacity: 4,
    politicalSupport: 4
  },
  phaseDurations: {},
  roles: [
    {
      id: "planner",
      characterName: "Planner",
      profession: "Planner",
      purpose: "Plan",
      attributes: {
        analysis: 1,
        empathy: 1,
        persuasion: 1,
        procedure: 1,
        vision: 1,
        resilience: 1
      },
      specialties: [
        { id: "a", name: "A", description: "A" },
        { id: "b", name: "B", description: "B" },
        { id: "c", name: "C", description: "C" }
      ],
      professionalMove: { id: "move", name: "Move", description: "Move" },
      startingKnowledge: "Private role knowledge",
      prompt: "Private prompt"
    }
  ],
  evidence: [
    {
      id: "secret",
      title: "Secret",
      summary: "Summary",
      detail: "Facilitator detail",
      visibility: "facilitator"
    }
  ],
  factions: [],
  programs: [],
  commitments: [],
  hearingChallenges: [],
  epilogues: [
    { track: "publicTrust", weakest: "Weak", strongest: "Strong" },
    { track: "equity", weakest: "Weak", strongest: "Strong" },
    { track: "implementationCapacity", weakest: "Weak", strongest: "Strong" },
    { track: "politicalSupport", weakest: "Weak", strongest: "Strong" }
  ]
} satisfies ScenarioDefinition;

describe("audience filtering", () => {
  it("never sends facilitator-only content to a display", () => {
    const room = makeInitialRoomState(
      "ABC234",
      scenario,
      new Date().toISOString(),
      new Date(Date.now() + 1000).toISOString()
    );
    const filtered = filterScenarioForAudience(scenario, room, "display", null);
    expect(filtered.facilitatorBrief).toBe("");
    expect(filtered.evidence).toHaveLength(0);
    expect(filtered.roles[0]?.startingKnowledge).toBe("");
  });

  it("sends a player only their authorized role and revealed evidence", () => {
    const room = makeInitialRoomState(
      "ABC234",
      scenario,
      new Date().toISOString(),
      new Date(Date.now() + 1000).toISOString()
    );
    room.participants.push({
      id: "player-1",
      displayName: "Player",
      roleId: "planner",
      connected: true,
      ready: true,
      joinedAt: new Date().toISOString(),
      professionalMoveUsed: false
    });

    const privateSnapshot = filterScenarioForAudience(scenario, room, "player", "player-1");
    expect(privateSnapshot.facilitatorBrief).toBe("");
    expect(privateSnapshot.roles[0]?.startingKnowledge).toBe("Private role knowledge");
    expect(privateSnapshot.evidence).toHaveLength(0);

    room.revealedEvidenceIds.push("secret");
    const revealedSnapshot = filterScenarioForAudience(scenario, room, "player", "player-1");
    expect(revealedSnapshot.evidence[0]).toMatchObject({
      id: "secret",
      detail: "Facilitator detail"
    });
  });
});
