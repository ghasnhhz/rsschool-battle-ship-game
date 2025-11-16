import { games } from "../../models/state.js";
import { processAttack } from "./gameHandler.js";

export function handleAttack(data: any) {
  let parsedData = data;
  if (typeof data === "string") {
    try {
      parsedData = JSON.parse(data);
    } catch (err) {
      console.error("Failed to parse attack data:", data);
      return;
    }
  }

  let { gameId, x, y, indexPlayer } = parsedData;

  if (x === undefined || y === undefined || !indexPlayer) {
    console.error("Missing required fields in attack");
    return;
  }

  if (!gameId) {
    for (let [gId, game] of games.entries()) {
      for (let playerData of Object.values(game.players)) {
        if (playerData.playerIndex === indexPlayer) {
          gameId = gId;
          break;
        }
      }
      if (gameId) break;
    }
  }

  if (!gameId) {
    console.error("Could not find game for indexPlayer:", indexPlayer);
    return;
  }

  processAttack(gameId, x, y, indexPlayer);
}