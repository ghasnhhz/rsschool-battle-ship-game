import { WebSocket } from 'ws';
import { players } from "../models/state.js";

export function broadcastWinners() {
  const winners = [];

  for (let [, pl] of players.entries()) {
    if (pl.wins >= 1) {
      winners.push({
        name: pl.name,
        wins: pl.wins,
      });
    }
  }

  const message = JSON.stringify({
    type: "update_winners",
    data: JSON.stringify(winners),
    id: 0
  });

  for (let [, pl] of players.entries()) {
    if (pl.ws.readyState === WebSocket.OPEN) {
      pl.ws.send(message);
    }
  }
}