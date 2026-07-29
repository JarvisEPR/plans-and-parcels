import { GameRoom, type GameEnv } from "./room";
import {
  hostCookieName,
  makeCookie,
  playerCookieName,
  randomRoomCode,
  randomToken,
  readCookie
} from "./auth";
import { json, readJson, safeDisplayName } from "./http";

export { GameRoom };

const ROOM_PATH = /^\/api\/v1\/rooms\/([23456789A-HJ-NP-Z]{6})(?:\/(join|recover|export|socket))?$/;

function normalizeCode(value: string): string {
  return value
    .trim()
    .toUpperCase()
    .replace(/[^23456789A-HJ-NP-Z]/g, "")
    .slice(0, 6);
}

function roomStub(env: GameEnv, roomCode: string): DurableObjectStub<GameRoom> {
  return env.ROOMS.get(env.ROOMS.idFromName(roomCode));
}

async function createRoom(request: Request, env: GameEnv): Promise<Response> {
  const origin = new URL(request.url).origin;
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const roomCode = randomRoomCode();
    const hostToken = randomToken();
    const createdAt = new Date();
    const expiresAt = new Date(createdAt.getTime() + 24 * 60 * 60 * 1000);
    const joinUrl = `${origin}/join/${roomCode}`;
    const recoveryUrl = `${origin}/host/${roomCode}?recovery=${hostToken}`;
    const response = await roomStub(env, roomCode).fetch("https://room/init", {
      method: "POST",
      body: JSON.stringify({
        roomCode,
        joinUrl,
        hostToken,
        createdAt: createdAt.toISOString(),
        expiresAt: expiresAt.toISOString()
      })
    });
    if (response.status === 409) continue;
    if (!response.ok) return json({ error: "Unable to initialize a room." }, 500);
    return json(
      {
        roomCode,
        joinUrl,
        hostUrl: `${origin}/host/${roomCode}`,
        displayUrl: `${origin}/display/${roomCode}`,
        recoveryUrl,
        expiresAt: expiresAt.toISOString()
      },
      201,
      { "Set-Cookie": makeCookie(request, hostCookieName(roomCode), hostToken) }
    );
  }
  return json({ error: "Unable to allocate a room code. Try again." }, 503);
}

function parsePlayerCookie(value: string | null): { participantId: string; token: string } | null {
  if (!value) return null;
  const separator = value.indexOf(".");
  if (separator < 1) return null;
  return {
    participantId: value.slice(0, separator),
    token: value.slice(separator + 1)
  };
}

async function joinRoom(request: Request, env: GameEnv, roomCode: string): Promise<Response> {
  const existing = parsePlayerCookie(readCookie(request, playerCookieName(roomCode)));
  const stub = roomStub(env, roomCode);
  if (existing) {
    const rejoin = await stub.fetch("https://room/rejoin", {
      method: "POST",
      body: JSON.stringify({
        participantId: existing.participantId,
        playerToken: existing.token
      })
    });
    if (rejoin.ok) return rejoin;
  }

  const body = await readJson(request);
  const displayName = safeDisplayName(body?.displayName);
  if (!displayName) return json({ error: "Enter a display name of 1-40 characters." }, 400);
  const participantId = crypto.randomUUID();
  const playerToken = randomToken();
  const response = await stub.fetch("https://room/join", {
    method: "POST",
    body: JSON.stringify({ displayName, participantId, playerToken })
  });
  if (!response.ok) return response;
  const data = await response.json();
  return json(data, 201, {
    "Set-Cookie": makeCookie(request, playerCookieName(roomCode), `${participantId}.${playerToken}`)
  });
}

async function recoverHost(request: Request, env: GameEnv, roomCode: string): Promise<Response> {
  const body = await readJson(request);
  const recovery = typeof body?.recovery === "string" ? body.recovery : null;
  if (!recovery) return json({ error: "Recovery token required." }, 400);
  const response = await roomStub(env, roomCode).fetch("https://room/recover", {
    method: "POST",
    body: JSON.stringify({ hostToken: recovery })
  });
  if (!response.ok) return response;
  return json({ recovered: true }, 200, {
    "Set-Cookie": makeCookie(request, hostCookieName(roomCode), recovery)
  });
}

async function exportRoom(request: Request, env: GameEnv, roomCode: string): Promise<Response> {
  const token = readCookie(request, hostCookieName(roomCode));
  if (!token) return json({ error: "Host authorization required." }, 401);
  return roomStub(env, roomCode).fetch("https://room/export", {
    headers: { "x-pp-token": token }
  });
}

async function connectSocket(request: Request, env: GameEnv, roomCode: string): Promise<Response> {
  const url = new URL(request.url);
  const requestedMode = url.searchParams.get("mode");
  const mode =
    requestedMode === "host" || requestedMode === "player" || requestedMode === "display"
      ? requestedMode
      : null;
  if (!mode) return json({ error: "Invalid connection mode." }, 400);

  const headers = new Headers(request.headers);
  headers.set("x-pp-mode", mode);
  if (mode === "host") {
    const token = readCookie(request, hostCookieName(roomCode));
    if (token) headers.set("x-pp-token", token);
  } else if (mode === "player") {
    const player = parsePlayerCookie(readCookie(request, playerCookieName(roomCode)));
    if (player) {
      headers.set("x-pp-actor", player.participantId);
      headers.set("x-pp-token", player.token);
    }
  }

  return roomStub(env, roomCode).fetch("https://room/socket", {
    headers
  });
}

export default {
  async fetch(request: Request, env: GameEnv): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/api/v1/health") {
      return json({ status: "ok", service: "plans-and-parcels", version: "0.1.0" });
    }

    if (url.pathname === "/api/v1/rooms" && request.method === "POST") {
      return createRoom(request, env);
    }

    const match = ROOM_PATH.exec(url.pathname);
    if (match) {
      const roomCode = normalizeCode(match[1] ?? "");
      const action = match[2];
      if (action === "join" && request.method === "POST") {
        return joinRoom(request, env, roomCode);
      }
      if (action === "recover" && request.method === "POST") {
        return recoverHost(request, env, roomCode);
      }
      if (action === "export" && request.method === "GET") {
        return exportRoom(request, env, roomCode);
      }
      if (action === "socket") {
        return connectSocket(request, env, roomCode);
      }
    }

    if (url.pathname.startsWith("/api/")) return json({ error: "Route not found." }, 404);
    return env.ASSETS.fetch(request);
  }
} satisfies ExportedHandler<GameEnv>;
