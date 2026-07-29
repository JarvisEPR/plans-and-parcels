import { useEffect, useState } from "react";
import {
  ATTRIBUTE_NAMES,
  trackLabel,
  type AttributeName,
  type RecommendationState,
  type RoomSnapshot
} from "@plans-and-parcels/game-core";
import type { SendCommand } from "./command";

export function RoleSelector({ snapshot, send }: { snapshot: RoomSnapshot; send: SendCommand }) {
  const actor = snapshot.room.participants.find(
    (participant) => participant.id === snapshot.actorId
  );
  const claimed = new Set(
    snapshot.room.participants
      .filter((participant) => participant.id !== snapshot.actorId)
      .map((participant) => participant.roleId)
      .filter(Boolean)
  );

  return (
    <section aria-labelledby="role-heading">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Professional party</p>
          <h2 id="role-heading">Choose your role</h2>
        </div>
      </div>
      <div className="role-grid">
        {snapshot.scenario.roles.map((role) => {
          const unavailable = claimed.has(role.id);
          const selected = actor?.roleId === role.id;
          return (
            <article
              key={role.id}
              className={`role-card ${selected ? "selected" : ""} ${unavailable ? "unavailable" : ""}`}
            >
              <p className="eyebrow">{role.profession}</p>
              <h3>{role.characterName}</h3>
              <p>{role.purpose}</p>
              <div className="attribute-row">
                {Object.entries(role.attributes).map(([name, value]) => (
                  <span key={name}>
                    {name.slice(0, 3).toUpperCase()} <strong>{value}</strong>
                  </span>
                ))}
              </div>
              <button
                className={selected ? "button secondary" : "button primary"}
                disabled={unavailable}
                onClick={() =>
                  send(
                    selected ? { type: "release_role" } : { type: "claim_role", roleId: role.id }
                  )
                }
              >
                {unavailable ? "Claimed" : selected ? "Release role" : "Choose role"}
              </button>
            </article>
          );
        })}
      </div>
      {actor?.roleId ? (
        <button
          className={actor.ready ? "button secondary ready-button" : "button primary ready-button"}
          onClick={() => send({ type: "set_ready", ready: !actor.ready })}
        >
          {actor.ready ? "Ready - click to revise" : "I am ready"}
        </button>
      ) : null}
    </section>
  );
}

