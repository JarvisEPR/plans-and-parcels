import type {
  ConnectionMode,
  EvidenceDefinition,
  RoomSnapshot,
  RoomState,
  ScenarioDefinition
} from "./types";

function evidenceVisibleTo(
  evidence: EvidenceDefinition,
  mode: ConnectionMode,
  roleId: string | null,
  revealedIds: string[]
): boolean {
  if (mode === "host") return true;
  if (evidence.visibility === "public") return true;
  if (revealedIds.includes(evidence.id)) return true;
  return (
    evidence.visibility === "role" && roleId !== null && evidence.roleIds?.includes(roleId) === true
  );
}

export function filterScenarioForAudience(
  scenario: ScenarioDefinition,
  room: RoomState,
  mode: ConnectionMode,
  actorId: string | null
): ScenarioDefinition {
  const roleId =
    actorId === null
      ? null
      : (room.participants.find((participant) => participant.id === actorId)?.roleId ?? null);

  return {
    ...scenario,
    facilitatorBrief: mode === "host" ? scenario.facilitatorBrief : "",
    roles: scenario.roles.map((role) =>
      mode === "host" || role.id === roleId
        ? role
        : {
            ...role,
            startingKnowledge: "",
            prompt: ""
          }
    ),
    evidence: scenario.evidence
      .filter((evidence) => evidenceVisibleTo(evidence, mode, roleId, room.revealedEvidenceIds))
      .map((evidence) =>
        mode === "host" || room.revealedEvidenceIds.includes(evidence.id)
          ? evidence
          : { ...evidence, detail: evidence.summary, leverage: undefined }
      ),
    factions:
      mode === "host"
        ? scenario.factions
        : scenario.factions.map((faction) => ({
            ...faction,
            underlyingNeed: room.activeFactionIds.includes(faction.id)
              ? faction.underlyingNeed
              : "",
            fear: room.activeFactionIds.includes(faction.id) ? faction.fear : "",
            leverage: room.activeFactionIds.includes(faction.id) ? faction.leverage : "",
            supportConditions: room.activeFactionIds.includes(faction.id)
              ? faction.supportConditions
              : []
          }))
  };
}

export function makeSnapshot(
  scenario: ScenarioDefinition,
  room: RoomState,
  mode: ConnectionMode,
  actorId: string | null,
  joinUrl: string
): RoomSnapshot {
  const publicRoom: RoomState = {
    ...room,
    events: room.events.filter((event) => mode === "host" || event.visibility === "public")
  };

  return {
    mode,
    actorId,
    room: publicRoom,
    scenario: filterScenarioForAudience(scenario, publicRoom, mode, actorId),
    joinUrl
  };
}
