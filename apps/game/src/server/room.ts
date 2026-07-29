import { DurableObject } from "cloudflare:workers";
import { copperlineScenario } from "@plans-and-parcels/copperline";
import {
  applyTrackEffects,
  calculateGameResult,
  calculateRecommendationEffects,
  canTransition,
  clampTrack,
  makeInitialRoomState,
  makeSnapshot,
  resolveCheck,
  type ClientCommand,
  type ConnectionMode,
  type Participant,
  type RecommendationState,
  type RoomEvent,
  type RoomSnapshot,
  type RoomState,
  type ServerMessage
} from "@plans-and-parcels/game-core";
import { hashToken, randomD20 } from "./auth";
import { json, readJson, safeDisplayName } from "./http";

export interface GameEnv {
  ROOMS: DurableObjectNamespace<GameRoom>;
  ASSETS: Fetcher;
}

interface InternalRoom {
  room: RoomState;
  joinUrl: string;
  hostTokenHash: string;
  playerTokenHashes: Record<string, string>;
}

interface SocketAttachment {
  mode: ConnectionMode;
  actorId: string | null;
}

function looksLikeCommand(value: unknown): value is ClientCommand {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.type === "string" &&
    typeof candidate.commandId === "string" &&
    typeof candidate.expectedVersion === "number" &&
    Number.isInteger(candidate.expectedVersion)
  );
}

function isRecommendation(value: unknown): value is RecommendationState {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Partial<RecommendationState>;
  return (
    (typeof candidate.programId === "string" || candidate.programId === null) &&
    Array.isArray(candidate.commitmentIds) &&
    Array.isArray(candidate.supportedCommitmentIds) &&
    Array.isArray(candidate.customCommitments) &&
    typeof candidate.responsibleParties === "object" &&
    candidate.responsibleParties !== null &&
    typeof candidate.implementationSources === "object" &&
    candidate.implementationSources !== null &&
    typeof candidate.timings === "object" &&
    candidate.timings !== null &&
    typeof candidate.tradeoff === "string" &&
    typeof candidate.unresolvedRisk === "string" &&
    typeof candidate.finalized === "boolean"
  );
}

function cleanText(value: string, maximum = 500): string {
  return value
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .trim()
    .slice(0, maximum);
}

function cleanRecommendation(value: RecommendationState): RecommendationState {
  const validPrograms = new Set(copperlineScenario.programs.map((program) => program.id));
  const validCommitments = new Set(
    copperlineScenario.commitments.map((commitment) => commitment.id)
  );
  const commitmentIds = [...new Set(value.commitmentIds)]
    .filter((id) => validCommitments.has(id))
    .slice(0, 6);
  const supportedCommitmentIds = [...new Set(value.supportedCommitmentIds)].filter((id) =>
    commitmentIds.includes(id)
  );

  const cleanRecord = (record: Record<string, string>): Record<string, string> =>
    Object.fromEntries(
      Object.entries(record)
        .filter(([key]) => commitmentIds.includes(key))
        .map(([key, entry]) => [key, cleanText(entry, 160)])
    );

  return {
    programId:
      value.programId !== null && validPrograms.has(value.programId) ? value.programId : null,
    commitmentIds,
    supportedCommitmentIds,
    customCommitments: value.customCommitments.slice(0, 2).map((commitment) => ({
      ...commitment,
      id: cleanText(commitment.id, 60),
      name: cleanText(commitment.name, 120),
      responsibleParty: cleanText(commitment.responsibleParty, 160),
      implementationSource: cleanText(commitment.implementationSource, 160),
      timing: cleanText(commitment.timing, 160),
      effects: commitment.effects
        .filter((effect) =>
          ["publicTrust", "equity", "implementationCapacity", "politicalSupport"].includes(
            effect.track
          )
        )
        .map((effect) => ({ ...effect, amount: Math.max(-2, Math.min(2, effect.amount)) }))
    })),
    responsibleParties: cleanRecord(value.responsibleParties),
    implementationSources: cleanRecord(value.implementationSources),
    timings: cleanRecord(value.timings),
    tradeoff: cleanText(value.tradeoff),
    unresolvedRisk: cleanText(value.unresolvedRisk),
    finalized: false
  };
}

