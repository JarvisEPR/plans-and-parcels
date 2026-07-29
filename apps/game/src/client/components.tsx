import { useEffect, useState, type ReactNode } from "react";
import QRCode from "qrcode";
import {
  GAME_PHASES,
  TRACK_NAMES,
  trackLabel,
  type GamePhase,
  type RoomSnapshot,
  type TrackName
} from "@plans-and-parcels/game-core";
import type { SendCommand } from "./command";
import type { ConnectionStatus } from "./socket";

export function Shell({ children, compact = false }: { children: ReactNode; compact?: boolean }) {
  return (
    <div className={compact ? "app-shell compact" : "app-shell"}>
      <header className="brand-bar">
        <a className="brand" href="/" aria-label="Plans and Parcels home">
          <span className="brand-mark" aria-hidden="true">
            P&P
          </span>
          <span>
            <strong>Plans &amp; Parcels</strong>
            <small>Civic choices. Shared consequences.</small>
          </span>
        </a>
      </header>
      <main id="main-content">{children}</main>
    </div>
  );
}

export function StatusPill({ status }: { status: ConnectionStatus }) {
  const label = {
    connecting: "Connecting",
    connected: "Live",
    disconnected: "Reconnecting",
    expired: "Expired"
  }[status];
  return (
    <span className={`status-pill ${status}`} role="status">
      <span className="status-dot" aria-hidden="true" />
      {label}
    </span>
  );
}

export function Alert({ children, onClose }: { children: ReactNode; onClose?: () => void }) {
  return (
    <div className="alert" role="alert">
      <span>{children}</span>
      {onClose ? (
        <button className="icon-button" onClick={onClose} aria-label="Dismiss message">
          &times;
        </button>
      ) : null}
    </div>
  );
}

export function QrPanel({ url, roomCode }: { url: string; roomCode: string }) {
  const [source, setSource] = useState("");
  useEffect(() => {
    void QRCode.toDataURL(url, {
      errorCorrectionLevel: "M",
      margin: 2,
      width: 360,
      color: { dark: "#0c2f35", light: "#fffdf7" }
    }).then(setSource);
  }, [url]);

  return (
    <section className="qr-panel" aria-labelledby="join-heading">
      <div>
        <p className="eyebrow">Join the planning team</p>
        <h2 id="join-heading">Scan to enter</h2>
        <p>Open the camera on your phone, or enter the room code manually.</p>
        <div className="room-code" aria-label={`Room code ${roomCode.split("").join(" ")}`}>
          {roomCode}
        </div>
        <button
          className="button secondary"
          onClick={() => void navigator.clipboard.writeText(url)}
        >
          Copy join link
        </button>
      </div>
      {source ? (
        <img className="qr-image" src={source} alt={`QR code for room ${roomCode}`} />
      ) : (
        <div className="qr-placeholder" aria-label="Generating QR code" />
      )}
    </section>
  );
}

export function PhaseRail({ current }: { current: GamePhase }) {
  const currentIndex = GAME_PHASES.indexOf(current);
  return (
    <ol className="phase-rail" aria-label="Session progress">
      {GAME_PHASES.filter((phase) => phase !== "completed").map((phase, index) => (
        <li
          key={phase}
          className={index < currentIndex ? "complete" : index === currentIndex ? "active" : ""}
        >
          <span>{index + 1}</span>
          {phase.replaceAll("_", " ")}
        </li>
      ))}
    </ol>
  );
}

export function TrackBoard({
  snapshot,
  send,
  editable = false
}: {
  snapshot: RoomSnapshot;
  send?: SendCommand;
  editable?: boolean;
}) {
  const [reasons, setReasons] = useState<Record<TrackName, string>>({
    publicTrust: "",
    equity: "",
    implementationCapacity: "",
    politicalSupport: ""
  });

  return (
    <section className="track-board" aria-labelledby="tracks-heading">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Shared civic condition</p>
          <h2 id="tracks-heading">Civic tracks</h2>
        </div>
      </div>
      <div className="track-grid">
        {TRACK_NAMES.map((track) => {
          const value = snapshot.room.tracks[track];
          return (
            <article className={`track-card track-${track}`} key={track}>
              <header>
                <span>{trackLabel(track)}</span>
                <strong>{value}</strong>
              </header>
              <div
                className="track-meter"
                role="meter"
                aria-label={trackLabel(track)}
                aria-valuemin={0}
                aria-valuemax={8}
                aria-valuenow={value}
              >
                <span style={{ width: `${(value / 8) * 100}%` }} />
              </div>
              {editable && send ? (
                <div className="track-controls">
                  <input
                    aria-label={`Reason for changing ${trackLabel(track)}`}
                    placeholder="Reason"
                    value={reasons[track]}
                    onChange={(event) =>
                      setReasons((current) => ({ ...current, [track]: event.target.value }))
                    }
                  />
                  <button
                    className="icon-button"
                    aria-label={`Decrease ${trackLabel(track)}`}
                    onClick={() =>
                      send({
                        type: "host_adjust_track",
                        track,
                        amount: -1,
                        reason: reasons[track] || "Facilitator ruling"
                      })
                    }
                  >
                    -
                  </button>
                  <button
                    className="icon-button"
                    aria-label={`Increase ${trackLabel(track)}`}
                    onClick={() =>
                      send({
                        type: "host_adjust_track",
                        track,
                        amount: 1,
                        reason: reasons[track] || "Facilitator ruling"
                      })
                    }
                  >
                    +
                  </button>
                </div>
              ) : null}
            </article>
          );
        })}
      </div>
    </section>
  );
}

