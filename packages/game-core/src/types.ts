export const GAME_PHASES = [
  "lobby",
  "briefing",
  "investigation",
  "stakeholder_forum",
  "recommendation",
  "hearing",
  "epilogue",
  "completed"
] as const;

export type GamePhase = (typeof GAME_PHASES)[number];

export const ATTRIBUTE_NAMES = [
  "analysis",
  "empathy",
  "persuasion",
  "procedure",
  "vision",
  "resilience"
] as const;

export type AttributeName = (typeof ATTRIBUTE_NAMES)[number];

export const TRACK_NAMES = [
  "publicTrust",
  "equity",
  "implementationCapacity",
  "politicalSupport"
] as const;

export type TrackName = (typeof TRACK_NAMES)[number];
export type TrackState = Record<TrackName, number>;

export type Visibility = "public" | "facilitator" | "role";

export interface SpecialtyDefinition {
  id: string;
  name: string;
  description: string;
}

export interface ProfessionalMoveDefinition {
  id: string;
  name: string;
  description: string;
}

export interface RoleDefinition {
  id: string;
  characterName: string;
  profession: string;
  purpose: string;
  attributes: Record<AttributeName, number>;
  specialties: SpecialtyDefinition[];
  professionalMove: ProfessionalMoveDefinition;
  startingKnowledge: string;
  prompt: string;
}

export interface EvidenceDefinition {
  id: string;
  title: string;
  summary: string;
  detail: string;
  visibility: Visibility;
  roleIds?: string[];
  leverage?: string;
}

export interface FactionDefinition {
  id: string;
  name: string;
  publicPosition: string;
  underlyingNeed: string;
  fear: string;
  leverage: string;
  supportConditions: string[];
}

export interface TrackEffect {
  track: TrackName;
  amount: number;
}

export interface DevelopmentProgramDefinition {
  id: string;
  name: string;
  summary: string;
  effects: TrackEffect[];
  supportCondition?: string;
}

export interface CommitmentDefinition {
  id: string;
  name: string;
  summary: string;
  effects: TrackEffect[];
  unsupportedEffects: TrackEffect[];
  supportCondition: string;
}

export interface HearingChallengeDefinition {
  id: string;
  name: string;
  prompt: string;
  defaultDc: number;
  relevantAttributes: AttributeName[];
  success: string;
  mixed: string;
  setback: string;
}

export interface EpilogueDefinition {
  track: TrackName;
  weakest: string;
  strongest: string;
}

export interface ScenarioDefinition {
  schemaVersion: 1;
  id: string;
  version: string;
  title: string;
  subtitle: string;
  durationMinutes: number;
  minimumPlayers: number;
  maximumPlayers: number;
  publicBrief: string;
  facilitatorBrief: string;
  startingTracks: TrackState;
  phaseDurations: Partial<Record<GamePhase, number>>;
  roles: RoleDefinition[];
  evidence: EvidenceDefinition[];
  factions: FactionDefinition[];
  programs: DevelopmentProgramDefinition[];
  commitments: CommitmentDefinition[];
  hearingChallenges: HearingChallengeDefinition[];
  epilogues: EpilogueDefinition[];
}

export interface Participant {
  id: string;
  displayName: string;
  roleId: string | null;
  connected: boolean;
  ready: boolean;
  joinedAt: string;
  professionalMoveUsed: boolean;
}

export type CheckOutcome = "setback" | "mixed" | "success" | "breakthrough";

export interface PendingCheck {
  id: string;
  actorId: string;
  helperId: string | null;
  attribute: AttributeName;
  specialtyId: string | null;
  dc: number;
  stakes: string;
  openedAt: string;
  roll: number | null;
  modifier: number | null;
  total: number | null;
  outcome: CheckOutcome | null;
}

export interface CustomCommitment {
  id: string;
  name: string;
  responsibleParty: string;
  implementationSource: string;
  timing: string;
  effects: TrackEffect[];
}

export interface RecommendationState {
  programId: string | null;
  commitmentIds: string[];
  supportedCommitmentIds: string[];
  customCommitments: CustomCommitment[];
  responsibleParties: Record<string, string>;
  implementationSources: Record<string, string>;
  timings: Record<string, string>;
  tradeoff: string;
  unresolvedRisk: string;
  finalized: boolean;
}

export type AdoptionResult = "adopted" | "continued" | "rejected";
export type LegacyResult = "durable" | "fragile" | "crisis";

export interface GameResult {
  adoption: AdoptionResult;
  legacy: LegacyResult;
  total: number;
  weakestTracks: TrackName[];
  strongestTracks: TrackName[];
}

export interface RoomEvent {
  id: string;
  at: string;
  type: string;
  message: string;
  visibility: "public" | "facilitator";
}

export interface RoomState {
  schemaVersion: 1;
  roomCode: string;
  scenarioId: string;
  scenarioVersion: string;
  version: number;
  createdAt: string;
  expiresAt: string;
  phase: GamePhase;
  locked: boolean;
  participants: Participant[];
  tracks: TrackState;
  revealedEvidenceIds: string[];
  activeFactionIds: string[];
  timerEndsAt: string | null;
  pendingCheck: PendingCheck | null;
  recommendation: RecommendationState;
  hearingChallengeIds: string[];
  result: GameResult | null;
  events: RoomEvent[];
}

export type ConnectionMode = "host" | "player" | "display";

export interface RoomSnapshot {
  mode: ConnectionMode;
  actorId: string | null;
  room: RoomState;
  scenario: ScenarioDefinition;
  joinUrl: string;
}

interface CommandBase {
  commandId: string;
  expectedVersion: number;
}

export type ClientCommand =
  | (CommandBase & { type: "claim_role"; roleId: string })
  | (CommandBase & { type: "release_role" })
  | (CommandBase & { type: "set_ready"; ready: boolean })
  | (CommandBase & { type: "use_professional_move" })
  | (CommandBase & { type: "support_check" })
  | (CommandBase & { type: "roll_check" })
  | (CommandBase & { type: "set_recommendation"; recommendation: RecommendationState })
  | (CommandBase & { type: "host_set_phase"; phase: GamePhase })
  | (CommandBase & { type: "host_set_lock"; locked: boolean })
  | (CommandBase & { type: "host_kick"; participantId: string })
  | (CommandBase & {
      type: "host_adjust_track";
      track: TrackName;
      amount: number;
      reason: string;
    })
  | (CommandBase & { type: "host_reveal_evidence"; evidenceId: string; revealed: boolean })
  | (CommandBase & { type: "host_set_faction"; factionId: string; active: boolean })
  | (CommandBase & {
      type: "host_open_check";
      actorId: string;
      attribute: AttributeName;
      specialtyId: string | null;
      dc: number;
      stakes: string;
    })
  | (CommandBase & { type: "host_clear_check" })
  | (CommandBase & { type: "host_set_timer"; durationMinutes: number | null })
  | (CommandBase & { type: "host_finalize_recommendation" })
  | (CommandBase & { type: "host_set_hearing_challenges"; challengeIds: string[] })
  | (CommandBase & { type: "host_complete_game" });

export type ServerMessage =
  | { type: "snapshot"; snapshot: RoomSnapshot }
  | { type: "command_accepted"; commandId: string; version: number }
  | { type: "command_rejected"; commandId: string; reason: string; snapshot?: RoomSnapshot }
  | { type: "presence"; participantId: string; connected: boolean }
  | { type: "room_expired" };
