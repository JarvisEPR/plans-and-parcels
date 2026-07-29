import { useCallback, useEffect, useRef, useState } from "react";
import type { ConnectionMode, RoomSnapshot, ServerMessage } from "@plans-and-parcels/game-core";
import type { ClientCommandInput } from "./command";

export type ConnectionStatus = "connecting" | "connected" | "disconnected" | "expired";

export interface RoomConnection {
  snapshot: RoomSnapshot | null;
  status: ConnectionStatus;
  error: string | null;
  send: (command: ClientCommandInput) => void;
  clearError: () => void;
}

export function useRoomSocket(roomCode: string, mode: ConnectionMode): RoomConnection {
  const [snapshot, setSnapshot] = useState<RoomSnapshot | null>(null);
  const [status, setStatus] = useState<ConnectionStatus>("connecting");
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<number | null>(null);
  const shouldReconnect = useRef(true);

  useEffect(() => {
    shouldReconnect.current = true;
    let attempts = 0;

    const connect = () => {
      setStatus("connecting");
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const socket = new WebSocket(
        `${protocol}//${window.location.host}/api/v1/rooms/${roomCode}/socket?mode=${mode}`
      );
      socketRef.current = socket;

      socket.addEventListener("open", () => {
        attempts = 0;
        setStatus("connected");
        setError(null);
      });

      socket.addEventListener("message", (event) => {
        const message = JSON.parse(String(event.data)) as ServerMessage;
        if (message.type === "snapshot") {
          setSnapshot(message.snapshot);
          setStatus("connected");
        } else if (message.type === "command_rejected") {
          setError(message.reason);
          if (message.snapshot) setSnapshot(message.snapshot);
        } else if (message.type === "room_expired") {
          shouldReconnect.current = false;
          setStatus("expired");
          setError("This temporary room has expired.");
        }
      });

      socket.addEventListener("close", (event) => {
        if (socketRef.current !== socket) return;
        socketRef.current = null;
        if (event.code === 4001) {
          shouldReconnect.current = false;
          setStatus("expired");
          return;
        }
        if (event.code === 4003) {
          shouldReconnect.current = false;
          setStatus("disconnected");
          setError("The facilitator removed this player from the room.");
          return;
        }
        setStatus("disconnected");
        if (!shouldReconnect.current) return;
        attempts += 1;
        reconnectTimer.current = window.setTimeout(connect, Math.min(500 * 2 ** attempts, 8000));
      });

      socket.addEventListener("error", () => {
        if (socketRef.current !== socket) return;
        setError("The live room connection was interrupted.");
      });
    };

    connect();
    return () => {
      shouldReconnect.current = false;
      if (reconnectTimer.current !== null) window.clearTimeout(reconnectTimer.current);
      socketRef.current?.close(1000, "Page closed");
    };
  }, [mode, roomCode]);

  const send = useCallback(
    (command: ClientCommandInput) => {
      if (!snapshot || socketRef.current?.readyState !== WebSocket.OPEN) {
        setError("The room is reconnecting. Try again in a moment.");
        return;
      }
      socketRef.current.send(
        JSON.stringify({
          ...command,
          commandId: crypto.randomUUID(),
          expectedVersion: snapshot.room.version
        })
      );
    },
    [snapshot]
  );

  return {
    snapshot,
    status,
    error,
    send,
    clearError: () => setError(null)
  };
}
