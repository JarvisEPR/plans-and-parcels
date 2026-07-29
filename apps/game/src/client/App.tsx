import { useEffect, useState } from "react";
import type { RoomSnapshot } from "@plans-and-parcels/game-core";
import {
  Alert,
  CurrentPhase,
  EventLog,
  ParticipantRoster,
  PendingCheckCard,
  PhaseRail,
  QrPanel,
  Shell,
  StatusPill,
  Timer,
  TrackBoard
} from "./components";
import {
  CharacterSheet,
  CheckComposer,
  EvidenceBoard,
  FactionBoard,
  HearingBoard,
  OutcomeBoard,
  RecommendationEditor,
  RoleSelector
} from "./game-panels";
import { useRoomSocket } from "./socket";
import { apiString, readApiObject } from "./api";
import { useNextPhase } from "./phase";
import type { SendCommand } from "./command";

function normalizeCode(value: string): string {
  return value
    .toUpperCase()
    .replace(/[^23456789A-HJ-NP-Z]/g, "")
    .slice(0, 6);
}

function LoadingRoom({ message = "Opening the civic chamber..." }: { message?: string }) {
  return (
    <Shell>
      <div className="center-state">
        <div className="seal-loader" aria-hidden="true">
          P&amp;P
        </div>
        <h1>{message}</h1>
      </div>
    </Shell>
  );
}

function LandingPage() {
  const [roomCode, setRoomCode] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function createRoom() {
    setCreating(true);
    setError(null);
    try {
      const response = await fetch("/api/v1/rooms", { method: "POST" });
      const data = await readApiObject(response);
      const roomCode = apiString(data, "roomCode");
      const hostUrl = apiString(data, "hostUrl");
      const recoveryUrl = apiString(data, "recoveryUrl");
      if (!response.ok || !roomCode || !hostUrl || !recoveryUrl) {
        throw new Error(apiString(data, "error") ?? "The room could not be created.");
      }
      sessionStorage.setItem(`pp_recovery_${roomCode}`, recoveryUrl);
      window.location.assign(hostUrl);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The room could not be created.");
      setCreating(false);
    }
  }

  function joinRoom() {
    if (roomCode.length !== 6) {
      setError("Enter the six-character room code.");
      return;
    }
    window.location.assign(`/join/${roomCode}`);
  }

  return (
    <Shell>
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">A cooperative planning adventure</p>
          <h1>
            Every plan has a price.
            <span>Choose who carries it.</span>
          </h1>
          <p className="hero-intro">
            Form a multidisciplinary planning team. Investigate Copperline. Negotiate with
            stakeholders. Defend a recommendation that must survive the public record.
          </p>
          <div className="hero-actions">
            <button
              className="button primary large"
              disabled={creating}
              onClick={() => void createRoom()}
            >
              {creating ? "Creating room..." : "Facilitate a game"}
            </button>
            <a className="button ghost large" href="#join-room">
              Join a room
            </a>
          </div>
          <dl className="hero-facts">
            <div>
              <dt>4-6</dt>
              <dd>planning professionals</dd>
            </div>
            <div>
              <dt>120</dt>
              <dd>minutes</dd>
            </div>
            <div>
              <dt>0</dt>
              <dd>accounts required</dd>
            </div>
          </dl>
        </div>
        <div className="hero-map" aria-hidden="true">
          <div className="map-grid" />
          <span className="map-river" />
          <span className="map-rail" />
          <span className="map-district district-one">Hearthside</span>
          <span className="map-district district-two">Copper Row</span>
          <span className="map-district district-three">Station reserve</span>
          <div className="map-card">
            <small>Tonight's assignment</small>
            <strong>The Copperline Crossroads</strong>
            <span>45 days. 620 homes. No perfect answer.</span>
          </div>
        </div>
      </section>

      <section id="join-room" className="join-strip">
        <div>
          <p className="eyebrow">Already invited?</p>
          <h2>Enter the room code</h2>
        </div>
        <div className="join-form">
          <label className="sr-only" htmlFor="room-code">
            Six-character room code
          </label>
          <input
            id="room-code"
            className="code-input"
            value={roomCode}
            onChange={(event) => setRoomCode(normalizeCode(event.target.value))}
            placeholder="COPPER"
            maxLength={16}
            autoCapitalize="characters"
            autoComplete="off"
          />
          <button className="button primary" onClick={joinRoom}>
            Join
          </button>
        </div>
      </section>
      {error ? <Alert onClose={() => setError(null)}>{error}</Alert> : null}

      <section className="principles">
        <article>
          <span>01</span>
          <h3>Investigate</h3>
          <p>Find leverage in incomplete records, mismatched maps, and conflicting evidence.</p>
        </article>
        <article>
          <span>02</span>
          <h3>Negotiate</h3>
          <p>Meet stakeholders whose positions conflict but whose needs remain legitimate.</p>
        </article>
        <article>
          <span>03</span>
          <h3>Recommend</h3>
          <p>Balance trust, equity, capacity, and political support under a real clock.</p>
        </article>
      </section>
    </Shell>
  );
}

