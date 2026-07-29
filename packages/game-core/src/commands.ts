import type { ClientCommand } from "./types";

export function isClientCommand(value: unknown): value is ClientCommand {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.type === "string" &&
    typeof candidate.commandId === "string" &&
    candidate.commandId.length > 0 &&
    typeof candidate.expectedVersion === "number" &&
    Number.isInteger(candidate.expectedVersion)
  );
}
