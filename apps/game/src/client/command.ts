import type { ClientCommand } from "@plans-and-parcels/game-core";

export type ClientCommandInput = ClientCommand extends infer Command
  ? Command extends ClientCommand
    ? Omit<Command, "commandId" | "expectedVersion">
    : never
  : never;

export type SendCommand = (command: ClientCommandInput) => void;
