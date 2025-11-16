import { canPlaceShip } from '../botHandlers/botHandler.js';
import type { Ship } from '../models/state.js';

export function generateRandomShips(): Ship[] {
  const ships: Ship[] = [];
  const shipTypes: Array<{ type: "small" | "medium" | "large" | "huge", length: number, count: number }> = [
    { type: "huge", length: 4, count: 1 },
    { type: "large", length: 3, count: 2 },
    { type: "medium", length: 2, count: 3 },
    { type: "small", length: 1, count: 4 }
  ];

  const board: boolean[][] = Array(10).fill(null).map(() => Array(10).fill(false));

  for (let shipType of shipTypes) {
    for (let i = 0; i < shipType.count; i++) {
      let placed = false;
      let attempts = 0;

      while (!placed && attempts < 100) {
        attempts++;
        
        const direction = Math.random() < 0.5;
        const x = Math.floor(Math.random() * 10);
        const y = Math.floor(Math.random() * 10);

        if (canPlaceShip(board, x, y, shipType.length, direction)) {
          ships.push({
            position: { x, y },
            direction,
            length: shipType.length,
            type: shipType.type
          });

          if (direction) {
            for (let dy = 0; dy < shipType.length; dy++) {
              board[x][y + dy] = true;
            }
          } else {
            for (let dx = 0; dx < shipType.length; dx++) {
              board[x + dx][y] = true;
            }
          }

          placed = true;
        }
      }

      if (!placed) {
        console.error("Failed to place ship:", shipType.type);
      }
    }
  }

  return ships;
}