export class GameRoom extends DurableObject<GameEnv> {
  private internal: InternalRoom | null = null;
  private readonly ready: Promise<void>;

  constructor(ctx: DurableObjectState, env: GameEnv) {
    super(ctx, env);
    this.ready = ctx.blockConcurrencyWhile(async () => {
      this.internal = (await ctx.storage.get<InternalRoom>("room")) ?? null;
    });
  }

  private async persist(): Promise<void> {
    if (this.internal) await this.ctx.storage.put("room", this.internal);
  }

  private getRoom(): InternalRoom {
    if (!this.internal) throw new Error("Room not initialized.");
    return this.internal;
  }

  private log(eventType: string, latencyMs: number, error: boolean): void {
    console.log(
      JSON.stringify({
        roomId: this.getRoom().room.roomCode,
        eventType,
        latencyMs,
        error
      })
    );
  }

  private event(message: string, type: string, visibility: RoomEvent["visibility"] = "public") {
    const internal = this.getRoom();
    internal.room.events.push({
      id: crypto.randomUUID(),
      at: new Date().toISOString(),
      type,
      message,
      visibility
    });
    internal.room.events = internal.room.events.slice(-200);
  }

  private snapshot(attachment: SocketAttachment): RoomSnapshot {
    const internal = this.getRoom();
    return makeSnapshot(
      copperlineScenario,
      internal.room,
      attachment.mode,
      attachment.actorId,
      internal.joinUrl
    );
  }

  private send(socket: WebSocket, message: ServerMessage): void {
    try {
      socket.send(JSON.stringify(message));
    } catch {
      // Connection cleanup is handled by the close/error callbacks.
    }
  }

  private broadcastSnapshots(): void {
    for (const socket of this.ctx.getWebSockets()) {
      const attachment = socket.deserializeAttachment() as SocketAttachment | null;
      if (!attachment) continue;
      this.send(socket, { type: "snapshot", snapshot: this.snapshot(attachment) });
    }
  }

  private async authenticate(
    mode: ConnectionMode,
    actorId: string | null,
    token: string | null
  ): Promise<boolean> {
    const internal = this.getRoom();
    if (mode === "display") return true;
    if (!token) return false;
    const hash = await hashToken(token);
    if (mode === "host") return hash === internal.hostTokenHash;
    return actorId !== null && internal.playerTokenHashes[actorId] === hash;
  }

  private participant(actorId: string | null): Participant | null {
    if (!actorId) return null;
    return (
      this.getRoom().room.participants.find((participant) => participant.id === actorId) ?? null
    );
  }