function HostRoute({ roomCode }: { roomCode: string }) {
  const recovery = new URLSearchParams(window.location.search).get("recovery");
  const [ready, setReady] = useState(recovery === null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!recovery) return;
    void fetch(`/api/v1/rooms/${roomCode}/recover`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ recovery })
    })
      .then(async (response) => {
        if (!response.ok) {
          const data = await readApiObject(response);
          throw new Error(apiString(data, "error") ?? "Recovery failed.");
        }
        window.history.replaceState({}, "", `/host/${roomCode}`);
        setReady(true);
      })
      .catch((caught: unknown) => {
        setError(caught instanceof Error ? caught.message : "Recovery failed.");
      });
  }, [recovery, roomCode]);

  if (error) {
    return (
      <Shell>
        <div className="center-state">
          <h1>Host recovery failed</h1>
          <Alert>{error}</Alert>
          <a className="button secondary" href="/">
            Return home
          </a>
        </div>
      </Shell>
    );
  }
  return ready ? (
    <HostDashboard roomCode={roomCode} />
  ) : (
    <LoadingRoom message="Recovering the host room..." />
  );
}

function HostDashboard({ roomCode }: { roomCode: string }) {
  const connection = useRoomSocket(roomCode, "host");
  const snapshot = connection.snapshot;
  const next = useNextPhase(snapshot?.room.phase ?? "lobby");
  const recoveryUrl = sessionStorage.getItem(`pp_recovery_${roomCode}`);

  if (!snapshot) return <LoadingRoom />;

  const canStart =
    snapshot.room.participants.length >= snapshot.scenario.minimumPlayers &&
    snapshot.room.participants.every((participant) => participant.roleId && participant.ready);

  async function exportRoom() {
    const response = await fetch(`/api/v1/rooms/${roomCode}/export`);
    if (!response.ok) return;
    const blob = await response.blob();
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `plans-and-parcels-${roomCode}.json`;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  return (
    <Shell compact>
      <div className="workspace-header">
        <div>
          <p className="eyebrow">Facilitator console / Room {roomCode}</p>
          <h1>{snapshot.scenario.title}</h1>
        </div>
        <div className="header-actions">
          <StatusPill status={connection.status} />
          <Timer endsAt={snapshot.room.timerEndsAt} />
          <a
            className="button ghost"
            href={`/display/${roomCode}`}
            target="_blank"
            rel="noreferrer"
          >
            Open display
          </a>
          <button className="button ghost" onClick={() => void exportRoom()}>
            Export
          </button>
        </div>
      </div>
      <PhaseRail current={snapshot.room.phase} />
      {connection.error ? <Alert onClose={connection.clearError}>{connection.error}</Alert> : null}

      <CurrentPhase snapshot={snapshot} />
      <div className="host-command-bar">
        <button
          className="button secondary"
          onClick={() => connection.send({ type: "host_set_lock", locked: !snapshot.room.locked })}
        >
          {snapshot.room.locked ? "Unlock room" : "Lock room"}
        </button>
        {[10, 15, 25].map((minutes) => (
          <button
            className="button ghost"
            key={minutes}
            onClick={() => connection.send({ type: "host_set_timer", durationMinutes: minutes })}
          >
            {minutes} min
          </button>
        ))}
        <button
          className="button ghost"
          onClick={() => connection.send({ type: "host_set_timer", durationMinutes: null })}
        >
          Clear timer
        </button>
        {next && next !== "completed" ? (
          <button
            className="button primary push-right"
            disabled={snapshot.room.phase === "lobby" && !canStart}
            onClick={() => connection.send({ type: "host_set_phase", phase: next })}
          >
            Advance to {next.replaceAll("_", " ")}
          </button>
        ) : null}
        {snapshot.room.phase === "hearing" || snapshot.room.phase === "epilogue" ? (
          <button
            className="button primary push-right"
            onClick={() => connection.send({ type: "host_complete_game" })}
          >
            {snapshot.room.phase === "hearing" ? "Calculate epilogue" : "Close public record"}
          </button>
        ) : null}
      </div>

      {snapshot.room.phase === "lobby" ? (
        <>
          <div className="dashboard-grid lobby-layout">
            <QrPanel url={snapshot.joinUrl} roomCode={roomCode} />
            <ParticipantRoster snapshot={snapshot} send={connection.send} host />
          </div>
          {recoveryUrl ? (
            <section className="recovery-panel">
              <div>
                <strong>Save the private host recovery link</strong>
                <p>
                  It restores facilitator access on another device. Never display it with the player
                  QR.
                </p>
              </div>
              <button
                className="button secondary"
                onClick={() => void navigator.clipboard.writeText(recoveryUrl)}
              >
                Copy recovery link
              </button>
            </section>
          ) : null}
        </>
      ) : null}

      {snapshot.room.phase === "lobby" ? (
        <TrackBoard snapshot={snapshot} send={connection.send} editable />
      ) : (
        <div className="dashboard-grid">
          <TrackBoard snapshot={snapshot} send={connection.send} editable />
          <ParticipantRoster snapshot={snapshot} send={connection.send} host />
        </div>
      )}

      <PendingCheckCard snapshot={snapshot} send={connection.send} host />

      {["briefing", "investigation"].includes(snapshot.room.phase) ? (
        <EvidenceBoard snapshot={snapshot} send={connection.send} host />
      ) : null}
      {snapshot.room.phase === "stakeholder_forum" ? (
        <FactionBoard snapshot={snapshot} send={connection.send} host />
      ) : null}
      {snapshot.room.phase === "recommendation" ? (
        <RecommendationEditor snapshot={snapshot} send={connection.send} host />
      ) : null}
      {snapshot.room.phase === "hearing" ? (
        <HearingBoard snapshot={snapshot} send={connection.send} host />
      ) : null}
      {["investigation", "stakeholder_forum", "hearing"].includes(snapshot.room.phase) ? (
        <CheckComposer snapshot={snapshot} send={connection.send} />
      ) : null}
      {["epilogue", "completed"].includes(snapshot.room.phase) ? (
        <OutcomeBoard snapshot={snapshot} />
      ) : null}
      <EventLog snapshot={snapshot} />
    </Shell>
  );
}

function JoinRoute({ roomCode }: { roomCode: string }) {
  const [joined, setJoined] = useState(false);
  const [checking, setChecking] = useState(true);
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void fetch(`/api/v1/rooms/${roomCode}/join`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ displayName: "" })
    })
      .then((response) => {
        if (response.ok) setJoined(true);
        setChecking(false);
      })
      .catch(() => setChecking(false));
  }, [roomCode]);

  async function join() {
    setError(null);
    const response = await fetch(`/api/v1/rooms/${roomCode}/join`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ displayName })
    });
    const data = await readApiObject(response);
    if (!response.ok) {
      setError(apiString(data, "error") ?? "Unable to join the room.");
      return;
    }
    setJoined(true);
  }

  if (checking) return <LoadingRoom message="Checking your invitation..." />;
  if (joined) return <PlayerDashboard roomCode={roomCode} />;

  return (
    <Shell>
      <section className="join-page">
        <div className="join-card">
          <p className="eyebrow">Room {roomCode}</p>
          <h1>Join the planning team</h1>
          <p>
            No account is required. Use a display name; the room and name expire within 24 hours.
          </p>
          <label>
            Display name
            <input
              value={displayName}
              maxLength={40}
              autoComplete="nickname"
              onChange={(event) => setDisplayName(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") void join();
              }}
            />
          </label>
          <button
            className="button primary large"
            disabled={!displayName.trim()}
            onClick={() => void join()}
          >
            Enter Copperline
          </button>
          {error ? <Alert onClose={() => setError(null)}>{error}</Alert> : null}
        </div>
      </section>
    </Shell>
  );
}

