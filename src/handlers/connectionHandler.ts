import { WebSocket } from 'ws';
import { routeMessage } from "./messageRouter.js";
import { handlePlayerDisconnect } from './disconnectionHandler.js';

export function handleConnection(ws: WebSocket) {
  ws.on("message", (raw: Buffer) => {
    try {
      const msg = JSON.parse(raw.toString());
      routeMessage(ws, msg);
    } catch (err) {
      console.log("Invalid JSON received:", raw.toString());
    }
  });

  ws.on("close", () => {
    handlePlayerDisconnect(ws);
  });

  ws.on("error", (err) => {
    console.error("WebSocket connection error:", err.message);
  })
}