import WebSocket from "ws";
import { rooms, players, games } from "../models/state.js";
import { generateId } from "../utils/generateId.js";  
import { createBotGame } from "../botHandlers/botHandler.js";

export function handleCreateRoom(ws: WebSocket) {
  let currentPlayerId = "";
  let currentPlayer = null;

  for (let [playerId, player] of players.entries()) {
    if (player.ws === ws) {
      currentPlayerId = playerId;
      currentPlayer = player;
      break;
    }
  }

  if (!currentPlayerId || !currentPlayer) {
    console.error("User not found");
    return;
  }

  const roomId = generateId();

  rooms.set(roomId, {
    roomUsers: [{
      name: currentPlayer.name,
      index: currentPlayerId
    }]
  });

  console.log(`Result: Room ${roomId} created`);

  broadcastRooms();
}

export function handleSinglePlay(ws: WebSocket) {
  let currentPlayerId = "";
  
  for (let [playerId, player] of players.entries()) {
    if (player.ws === ws) {
      currentPlayerId = playerId;
      break;
    }
  }

  if (!currentPlayerId) {
    console.error("Player not found for single play");
    return;
  }

  console.log(`Result: Creating bot game for player ${currentPlayerId}`);
  
  createBotGame(currentPlayerId);
}

export function handleAddUserToRoom(ws: WebSocket, data: any) {
  let currentPlayerId = "";
  let currentPlayerName = null; 

  for (let [id, player] of players.entries()) {
    if (player.ws === ws) {
      currentPlayerId = id;
      currentPlayerName = player.name;
      break;
    }
  }

  if (!currentPlayerId || !currentPlayerName) {
    console.error("Player not found");
    return;
  }

  const parsedData = JSON.parse(data);
  const { indexRoom } = parsedData;

  const room = rooms.get(indexRoom);

  if (!room) {
    console.error(`Room ${indexRoom} not found`);
    return;
  }

  room.roomUsers.push({
    name: currentPlayerName,
    index: currentPlayerId,
  });

  console.log(`Result: User ${currentPlayerName} with id ${currentPlayerId} is added to room ${indexRoom}`);

  broadcastCreateGame(room, indexRoom);
  broadcastRooms();
}

export function broadcastRooms() {
  const allRooms = [];

  for (let [roomId, room] of rooms.entries()) {
    const eachRoom = {
      roomId,
      roomUsers: room.roomUsers
    }
    allRooms.push(eachRoom)
  } 

  const message = JSON.stringify({
    type: "update_room",
    data: JSON.stringify(allRooms),
    id: 0
  });

  for (let [, player] of players) {
    if (player.ws.readyState === WebSocket.OPEN) {
      player.ws.send(message);
    }
  }
}

export function broadcastCreateGame(room: any, indexRoom: string) {
  const playerOneAccountId = room.roomUsers[0].index;
  const playerTwoAccountId = room.roomUsers[1].index;
  const playerOne = players.get(playerOneAccountId);
  const playerTwo = players.get(playerTwoAccountId);

  const gameId = generateId();
  const playerOneGameId = generateId();
  const playerTwoGameId = generateId();

  games.set(gameId, {
    idGame: gameId,
    players: {
      [playerOneAccountId]: {
        playerIndex: playerOneGameId,
        ships: [],
        board: null
      },
      [playerTwoAccountId]: {
        playerIndex: playerTwoGameId,
        ships: [],
        board: null
      }
    }
  });

  playerOne?.ws.send(JSON.stringify({
    type: "create_game",
    data: JSON.stringify({
      idGame: gameId,
      idPlayer: playerOneGameId
    }),
    id: 0
  }));

  playerTwo?.ws.send(JSON.stringify({
    type: "create_game",
    data: JSON.stringify({
      IdGame: gameId,
      idPlayer: playerTwoGameId
    }),
    id: 0
  }));

  rooms.delete(indexRoom);
}