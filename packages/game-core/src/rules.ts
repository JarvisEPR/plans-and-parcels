import {
  GAME_PHASES,
  TRACK_NAMES,
  type CheckOutcome,
  type GamePhase,
  type GameResult,
  type RecommendationState,
  type RoomState,
  type ScenarioDefinition,
  type TrackEffect,
  type TrackName,
  type TrackState
} from "./types";

export function clampTrack(value: number): number {
  return Math.max(0, Math.min(8, Math.round(value)));
}

export function applyTrackEffects(tracks: TrackState, effects: TrackEffect[]): TrackState {
  const next = { ...tracks };
  for (const effect of effects) {
    next[effect.track] = clampTrack(next[effect.track] + effect.amount);
  }
  return next;
}

export function resolveCheck(
  roll: number,
  attributeRating: number,
  hasSpecialty: boolean,
  hasSupport: boolean,
  dc: number
): { modifier: number; total: number; outcome: CheckOutcome } {
  if (!Number.isInteger(roll) || roll < 1 || roll > 20) {
    throw new RangeError("Roll must be an integer from 1 through 20.");
  }
  const modifier = attributeRating + (hasSpecialty ? 2 : 0) + (hasSupport ? 2 : 0);
  const total = roll + modifier;

  if (roll === 20) return { modifier, total, outcome: "breakthrough" };
  if (roll === 1) return { modifier, total, outcome: "setback" };
  if (total >= dc + 5) return { modifier, total, outcome: "breakthrough" };
  if (total >= dc) return { modifier, total, outcome: "success" };
  if (total >= dc - 4) return { modifier, total, outcome: "mixed" };
  return { modifier, total, outcome: "setback" };
}

export function calculateGameResult(tracks: TrackState): GameResult {
  const values = TRACK_NAMES.map((track) => tracks[track]);
  const total = values.reduce((sum, value) => sum + value, 0);
  const minimum = Math.min(...values);
  const maximum = Math.max(...values);
  const political = tracks.politicalSupport;

  const adoption = political >= 4 ? "adopted" : political >= 2 ? "continued" : "rejected";
  const legacy =
    total >= 20 && minimum >= 3 ? "durable" : total >= 16 && minimum >= 2 ? "fragile" : "crisis";

  return {
    adoption,
    legacy,
    total,
    weakestTracks: TRACK_NAMES.filter((track) => tracks[track] === minimum),
    strongestTracks: TRACK_NAMES.filter((track) => tracks[track] === maximum)
  };
}

export function nextPhase(current: GamePhase): GamePhase | null {
  const index = GAME_PHASES.indexOf(current);
  return index >= 0 && index < GAME_PHASES.length - 1 ? (GAME_PHASES[index + 1] ?? null) : null;
}

export function canTransition(current: GamePhase, target: GamePhase): boolean {
  return nextPhase(current) === target;
}

export function calculateRecommendationEffects(
  scenario: ScenarioDefinition,
  recommendation: RecommendationState
): TrackEffect[] {
  const effects: TrackEffect[] = [];
  const program = scenario.programs.find((candidate) => candidate.id === recommendation.programId);
  if (program) effects.push(...program.effects);

  for (const commitmentId of recommendation.commitmentIds) {
    const commitment = scenario.commitments.find((candidate) => candidate.id === commitmentId);
    if (!commitment) continue;
    effects.push(...commitment.effects);
    if (!recommendation.supportedCommitmentIds.includes(commitmentId)) {
      effects.push(...commitment.unsupportedEffects);
    }
  }

  for (const custom of recommendation.customCommitments) {
    effects.push(...custom.effects);
  }
  return effects;
}

export function makeInitialRoomState(
  roomCode: string,
  scenario: ScenarioDefinition,
  createdAt: string,
  expiresAt: string
): RoomState {
  return {
    schemaVersion: 1,
    roomCode,
    scenarioId: scenario.id,
    scenarioVersion: scenario.version,
    version: 0,
    createdAt,
    expiresAt,
    phase: "lobby",
    locked: false,
    participants: [],
    tracks: { ...scenario.startingTracks },
    revealedEvidenceIds: scenario.evidence
      .filter((evidence) => evidence.visibility === "public")
      .map((evidence) => evidence.id),
    activeFactionIds: [],
    timerEndsAt: null,
    pendingCheck: null,
    recommendation: {
      programId: null,
      commitmentIds: [],
      supportedCommitmentIds: [],
      customCommitments: [],
      responsibleParties: {},
      implementationSources: {},
      timings: {},
      tradeoff: "",
      unresolvedRisk: "",
      finalized: false
    },
    hearingChallengeIds: [],
    result: null,
    events: []
  };
}

export function trackLabel(track: TrackName): string {
  const labels: Record<TrackName, string> = {
    publicTrust: "Public Trust",
    equity: "Equity",
    implementationCapacity: "Implementation Capacity",
    politicalSupport: "Political Support"
  };
  return labels[track];
}