  async fetch(request: Request): Promise<Response> {
    await this.ready;
    const url = new URL(request.url);

    if (url.pathname === "/init" && request.method === "POST") {
      if (this.internal) return json({ error: "Room code already exists." }, 409);
      const body = await readJson(request);
      if (
        !body ||
        typeof body.roomCode !== "string" ||
        typeof body.joinUrl !== "string" ||
        typeof body.hostToken !== "string" ||
        typeof body.createdAt !== "string" ||
        typeof body.expiresAt !== "string"
      ) {
        return json({ error: "Invalid room initialization." }, 400);
      }
      this.internal = {
        room: makeInitialRoomState(
          body.roomCode,
          copperlineScenario,
          body.createdAt,
          body.expiresAt
        ),
        joinUrl: body.joinUrl,
        hostTokenHash: await hashToken(body.hostToken),
        playerTokenHashes: {}
      };
      this.event("The Copperline room opened.", "room_created");
      await this.persist();
      await this.ctx.storage.setAlarm(new Date(body.expiresAt).getTime());
      return json({ created: true }, 201);
    }

    if (!this.internal) return json({ error: "Room not found or expired." }, 404);

    if (url.pathname === "/join" && request.method === "POST") {
      const body = await readJson(request);
      const displayName = safeDisplayName(body?.displayName);
      if (
        !body ||
        !displayName ||
        typeof body.participantId !== "string" ||
        typeof body.playerToken !== "string"
      ) {
        return json({ error: "Enter a display name of 1-40 characters." }, 400);
      }
      const room = this.internal.room;
      if (room.locked) return json({ error: "This room is locked." }, 423);
      if (room.participants.length >= copperlineScenario.maximumPlayers) {
        return json({ error: "This room already has six players." }, 409);
      }
      room.participants.push({
        id: body.participantId,
        displayName,
        roleId: null,
        connected: false,
        ready: false,
        joinedAt: new Date().toISOString(),
        professionalMoveUsed: false
      });
      this.internal.playerTokenHashes[body.participantId] = await hashToken(body.playerToken);
      room.version += 1;
      this.event(`${displayName} joined the planning team.`, "participant_joined");
      await this.persist();
      this.broadcastSnapshots();
      return json({ participantId: body.participantId, displayName }, 201);
    }

    if (url.pathname === "/rejoin" && request.method === "POST") {
      const body = await readJson(request);
      if (
        !body ||
        typeof body.participantId !== "string" ||
        typeof body.playerToken !== "string" ||
        !(await this.authenticate("player", body.participantId, body.playerToken))
      ) {
        return json({ error: "The saved player session is no longer valid." }, 401);
      }
      const participant = this.participant(body.participantId);
      return participant
        ? json({ participantId: participant.id, displayName: participant.displayName })
        : json({ error: "Player not found." }, 404);
    }

    if (url.pathname === "/recover" && request.method === "POST") {
      const body = await readJson(request);
      if (
        !body ||
        typeof body.hostToken !== "string" ||
        !(await this.authenticate("host", null, body.hostToken))
      ) {
        return json({ error: "Invalid recovery link." }, 401);
      }
      return json({ recovered: true });
    }

    if (url.pathname === "/export" && request.method === "GET") {
      const token = request.headers.get("x-pp-token");
      if (!(await this.authenticate("host", null, token))) {
        return json({ error: "Host authorization required." }, 401);
      }
      return json({
        exportedAt: new Date().toISOString(),
        scenario: {
          id: copperlineScenario.id,
          version: copperlineScenario.version,
          title: copperlineScenario.title
        },
        room: this.internal.room
      });
    }

    if (url.pathname === "/socket") {
      if (request.headers.get("Upgrade")?.toLowerCase() !== "websocket") {
        return json({ error: "WebSocket upgrade required." }, 426);
      }
      const mode = request.headers.get("x-pp-mode") as ConnectionMode | null;
      const actorId = request.headers.get("x-pp-actor");
      const token = request.headers.get("x-pp-token");
      if (!mode || !["host", "player", "display"].includes(mode)) {
        return json({ error: "Invalid connection mode." }, 400);
      }
      if (!(await this.authenticate(mode, actorId, token))) {
        return json({ error: "Room authorization failed." }, 401);
      }

      const pair = new WebSocketPair();
      const [client, server] = Object.values(pair) as [WebSocket, WebSocket];
      const attachment: SocketAttachment = { mode, actorId };
      server.serializeAttachment(attachment);
      this.ctx.acceptWebSocket(server);

      const participant = mode === "player" ? this.participant(actorId) : null;
      if (participant) {
        participant.connected = true;
        await this.persist();
      }
      this.send(server, { type: "snapshot", snapshot: this.snapshot(attachment) });
      this.broadcastSnapshots();
      return new Response(null, { status: 101, webSocket: client });
    }

    return json({ error: "Unknown room operation." }, 404);
  }

  private reject(
    socket: WebSocket,
    attachment: SocketAttachment,
    command: ClientCommand,
    reason: string,
    includeSnapshot = false
  ): void {
    this.log(command.type, 0, true);
    this.send(socket, {
      type: "command_rejected",
      commandId: command.commandId,
      reason,
      ...(includeSnapshot ? { snapshot: this.snapshot(attachment) } : {})
    });
  }