function PlayerDashboard({ roomCode }: { roomCode: string }) {
  const connection = useRoomSocket(roomCode, "player");
  const snapshot = connection.snapshot;
  if (!snapshot) return <LoadingRoom />;

  return (
    <Shell compact>
      <div className="mobile-session-header">
        <div>
          <small>Room {roomCode}</small>
          <strong>{snapshot.scenario.title}</strong>
        </div>
        <StatusPill status={connection.status} />
      </div>
      {connection.error ? <Alert onClose={connection.clearError}>{connection.error}</Alert> : null}
      <CurrentPhase snapshot={snapshot} />
      {snapshot.room.phase === "lobby" ? (
        <RoleSelector snapshot={snapshot} send={connection.send} />
      ) : (
        <CharacterSheet snapshot={snapshot} send={connection.send} />
      )}
      <PendingCheckCard snapshot={snapshot} send={connection.send} />
      <TrackBoard snapshot={snapshot} />
      {["briefing", "investigation"].includes(snapshot.room.phase) ? (
        <EvidenceBoard snapshot={snapshot} />
      ) : null}
      {snapshot.room.phase === "stakeholder_forum" ? <FactionBoard snapshot={snapshot} /> : null}
      {snapshot.room.phase === "recommendation" ? (
        <RecommendationEditor snapshot={snapshot} send={connection.send} />
      ) : null}
      {snapshot.room.phase === "hearing" ? (
        <HearingBoard snapshot={snapshot} send={connection.send} />
      ) : null}
      {["epilogue", "completed"].includes(snapshot.room.phase) ? (
        <OutcomeBoard snapshot={snapshot} />
      ) : null}
      <EventLog snapshot={snapshot} />
    </Shell>
  );
}