export function Timer({ endsAt }: { endsAt: string | null }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, []);
  if (!endsAt) return <span className="timer idle">No timer</span>;
  const remaining = Math.max(0, new Date(endsAt).getTime() - now);
  const minutes = Math.floor(remaining / 60_000);
  const seconds = Math.floor((remaining % 60_000) / 1000);
  return (
    <span className={remaining === 0 ? "timer elapsed" : "timer"} role="timer">
      {minutes}:{seconds.toString().padStart(2, "0")}
    </span>
  );
}

export function ParticipantRoster({
  snapshot,
  send,
  host = false
}: {
  snapshot: RoomSnapshot;
  send?: SendCommand;
  host?: boolean;
}) {
  return (
    <section className="panel" aria-labelledby="roster-heading">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Planning team</p>
          <h2 id="roster-heading">
            {snapshot.room.participants.length}/{snapshot.scenario.maximumPlayers} players
          </h2>
        </div>
      </div>
      <ul className="roster">
        {snapshot.room.participants.map((participant) => {
          const role = snapshot.scenario.roles.find(
            (candidate) => candidate.id === participant.roleId
          );
          return (
            <li key={participant.id}>
              <span className={participant.connected ? "presence online" : "presence"} />
              <span>
                <strong>{participant.displayName}</strong>
                <small>{role?.profession ?? "Choosing a role"}</small>
              </span>
              {participant.ready ? <span className="ready-mark">Ready</span> : null}
              {host && send ? (
                <button
                  className="text-button danger"
                  onClick={() => send({ type: "host_kick", participantId: participant.id })}
                >
                  Remove
                </button>
              ) : null}
            </li>
          );
        })}
        {snapshot.room.participants.length === 0 ? (
          <li className="empty-state">Waiting for players to scan the QR code.</li>
        ) : null}
      </ul>
    </section>
  );
}

export function PendingCheckCard({
  snapshot,
  send,
  host = false
}: {
  snapshot: RoomSnapshot;
  send: SendCommand;
  host?: boolean;
}) {
  const check = snapshot.room.pendingCheck;
  if (!check) return null;
  const actor = snapshot.room.participants.find((participant) => participant.id === check.actorId);
  const helper = snapshot.room.participants.find(
    (participant) => participant.id === check.helperId
  );
  const isActor = snapshot.actorId === check.actorId;
  const canSupport = snapshot.mode === "player" && snapshot.actorId !== check.actorId;
  return (
    <section className="check-card" aria-live="polite">
      <div>
        <p className="eyebrow">Active check / DC {check.dc}</p>
        <h2>
          {actor?.displayName ?? "Planner"} uses {check.attribute}
        </h2>
        <p>{check.stakes || "The facilitator has framed the stakes."}</p>
        {helper ? <p className="support-note">Supported by {helper.displayName} (+2)</p> : null}
      </div>
      {check.roll === null ? (
        <div className="check-actions">
          {canSupport ? (
            <button className="button secondary" onClick={() => send({ type: "support_check" })}>
              {helper?.id === snapshot.actorId ? "Withdraw support" : "Support this check"}
            </button>
          ) : null}
          {isActor ? (
            <button className="button primary" onClick={() => send({ type: "roll_check" })}>
              Roll d20
            </button>
          ) : null}
          {host ? (
            <button className="button ghost" onClick={() => send({ type: "host_clear_check" })}>
              Cancel check
            </button>
          ) : null}
        </div>
      ) : (
        <div className={`roll-result ${check.outcome ?? ""}`}>
          <span className="die">{check.roll}</span>
          <span>
            <strong>{check.outcome}</strong>
            <small>
              {check.roll} + {check.modifier} = {check.total}
            </small>
          </span>
          {host ? (
            <button className="button ghost" onClick={() => send({ type: "host_clear_check" })}>
              Close result
            </button>
          ) : null}
        </div>
      )}
    </section>
  );
}

export function EventLog({ snapshot }: { snapshot: RoomSnapshot }) {
  return (
    <section className="panel" aria-labelledby="event-heading">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Public record</p>
          <h2 id="event-heading">Session log</h2>
        </div>
      </div>
      <ol className="event-log">
        {[...snapshot.room.events]
          .reverse()
          .slice(0, 10)
          .map((event) => (
            <li key={event.id}>
              <time dateTime={event.at}>
                {new Date(event.at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
              </time>
              <span>{event.message}</span>
            </li>
          ))}
      </ol>
    </section>
  );
}

export function CurrentPhase({ snapshot }: { snapshot: RoomSnapshot }) {
  const phase = snapshot.room.phase;
  const copy: Record<GamePhase, string> = {
    lobby: "Assemble the planning team and claim professional roles.",
    briefing: "Review the assignment, constraints, and initial professional knowledge.",
    investigation: "Pursue evidence. Failed checks create costs but never block the scenario.",
    stakeholder_forum: "Identify interests beneath positions and negotiate specific support.",
    recommendation: "Choose a program and four to six binding commitments.",
    hearing: "Defend the package against three accumulated challenges.",
    epilogue: "Read the consequences of the team's strongest and weakest civic conditions.",
    completed: "The public record is closed. Export the after-action report."
  };
  return (
    <section className="phase-banner">
      <div>
        <p className="eyebrow">Current phase</p>
        <h1>{phase.replaceAll("_", " ")}</h1>
        <p>{copy[phase]}</p>
      </div>
      <Timer endsAt={snapshot.room.timerEndsAt} />
    </section>
  );
}