  private requireHost(
    socket: WebSocket,
    attachment: SocketAttachment,
    command: ClientCommand
  ): boolean {
    if (attachment.mode === "host") return true;
    this.reject(socket, attachment, command, "Only the facilitator can do that.");
    return false;
  }

  async webSocketMessage(socket: WebSocket, message: string | ArrayBuffer): Promise<void> {
    const attachment = socket.deserializeAttachment() as SocketAttachment | null;
    if (!attachment || !this.internal) return;
    const startedAt = Date.now();

    let parsed: unknown;
    try {
      parsed = JSON.parse(
        typeof message === "string" ? message : new TextDecoder().decode(message)
      );
    } catch {
      this.send(socket, {
        type: "command_rejected",
        commandId: "unknown",
        reason: "Invalid command payload."
      });
      this.log("invalid_payload", Date.now() - startedAt, true);
      return;
    }
    if (!looksLikeCommand(parsed)) {
      this.send(socket, {
        type: "command_rejected",
        commandId: "unknown",
        reason: "Invalid command contract."
      });
      this.log("invalid_contract", Date.now() - startedAt, true);
      return;
    }

    const command = parsed;
    const room = this.internal.room;
    if (command.expectedVersion !== room.version) {
      this.reject(socket, attachment, command, "Room state changed. Resynchronized.", true);
      return;
    }

    const actor = this.participant(attachment.actorId);
    let changed = false;

    switch (command.type) {
      case "claim_role": {
        if (!actor || room.phase !== "lobby") {
          this.reject(socket, attachment, command, "Roles can only be selected in the lobby.");
          return;
        }
        if (!copperlineScenario.roles.some((role) => role.id === command.roleId)) {
          this.reject(socket, attachment, command, "Unknown planning role.");
          return;
        }
        if (
          room.participants.some(
            (participant) => participant.id !== actor.id && participant.roleId === command.roleId
          )
        ) {
          this.reject(socket, attachment, command, "That role has already been claimed.");
          return;
        }
        actor.roleId = command.roleId;
        actor.ready = false;
        this.event(`${actor.displayName} selected a planning role.`, "role_claimed");
        changed = true;
        break;
      }
      case "release_role": {
        if (!actor || room.phase !== "lobby") {
          this.reject(socket, attachment, command, "Roles can only change in the lobby.");
          return;
        }
        actor.roleId = null;
        actor.ready = false;
        changed = true;
        break;
      }
      case "set_ready": {
        if (!actor || !actor.roleId) {
          this.reject(socket, attachment, command, "Choose a role before becoming ready.");
          return;
        }
        actor.ready = command.ready;
        changed = true;
        break;
      }
      case "use_professional_move": {
        if (!actor?.roleId || actor.professionalMoveUsed) {
          this.reject(socket, attachment, command, "Professional move is unavailable.");
          return;
        }
        actor.professionalMoveUsed = true;
        const role = copperlineScenario.roles.find((candidate) => candidate.id === actor.roleId);
        this.event(
          `${actor.displayName} used ${role?.professionalMove.name ?? "a professional move"}.`,
          "professional_move"
        );
        changed = true;
        break;
      }
      case "support_check": {
        if (!actor || !room.pendingCheck || room.pendingCheck.roll !== null) {
          this.reject(socket, attachment, command, "No open check can be supported.");
          return;
        }
        if (room.pendingCheck.actorId === actor.id) {
          this.reject(socket, attachment, command, "The acting planner cannot support themself.");
          return;
        }
        room.pendingCheck.helperId = room.pendingCheck.helperId === actor.id ? null : actor.id;
        changed = true;
        break;
      }
      case "roll_check": {
        const pending = room.pendingCheck;
        if (!actor || !pending || pending.actorId !== actor.id || pending.roll !== null) {
          this.reject(socket, attachment, command, "This check is not ready for your roll.");
          return;
        }
        const role = copperlineScenario.roles.find((candidate) => candidate.id === actor.roleId);
        if (!role) {
          this.reject(socket, attachment, command, "Choose a role before rolling.");
          return;
        }
        const hasSpecialty =
          pending.specialtyId !== null &&
          role.specialties.some((specialty) => specialty.id === pending.specialtyId);
        const result = resolveCheck(
          randomD20(),
          role.attributes[pending.attribute],
          hasSpecialty,
          pending.helperId !== null,
          pending.dc
        );
        pending.roll = result.total - result.modifier;
        pending.modifier = result.modifier;
        pending.total = result.total;
        pending.outcome = result.outcome;
        this.event(
          `${actor.displayName} rolled ${pending.roll} for a ${result.outcome}.`,
          "check_resolved"
        );
        changed = true;
        break;
      }
      case "set_recommendation": {
        if (
          (attachment.mode !== "host" && !actor) ||
          room.phase !== "recommendation" ||
          room.recommendation.finalized ||
          !isRecommendation(command.recommendation)
        ) {
          this.reject(socket, attachment, command, "The recommendation cannot be edited now.");
          return;
        }
        const recommendation = cleanRecommendation(command.recommendation);
        if (attachment.mode !== "host") {
          recommendation.supportedCommitmentIds = room.recommendation.supportedCommitmentIds.filter(
            (id) => recommendation.commitmentIds.includes(id)
          );
          recommendation.customCommitments = room.recommendation.customCommitments;
        }
        room.recommendation = recommendation;
        changed = true;
        break;
      }
      case "host_set_phase": {
        if (!this.requireHost(socket, attachment, command)) return;
        if (!canTransition(room.phase, command.phase)) {
          this.reject(socket, attachment, command, "Advance to the next phase in sequence.");
          return;
        }
        if (
          room.phase === "lobby" &&
          command.phase === "briefing" &&
          (room.participants.length < copperlineScenario.minimumPlayers ||
            room.participants.some((participant) => !participant.roleId || !participant.ready))
        ) {
          this.reject(
            socket,
            attachment,
            command,
            `At least ${copperlineScenario.minimumPlayers} players must choose roles and be ready.`
          );
          return;
        }
        if (
          room.phase === "recommendation" &&
          command.phase === "hearing" &&
          !room.recommendation.finalized
        ) {
          this.reject(socket, attachment, command, "Finalize the recommendation first.");
          return;
        }
        if (
          room.phase === "hearing" &&
          command.phase === "epilogue" &&
          room.hearingChallengeIds.length !== 3
        ) {
          this.reject(socket, attachment, command, "Select three hearing challenges first.");
          return;
        }
        room.phase = command.phase;
        room.pendingCheck = null;
        const minutes = copperlineScenario.phaseDurations[command.phase];
        room.timerEndsAt = minutes ? new Date(Date.now() + minutes * 60_000).toISOString() : null;
        if (command.phase === "epilogue" && room.result === null) {
          room.result = calculateGameResult(room.tracks);
        }
        this.event(`The session advanced to ${command.phase.replaceAll("_", " ")}.`, "phase");
        changed = true;
        break;
      }
      case "host_set_lock": {
        if (!this.requireHost(socket, attachment, command)) return;
        room.locked = command.locked;
        this.event(
          command.locked
            ? "The facilitator locked the room."
            : "The facilitator reopened the room.",
          "room_lock"
        );
        changed = true;
        break;
      }
      case "host_kick": {
        if (!this.requireHost(socket, attachment, command)) return;
        const removed = room.participants.find(
          (participant) => participant.id === command.participantId
        );
        if (!removed) {
          this.reject(socket, attachment, command, "Player not found.");
          return;
        }
        room.participants = room.participants.filter(
          (participant) => participant.id !== command.participantId
        );
        delete this.internal.playerTokenHashes[command.participantId];
        this.event(`${removed.displayName} left the planning team.`, "participant_removed");
        for (const openSocket of this.ctx.getWebSockets()) {
          const openAttachment = openSocket.deserializeAttachment() as SocketAttachment | null;
          if (openAttachment?.actorId === command.participantId) openSocket.close(4003, "Removed");
        }
        changed = true;
        break;
      }
      case "host_adjust_track": {
        if (!this.requireHost(socket, attachment, command)) return;
        if (
          !["publicTrust", "equity", "implementationCapacity", "politicalSupport"].includes(
            command.track
          ) ||
          !Number.isInteger(command.amount) ||
          Math.abs(command.amount) > 2
        ) {
          this.reject(socket, attachment, command, "Invalid civic track adjustment.");
          return;
        }
        room.tracks[command.track] = clampTrack(room.tracks[command.track] + command.amount);
        this.event(
          `${command.reason ? cleanText(command.reason, 160) : "Facilitator ruling"}: ${command.track} ${command.amount > 0 ? "+" : ""}${command.amount}.`,
          "track_change"
        );
        changed = true;
        break;
      }
      case "host_reveal_evidence": {
        if (!this.requireHost(socket, attachment, command)) return;
        if (!copperlineScenario.evidence.some((evidence) => evidence.id === command.evidenceId)) {
          this.reject(socket, attachment, command, "Unknown evidence.");
          return;
        }
        room.revealedEvidenceIds = command.revealed
          ? [...new Set([...room.revealedEvidenceIds, command.evidenceId])]
          : room.revealedEvidenceIds.filter((id) => id !== command.evidenceId);
        this.event(
          command.revealed
            ? "The team discovered new evidence."
            : "Evidence was returned to staff review.",
          "evidence"
        );
        changed = true;
        break;
      }
      case "host_set_faction": {
        if (!this.requireHost(socket, attachment, command)) return;
        if (!copperlineScenario.factions.some((faction) => faction.id === command.factionId)) {
          this.reject(socket, attachment, command, "Unknown faction.");
          return;
        }
        room.activeFactionIds = command.active
          ? [...new Set([...room.activeFactionIds, command.factionId])]
          : room.activeFactionIds.filter((id) => id !== command.factionId);
        changed = true;
        break;
      }
      case "host_open_check": {
        if (!this.requireHost(socket, attachment, command)) return;
        const checkActor = room.participants.find(
          (participant) => participant.id === command.actorId
        );
        const role = copperlineScenario.roles.find(
          (candidate) => candidate.id === checkActor?.roleId
        );
        if (
          !checkActor ||
          !role ||
          !["analysis", "empathy", "persuasion", "procedure", "vision", "resilience"].includes(
            command.attribute
          ) ||
          command.dc < 10 ||
          command.dc > 20 ||
          (command.specialtyId !== null &&
            !role.specialties.some((specialty) => specialty.id === command.specialtyId))
        ) {
          this.reject(socket, attachment, command, "Invalid check configuration.");
          return;
        }
        room.pendingCheck = {
          id: crypto.randomUUID(),
          actorId: checkActor.id,
          helperId: null,
          attribute: command.attribute,
          specialtyId: command.specialtyId,
          dc: Math.round(command.dc),
          stakes: cleanText(command.stakes, 240),
          openedAt: new Date().toISOString(),
          roll: null,
          modifier: null,
          total: null,
          outcome: null
        };
        this.event(
          `A ${command.attribute} check opened for ${checkActor.displayName}.`,
          "check_opened"
        );
        changed = true;
        break;
      }
      case "host_clear_check": {
        if (!this.requireHost(socket, attachment, command)) return;
        room.pendingCheck = null;
        changed = true;
        break;
      }
      case "host_set_timer": {
        if (!this.requireHost(socket, attachment, command)) return;
        if (
          command.durationMinutes !== null &&
          (!Number.isFinite(command.durationMinutes) ||
            command.durationMinutes < 1 ||
            command.durationMinutes > 180)
        ) {
          this.reject(socket, attachment, command, "Timer must be 1-180 minutes.");
          return;
        }
        room.timerEndsAt =
          command.durationMinutes === null
            ? null
            : new Date(Date.now() + command.durationMinutes * 60_000).toISOString();
        changed = true;
        break;
      }
      case "host_finalize_recommendation": {
        if (!this.requireHost(socket, attachment, command)) return;
        const recommendation = room.recommendation;
        if (
          room.phase !== "recommendation" ||
          recommendation.finalized ||
          !recommendation.programId ||
          recommendation.commitmentIds.length < 4 ||
          recommendation.commitmentIds.length > 6
        ) {
          this.reject(
            socket,
            attachment,
            command,
            "Choose a program and four to six commitments before finalizing."
          );
          return;
        }
        const missingOwner = recommendation.commitmentIds.some(
          (id) =>
            !recommendation.responsibleParties[id]?.trim() ||
            !recommendation.implementationSources[id]?.trim() ||
            !recommendation.timings[id]?.trim()
        );
        if (
          missingOwner ||
          !recommendation.tradeoff.trim() ||
          !recommendation.unresolvedRisk.trim()
        ) {
          this.reject(
            socket,
            attachment,
            command,
            "Every commitment needs an owner, source, and timing. State the tradeoff and risk."
          );
          return;
        }
        room.tracks = applyTrackEffects(
          room.tracks,
          calculateRecommendationEffects(copperlineScenario, recommendation)
        );
        room.recommendation.finalized = true;
        this.event("The team finalized its recommendation.", "recommendation_finalized");
        changed = true;
        break;
      }
      case "host_set_hearing_challenges": {
        if (!this.requireHost(socket, attachment, command)) return;
        const valid = new Set(
          copperlineScenario.hearingChallenges.map((challenge) => challenge.id)
        );
        const challengeIds = [...new Set(command.challengeIds)].filter((id) => valid.has(id));
        if (challengeIds.length !== 3) {
          this.reject(socket, attachment, command, "Select exactly three hearing challenges.");
          return;
        }
        room.hearingChallengeIds = challengeIds;
        changed = true;
        break;
      }
      case "host_complete_game": {
        if (!this.requireHost(socket, attachment, command)) return;
        if (room.phase !== "hearing" && room.phase !== "epilogue") {
          this.reject(
            socket,
            attachment,
            command,
            "Complete the game from the hearing or epilogue."
          );
          return;
        }
        room.result = calculateGameResult(room.tracks);
        room.phase = room.phase === "hearing" ? "epilogue" : "completed";
        room.timerEndsAt = null;
        this.event(
          `The Copperline recommendation ended as a ${room.result.legacy} outcome.`,
          "game_complete"
        );
        changed = true;
        break;
      }
    }

    if (!changed) return;
    room.version += 1;
    await this.persist();
    this.send(socket, {
      type: "command_accepted",
      commandId: command.commandId,
      version: room.version
    });
    this.broadcastSnapshots();
    this.log(command.type, Date.now() - startedAt, false);
  }

  async webSocketClose(socket: WebSocket): Promise<void> {
    const attachment = socket.deserializeAttachment() as SocketAttachment | null;
    if (!attachment || attachment.mode !== "player" || !attachment.actorId || !this.internal)
      return;
    const stillConnected = this.ctx.getWebSockets().some((candidate) => {
      if (candidate === socket) return false;
      const other = candidate.deserializeAttachment() as SocketAttachment | null;
      return other?.mode === "player" && other.actorId === attachment.actorId;
    });
    const participant = this.participant(attachment.actorId);
    if (participant && !stillConnected) {
      participant.connected = false;
      await this.persist();
      this.broadcastSnapshots();
    }
  }

  async webSocketError(socket: WebSocket): Promise<void> {
    await this.webSocketClose(socket);
  }

  async alarm(): Promise<void> {
    for (const socket of this.ctx.getWebSockets()) {
      this.send(socket, { type: "room_expired" });
      socket.close(4001, "Room expired");
    }
    if (this.internal) this.log("room_expired", 0, false);
    this.internal = null;
    await this.ctx.storage.deleteAll();
  }
}
