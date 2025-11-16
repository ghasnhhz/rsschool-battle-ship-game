import { players } from "../models/state.js";
import { generateId } from "../utils/generateId.js";
import { broadcastRooms } from "./roomHandler.js";
import { broadcastWinners } from "./winnerHandler.js";
import { WebSocket } from 'ws';

export function handleRegistration(ws: WebSocket, data: any) {
  let parsedData = data;
  if (typeof data === "string") {
    try {
      parsedData = JSON.parse(data);
    } catch (err) {
      console.error("Failed to parse registration data:", data);
      ws.send(JSON.stringify({
        type: "reg",
        data: JSON.stringify({
          name: "",
          index: "",
          error: true,
          errorText: "Invalid data format",
        }),
        id: 0
      }));
      return;
    }
  }

  const { name, password } = parsedData;

  if (!name || !password) {
    ws.send(JSON.stringify({
      type: "reg",
      data: JSON.stringify({
        name: name || "",
        index: "",
        error: true,
        errorText: "Name and password required",
      }),
      id: 0
    }));
    return;
  }

  let existingPlayer = null;
  let existingPlayerId = "";
  
  for (let [id, player] of players.entries()) {
    if (player.name === name) {
      existingPlayer = player;
      existingPlayerId = id;
      break;
    }
  }

  if (existingPlayer) {
    if (existingPlayer.password !== password) {
      ws.send(JSON.stringify({
        type: "reg",
        data: JSON.stringify({
          name,
          index: "",
          error: true,
          errorText: "Invalid password",
        }),
        id: 0
      }));
      return;
    }
    
    players.set(existingPlayerId, {
      ...existingPlayer,
      ws
    });

    console.log(`Result: Player "${name}" logged in successfully`);

    ws.send(JSON.stringify({
      type: "reg",
      data: JSON.stringify({
        name,
        index: existingPlayerId,
        error: false,
        errorText: "",
      }),
      id: 0
    }));
  } else {
    const index = generateId();
    
    players.set(index, {
      name,
      password,
      wins: 0,
      ws,
    });

    console.log(`Result: New player "${name}" registered with ID: ${index}`);

    ws.send(JSON.stringify({
      type: "reg",
      data: JSON.stringify({
        name,
        index,
        error: false,
        errorText: "",
      }),
      id: 0
    }));
  }

  broadcastRooms();
  broadcastWinners();
}