export function CharacterSheet({ snapshot, send }: { snapshot: RoomSnapshot; send: SendCommand }) {
  const actor = snapshot.room.participants.find(
    (participant) => participant.id === snapshot.actorId
  );
  const role = snapshot.scenario.roles.find((candidate) => candidate.id === actor?.roleId);
  if (!actor || !role) return null;

  return (
    <section className="character-sheet">
      <div className="character-title">
        <p className="eyebrow">{role.profession}</p>
        <h1>{role.characterName}</h1>
        <p>{role.purpose}</p>
      </div>
      <div className="stat-grid">
        {Object.entries(role.attributes).map(([name, value]) => (
          <div key={name}>
            <strong>{value}</strong>
            <span>{name}</span>
          </div>
        ))}
      </div>
      <div className="character-columns">
        <div>
          <h2>Specialties</h2>
          <ul className="detail-list">
            {role.specialties.map((specialty) => (
              <li key={specialty.id}>
                <strong>{specialty.name}</strong>
                <span>{specialty.description}</span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2>Professional move</h2>
          <div className="move-card">
            <strong>{role.professionalMove.name}</strong>
            <p>{role.professionalMove.description}</p>
            <button
              className="button secondary"
              disabled={actor.professionalMoveUsed}
              onClick={() => send({ type: "use_professional_move" })}
            >
              {actor.professionalMoveUsed ? "Move used" : "Use professional move"}
            </button>
          </div>
        </div>
      </div>
      {role.startingKnowledge ? (
        <aside className="knowledge-card">
          <p className="eyebrow">What you know</p>
          <p>{role.startingKnowledge}</p>
          <blockquote>{role.prompt}</blockquote>
        </aside>
      ) : null}
    </section>
  );
}

export function EvidenceBoard({
  snapshot,
  send,
  host = false
}: {
  snapshot: RoomSnapshot;
  send?: SendCommand;
  host?: boolean;
}) {
  return (
    <section className="panel" aria-labelledby="evidence-heading">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Case file</p>
          <h2 id="evidence-heading">Evidence</h2>
        </div>
      </div>
      <div className="card-list">
        {snapshot.scenario.evidence.map((evidence) => {
          const revealed = snapshot.room.revealedEvidenceIds.includes(evidence.id);
          return (
            <article className={`evidence-card ${revealed ? "revealed" : ""}`} key={evidence.id}>
              <div>
                <h3>{evidence.title}</h3>
                <p>{revealed || host ? evidence.detail : evidence.summary}</p>
                {revealed && evidence.leverage ? <small>{evidence.leverage}</small> : null}
              </div>
              {host && send && evidence.visibility !== "public" ? (
                <button
                  className="button ghost"
                  onClick={() =>
                    send({
                      type: "host_reveal_evidence",
                      evidenceId: evidence.id,
                      revealed: !revealed
                    })
                  }
                >
                  {revealed ? "Conceal" : "Reveal"}
                </button>
              ) : null}
            </article>
          );
        })}
        {snapshot.scenario.evidence.length === 0 ? (
          <p className="empty-state">No evidence has been entered into the public record.</p>
        ) : null}
      </div>
    </section>
  );
}

export function FactionBoard({
  snapshot,
  send,
  host = false
}: {
  snapshot: RoomSnapshot;
  send?: SendCommand;
  host?: boolean;
}) {
  return (
    <section className="panel" aria-labelledby="faction-heading">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Stakeholder forum</p>
          <h2 id="faction-heading">Factions</h2>
        </div>
      </div>
      <div className="faction-grid">
        {snapshot.scenario.factions.map((faction) => {
          const active = snapshot.room.activeFactionIds.includes(faction.id);
          return (
            <article className={active ? "faction-card active" : "faction-card"} key={faction.id}>
              <h3>{faction.name}</h3>
              <p>{faction.publicPosition}</p>
              {faction.underlyingNeed ? (
                <dl>
                  <dt>Underlying need</dt>
                  <dd>{faction.underlyingNeed}</dd>
                  <dt>Fear</dt>
                  <dd>{faction.fear}</dd>
                  <dt>Leverage</dt>
                  <dd>{faction.leverage}</dd>
                </dl>
              ) : null}
              {host && send ? (
                <button
                  className="button ghost"
                  onClick={() =>
                    send({ type: "host_set_faction", factionId: faction.id, active: !active })
                  }
                >
                  {active ? "End meeting" : "Begin meeting"}
                </button>
              ) : null}
            </article>
          );
        })}
      </div>
    </section>
  );
}

export function RecommendationEditor({
  snapshot,
  send,
  host = false
}: {
  snapshot: RoomSnapshot;
  send: SendCommand;
  host?: boolean;
}) {
  const [draft, setDraft] = useState<RecommendationState>(snapshot.room.recommendation);
  const [savedVersion, setSavedVersion] = useState(snapshot.room.version);

  useEffect(() => {
    if (snapshot.room.version !== savedVersion) {
      setDraft(snapshot.room.recommendation);
      setSavedVersion(snapshot.room.version);
    }
  }, [savedVersion, snapshot.room.recommendation, snapshot.room.version]);

  const updateRecord = (
    key: "responsibleParties" | "implementationSources" | "timings",
    id: string,
    value: string
  ) => setDraft((current) => ({ ...current, [key]: { ...current[key], [id]: value } }));

  const selectCommitment = (id: string) => {
    setDraft((current) => {
      const selected = current.commitmentIds.includes(id);
      if (!selected && current.commitmentIds.length >= 6) return current;
      return {
        ...current,
        commitmentIds: selected
          ? current.commitmentIds.filter((candidate) => candidate !== id)
          : [...current.commitmentIds, id],
        supportedCommitmentIds: selected
          ? current.supportedCommitmentIds.filter((candidate) => candidate !== id)
          : current.supportedCommitmentIds
      };
    });
  };

  return (
    <section className="recommendation-board" aria-labelledby="recommendation-heading">
      <div className="section-heading">
        <div>
          <p className="eyebrow">The central decision</p>
          <h2 id="recommendation-heading">Build the recommendation</h2>
        </div>
        <span className="selection-count">{draft.commitmentIds.length}/6 commitments</span>
      </div>

      <fieldset>
        <legend>Development program</legend>
        <div className="option-grid">
          {snapshot.scenario.programs.map((program) => (
            <label
              className={draft.programId === program.id ? "option-card selected" : "option-card"}
              key={program.id}
            >
              <input
                type="radio"
                name="program"
                checked={draft.programId === program.id}
                onChange={() => setDraft((current) => ({ ...current, programId: program.id }))}
              />
              <strong>{program.name}</strong>
              <span>{program.summary}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend>Binding commitments</legend>
        <div className="commitment-list">
          {snapshot.scenario.commitments.map((commitment) => {
            const selected = draft.commitmentIds.includes(commitment.id);
            const supported = draft.supportedCommitmentIds.includes(commitment.id);
            return (
              <article
                className={selected ? "commitment selected" : "commitment"}
                key={commitment.id}
              >
                <label>
                  <input
                    type="checkbox"
                    checked={selected}
                    onChange={() => selectCommitment(commitment.id)}
                  />
                  <span>
                    <strong>{commitment.name}</strong>
                    <small>{commitment.summary}</small>
                  </span>
                </label>
                {selected ? (
                  <div className="commitment-fields">
                    <input
                      aria-label={`${commitment.name} responsible party`}
                      placeholder="Responsible party"
                      value={draft.responsibleParties[commitment.id] ?? ""}
                      onChange={(event) =>
                        updateRecord("responsibleParties", commitment.id, event.target.value)
                      }
                    />
                    <input
                      aria-label={`${commitment.name} funding or authority`}
                      placeholder="Funding or authority"
                      value={draft.implementationSources[commitment.id] ?? ""}
                      onChange={(event) =>
                        updateRecord("implementationSources", commitment.id, event.target.value)
                      }
                    />
                    <input
                      aria-label={`${commitment.name} timing`}
                      placeholder="Timing or enforcement"
                      value={draft.timings[commitment.id] ?? ""}
                      onChange={(event) =>
                        updateRecord("timings", commitment.id, event.target.value)
                      }
                    />
                    {host ? (
                      <label className="support-toggle">
                        <input
                          type="checkbox"
                          checked={supported}
                          onChange={() =>
                            setDraft((current) => ({
                              ...current,
                              supportedCommitmentIds: supported
                                ? current.supportedCommitmentIds.filter(
                                    (candidate) => candidate !== commitment.id
                                  )
                                : [...current.supportedCommitmentIds, commitment.id]
                            }))
                          }
                        />
                        Supported: {commitment.supportCondition}
                      </label>
                    ) : (
                      <small>Support needed: {commitment.supportCondition}</small>
                    )}
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      </fieldset>

      <div className="two-column-form">
        <label>
          Acknowledged tradeoff
          <textarea
            value={draft.tradeoff}
            onChange={(event) =>
              setDraft((current) => ({ ...current, tradeoff: event.target.value }))
            }
          />
        </label>
        <label>
          Unresolved risk
          <textarea
            value={draft.unresolvedRisk}
            onChange={(event) =>
              setDraft((current) => ({ ...current, unresolvedRisk: event.target.value }))
            }
          />
        </label>
      </div>

      <div className="action-row">
        <button
          className="button secondary"
          disabled={snapshot.room.recommendation.finalized}
          onClick={() => send({ type: "set_recommendation", recommendation: draft })}
        >
          Save shared draft
        </button>
        {host ? (
          <button
            className="button primary"
            disabled={snapshot.room.recommendation.finalized}
            onClick={() => send({ type: "host_finalize_recommendation" })}
          >
            Finalize and apply effects
          </button>
        ) : null}
      </div>
    </section>
  );
}

export function CheckComposer({ snapshot, send }: { snapshot: RoomSnapshot; send: SendCommand }) {
  const [actorId, setActorId] = useState(snapshot.room.participants[0]?.id ?? "");
  const [attribute, setAttribute] = useState<AttributeName>("analysis");
  const [specialtyId, setSpecialtyId] = useState("");
  const [dc, setDc] = useState(13);
  const [stakes, setStakes] = useState("");

  const actor = snapshot.room.participants.find((participant) => participant.id === actorId);
  const role = snapshot.scenario.roles.find((candidate) => candidate.id === actor?.roleId);

  useEffect(() => {
    if (!actorId && snapshot.room.participants[0]) {
      setActorId(snapshot.room.participants[0].id);
    }
  }, [actorId, snapshot.room.participants]);

  return (
    <section className="panel" aria-labelledby="check-composer-heading">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Facilitator action</p>
          <h2 id="check-composer-heading">Open a check</h2>
        </div>
      </div>
      <div className="check-form">
        <label>
          Acting planner
          <select value={actorId} onChange={(event) => setActorId(event.target.value)}>
            <option value="">Select player</option>
            {snapshot.room.participants
              .filter((participant) => participant.roleId)
              .map((participant) => (
                <option key={participant.id} value={participant.id}>
                  {participant.displayName}
                </option>
              ))}
          </select>
        </label>
        <label>
          Attribute
          <select
            value={attribute}
            onChange={(event) => setAttribute(event.target.value as AttributeName)}
          >
            {ATTRIBUTE_NAMES.map((name) => (
              <option value={name} key={name}>
                {name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Specialty
          <select value={specialtyId} onChange={(event) => setSpecialtyId(event.target.value)}>
            <option value="">None</option>
            {role?.specialties.map((specialty) => (
              <option value={specialty.id} key={specialty.id}>
                {specialty.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Difficulty
          <select value={dc} onChange={(event) => setDc(Number(event.target.value))}>
            <option value={10}>10 - routine under pressure</option>
            <option value={13}>13 - challenging</option>
            <option value={16}>16 - exceptional</option>
          </select>
        </label>
        <label className="wide">
          Stakes
          <input
            value={stakes}
            onChange={(event) => setStakes(event.target.value)}
            placeholder="What success achieves and what failure may cost"
          />
        </label>
      </div>
      <button
        className="button primary"
        disabled={!actorId || snapshot.room.pendingCheck !== null}
        onClick={() =>
          send({
            type: "host_open_check",
            actorId,
            attribute,
            specialtyId: specialtyId || null,
            dc,
            stakes
          })
        }
      >
        Open check
      </button>
    </section>
  );
}

export function HearingBoard({
  snapshot,
  send,
  host = false
}: {
  snapshot: RoomSnapshot;
  send: SendCommand;
  host?: boolean;
}) {
  const [selected, setSelected] = useState(snapshot.room.hearingChallengeIds);
  return (
    <section className="panel" aria-labelledby="hearing-heading">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Public hearing</p>
          <h2 id="hearing-heading">Challenges</h2>
        </div>
        <span className="selection-count">{selected.length}/3 selected</span>
      </div>
      <div className="challenge-grid">
        {snapshot.scenario.hearingChallenges.map((challenge) => {
          const active = snapshot.room.hearingChallengeIds.includes(challenge.id);
          const checked = selected.includes(challenge.id);
          if (!host && !active) return null;
          return (
            <article
              className={active ? "challenge-card active" : "challenge-card"}
              key={challenge.id}
            >
              {host ? (
                <label>
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() =>
                      setSelected((current) =>
                        current.includes(challenge.id)
                          ? current.filter((id) => id !== challenge.id)
                          : current.length < 3
                            ? [...current, challenge.id]
                            : current
                      )
                    }
                  />
                  Select
                </label>
              ) : null}
              <p className="eyebrow">DC {challenge.defaultDc}</p>
              <h3>{challenge.name}</h3>
              <p>{challenge.prompt}</p>
              <small>Relevant: {challenge.relevantAttributes.join(", ")}</small>
            </article>
          );
        })}
      </div>
      {host ? (
        <button
          className="button secondary"
          disabled={selected.length !== 3}
          onClick={() => send({ type: "host_set_hearing_challenges", challengeIds: selected })}
        >
          Confirm three challenges
        </button>
      ) : null}
    </section>
  );
}

export function OutcomeBoard({ snapshot }: { snapshot: RoomSnapshot }) {
  const result = snapshot.room.result;
  if (!result) return null;
  return (
    <section className={`outcome-board ${result.legacy}`}>
      <p className="eyebrow">Five years later</p>
      <h1>{result.legacy} legacy</h1>
      <p className="outcome-summary">
        The recommendation was <strong>{result.adoption}</strong> with a civic total of{" "}
        <strong>{result.total}</strong>.
      </p>
      <div className="outcome-columns">
        <div>
          <h2>What endured</h2>
          {result.strongestTracks.map((track) => {
            const epilogue = snapshot.scenario.epilogues.find((entry) => entry.track === track);
            return (
              <p key={track}>
                <strong>{trackLabel(track)}:</strong> {epilogue?.strongest}
              </p>
            );
          })}
        </div>
        <div>
          <h2>What remained difficult</h2>
          {result.weakestTracks.map((track) => {
            const epilogue = snapshot.scenario.epilogues.find((entry) => entry.track === track);
            return (
              <p key={track}>
                <strong>{trackLabel(track)}:</strong> {epilogue?.weakest}
              </p>
            );
          })}
        </div>
      </div>
      <blockquote>
        Five years later, what part of Copperline does your planner visit, and what do they see?
      </blockquote>
    </section>
  );
}
