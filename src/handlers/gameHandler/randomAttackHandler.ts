import { games } from "../../models/state.js";
import { processAttack } from "./gameHandler.js";

export function handleRandomAttack(data: any) {
  let parsedData = data;
  if (typeof data === "string") {
    try {
      parsedData = JSON.parse(data);
    } catch (err) {
      console.error("Failed to parse randomAttack data:", data);
      return;
    }
  }

  let { gameId, indexPlayer } = parsedData;

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

  if (!gameId || !indexPlayer) {
    console.error("Missing required fields in randomAttack");
    return;
  }

  const x = Math.floor(Math.random() * 10);
  const y = Math.floor(Math.random() * 10);

  console.log(`Random attack at (x:${x}, y:${y})`);
  processAttack(gameId, x, y, indexPlayer);
}