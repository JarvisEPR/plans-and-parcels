import { useMemo } from "react";
import { GAME_PHASES, type GamePhase } from "@plans-and-parcels/game-core";

export function useNextPhase(current: GamePhase): GamePhase | null {
  return useMemo(() => {
    const index = GAME_PHASES.indexOf(current);
    return index >= 0 ? (GAME_PHASES[index + 1] ?? null) : null;
  }, [current]);
}
