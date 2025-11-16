import WebSocket from "ws";
import { rooms, players, games } from "../models/state.js";

export function handlePlayerDisconnect(ws: WebSocket) {
  console.log("Client disconnected");
    
    let disconnectedPlayerId = "";
    let disconnectedPlayerName = "";
    
    for (let [playerId, player] of players.entries()) {
      if (player.ws === ws) {
        disconnectedPlayerId = playerId;
        disconnectedPlayerName = player.name;
        break;
      }
    }
    
    if (disconnectedPlayerId) {
      console.log(`Player "${disconnectedPlayerName}" (${disconnectedPlayerId}) disconnected`);
      
      for (let [roomId, room] of rooms.entries()) {
        const playerIndex = room.roomUsers.findIndex(u => u.index === disconnectedPlayerId);
        if (playerIndex !== -1) {
          rooms.delete(roomId);
          console.log(`Removed room ${roomId} (player was waiting)`);
          break;
        }
      }
      
      for (let [gameId, game] of games.entries()) {
        if (game.players[disconnectedPlayerId]) {
          for (let [opponentId, opponentData] of Object.entries(game.players)) {
            if (opponentId !== disconnectedPlayerId) {
              const opponent = players.get(opponentId);
              if (opponent && opponent.ws.readyState === WebSocket.OPEN) {
                opponent.ws.send(JSON.stringify({
                  type: "finish",
                  data: JSON.stringify({
                    winPlayer: opponentData.playerIndex
                  }),
                  id: 0
                }));
                console.log(` Game ${gameId} ended - opponent won by forfeit`);
              }
              break;
            }
          }
          games.delete(gameId);
          break;
        }
      }
    }
}