function RecommendationSummary({ snapshot }: { snapshot: RoomSnapshot }) {
  const recommendation = snapshot.room.recommendation;
  const program = snapshot.scenario.programs.find(
    (candidate) => candidate.id === recommendation.programId
  );
  if (!program) return null;
  return (
    <section className="display-recommendation">
      <p className="eyebrow">Team recommendation</p>
      <h2>{program.name}</h2>
      <p>{program.summary}</p>
      <div className="tag-list">
        {recommendation.commitmentIds.map((id) => {
          const commitment = snapshot.scenario.commitments.find((candidate) => candidate.id === id);
          return commitment ? <span key={id}>{commitment.name}</span> : null;
        })}
      </div>
    </section>
  );
}

function DisplayDashboard({ roomCode }: { roomCode: string }) {
  const connection = useRoomSocket(roomCode, "display");
  const snapshot = connection.snapshot;
  const noSend: SendCommand = () => undefined;
  if (!snapshot) return <LoadingRoom />;

  return (
    <Shell compact>
      <div className="display-header">
        <div>
          <p className="eyebrow">Room {roomCode}</p>
          <h1>{snapshot.scenario.title}</h1>
        </div>
        <div className="display-status">
          <StatusPill status={connection.status} />
          <Timer endsAt={snapshot.room.timerEndsAt} />
        </div>
      </div>
      {snapshot.room.phase === "lobby" ? (
        <div className="dashboard-grid lobby-layout">
          <QrPanel url={snapshot.joinUrl} roomCode={roomCode} />
          <ParticipantRoster snapshot={snapshot} />
        </div>
      ) : (
        <>
          <CurrentPhase snapshot={snapshot} />
          <TrackBoard snapshot={snapshot} />
          <PendingCheckCard snapshot={snapshot} send={noSend} />
          {["briefing", "investigation"].includes(snapshot.room.phase) ? (
            <EvidenceBoard snapshot={snapshot} />
          ) : null}
          {snapshot.room.phase === "stakeholder_forum" ? (
            <FactionBoard snapshot={snapshot} />
          ) : null}
          {["recommendation", "hearing"].includes(snapshot.room.phase) ? (
            <RecommendationSummary snapshot={snapshot} />
          ) : null}
          {snapshot.room.phase === "hearing" ? (
            <HearingBoard snapshot={snapshot} send={noSend} />
          ) : null}
          {["epilogue", "completed"].includes(snapshot.room.phase) ? (
            <OutcomeBoard snapshot={snapshot} />
          ) : null}
        </>
      )}
    </Shell>
  );
}

function InvalidRoom() {
  return (
    <Shell>
      <div className="center-state">
        <h1>That room code is not valid.</h1>
        <a className="button primary" href="/">
          Return home
        </a>
      </div>
    </Shell>
  );
}

export default function App() {
  const parts = window.location.pathname.split("/").filter(Boolean);
  const route = parts[0] ?? "";
  const roomCode = normalizeCode(parts[1] ?? "");

  if (!route) return <LandingPage />;
  if (roomCode.length !== 6) return <InvalidRoom />;
  if (route === "host") return <HostRoute roomCode={roomCode} />;
  if (route === "join") return <JoinRoute roomCode={roomCode} />;
  if (route === "display") return <DisplayDashboard roomCode={roomCode} />;
  return <InvalidRoom />;
}
