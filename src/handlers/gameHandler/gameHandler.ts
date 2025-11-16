import { WebSocket } from 'ws';
import { games, players } from '../../models/state.js';
import { broadcastWinners } from '../winnerHandler.js';
import type { Ship } from '../../models/state.js';

export function processAttack(gameId: string, x: number, y: number, attackerIndex: string) {
  const game = games.get(gameId);
  if (!game) {
    console.error(`Game ${gameId} not found`);
    return;
  }

  if (game.currentTurn !== attackerIndex) {
    console.error(`Not player ${attackerIndex}'s turn`);
    return;
  }

  let defenderAccountId = "";
  let defenderIndex = "";
  
  for (let [accountId, playerData] of Object.entries(game.players)) {
    if (playerData.playerIndex !== attackerIndex) {
      defenderAccountId = accountId;
      defenderIndex = playerData.playerIndex;
      break;
    }
  }

  if (!defenderAccountId) {
    console.error("Defender not found");
    return;
  }

  const defenderShips = game.players[defenderAccountId].ships || [];

  let status: "miss" | "shot" | "killed" = "miss";
  let hitShip: Ship | null = null;

  for (let i = 0; i < defenderShips.length; i++) {
    const ship = defenderShips[i];
    if (isHit(ship, x, y)) {
      hitShip = ship;
      
      if (!ship.hits) {
        (ship as any).hits = [];
      }
      (ship as any).hits.push({ x, y });


  
      if ((ship as any).hits.length >= ship.length) {
        status = "killed";
      } else {
        status = "shot";
      }
      break;
    }
  }
  console.log(`Result: Attack at (x:${x},y:${y}) - ${status}`);
  sendAttackFeedback(gameId, x, y, attackerIndex, status);

  if (status === "killed" && hitShip) {
    sendSurroundingMisses(gameId, hitShip, attackerIndex);
  }

  const allShipsKilled = defenderShips.every(ship => 
    (ship as any).hits && (ship as any).hits.length >= ship.length
  );

  if (allShipsKilled) {
    finishGame(gameId, attackerIndex);
    return;
  }

  if (status === "miss") {
    game.currentTurn = defenderIndex;
  }

  sendTurn(gameId, game.currentTurn);
}

function isHit(ship: Ship, x: number, y: number): boolean {
  const { position, direction, length } = ship;

  if (direction) {
    return x === position.x && y >= position.y && y < position.y + length;
  } else {
    return y === position.y && x >= position.x && x < position.x + length;
  }
}

function sendAttackFeedback(gameId: string, x: number, y: number, currentPlayer: string, status: string) {
  const game = games.get(gameId);
  if (!game) return;

  const message = JSON.stringify({
    type: "attack",
    data: JSON.stringify({
      position: { x, y },
      currentPlayer: currentPlayer,
      status: status
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

function sendSurroundingMisses(gameId: string, ship: Ship, currentPlayer: string) {
  const surroundingCells = getSurroundingCells(ship);
  
  for (let cell of surroundingCells) {
    sendAttackFeedback(gameId, cell.x, cell.y, currentPlayer, "miss");
  }
}

function getSurroundingCells(ship: Ship): { x: number, y: number }[] {
  const cells: { x: number, y: number }[] = [];
  const { position, direction, length } = ship;

  let minX, maxX, minY, maxY;

  if (direction) {
    minX = position.x - 1;
    maxX = position.x + 1;
    minY = position.y - 1;
    maxY = position.y + length;
  } else {
    minX = position.x - 1;
    maxX = position.x + length;
    minY = position.y - 1;
    maxY = position.y + 1;
  }

  for (let x = minX; x <= maxX; x++) {
    for (let y = minY; y <= maxY; y++) {
      if (x >= 0 && x < 10 && y >= 0 && y < 10) {
        if (direction) {
          if (!(x === position.x && y >= position.y && y < position.y + length)) {
            cells.push({ x, y });
          }
        } else {
          if (!(y === position.y && x >= position.x && x < position.x + length)) {
            cells.push({ x, y });
          }
        }
      }
    }
  }

  return cells;
}

export function sendTurn(gameId: string, currentPlayerIndex: string) {
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

function finishGame(gameId: string, winnerIndex: string) {
  const game = games.get(gameId);
  if (!game) return;

  console.log(`Game ${gameId} finished! Winner: ${winnerIndex}`);

  for (let [accountId, playerData] of Object.entries(game.players)) {
    if (playerData.playerIndex === winnerIndex) {
      const player = players.get(accountId);
      if (player) {
        player.wins++;
        console.log(`${player.name} now has ${player.wins} wins`);
      }
      break;
    }
  }

  const message = JSON.stringify({
    type: "finish",
    data: JSON.stringify({
      winPlayer: winnerIndex
    }),
    id: 0
  });

  for (let [accountId] of Object.entries(game.players)) {
    const player = players.get(accountId);
    if (player && player.ws.readyState === WebSocket.OPEN) {
      player.ws.send(message);
    }
  }

  broadcastWinners();

  games.delete(gameId);
}