import { WebSocket } from "ws";
import { games, players } from "../models/state.js";

export function handleAddShips(data: any) {
  let parsedData = data;
  if (typeof data === "string") {
    try {
      parsedData = JSON.parse(data);
    } catch (err) {
      console.error("Failed to parse add_ships data:", data);
      return;
    }
  }

  let { gameId, ships, indexPlayer } = parsedData;

  if (!ships || !indexPlayer) {
    console.error("Missing required fields in add_ships");
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


  const game = games.get(gameId);
  if (!game) {
    console.error(`Game ${gameId} not found`);
    return;
  }

  let playerAccountId = "";
  for (let [accountId, playerData] of Object.entries(game.players)) {
    if (playerData.playerIndex === indexPlayer) {
      playerAccountId = accountId;
      break;
    }
  }

  if (!playerAccountId) {
    console.error(`Player with indexPlayer ${indexPlayer} not found in game ${gameId}`);
    return;
  }

  game.players[playerAccountId].ships = ships;
  console.log(`Result: Ships added for player ${indexPlayer} in game ${gameId}`);

  const allPlayersReady = Object.values(game.players).every(
    player => player.ships && player.ships.length > 0
  );

  if (allPlayersReady) {
    console.log(`Both players ready in game ${gameId} - starting game!`);
    startGame(gameId);
  }
}

function startGame(gameId: string) {
  const game = games.get(gameId);
  if (!game) return;

  console.log(`Starting game ${gameId}`);

  for (let [accountId, playerData] of Object.entries(game.players)) {
    const player = players.get(accountId);
    
    if (player && player.ws.readyState === WebSocket.OPEN) {
      player.ws.send(JSON.stringify({
        type: "start_game",
        data: JSON.stringify({
          ships: playerData.ships,
          currentPlayerIndex: playerData.playerIndex
        }),
        id: 0
      }));
      console.log(`Result: Sent start_game to player ${playerData.playerIndex}`);
    }
  }

  const playerIndexes = Object.values(game.players).map(p => p.playerIndex);
  const firstPlayer = playerIndexes[Math.floor(Math.random() * playerIndexes.length)];
  
  game.currentTurn = firstPlayer;

  sendTurn(gameId, firstPlayer);
}

function sendTurn(gameId: string, currentPlayerIndex: string) {
  const game = games.get(gameId);
  if (!game) return;

  const message = JSON.stringify({
    type: "turn",
    data: JSON.stringify({
      currentPlayer: currentPlayerIndex
    }),
    id: 0
  });

  for (let [accountId] of Object.entries(game.players)) {
    const player = players.get(accountId);
    if (player && player.ws.readyState === WebSocket.OPEN) {
      player.ws.send(message);
    }
  }
}