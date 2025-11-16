import { generateId } from '../utils/generateId.js';
import { games, players } from '../models/state.js';
import { processAttack } from '../handlers/gameHandler/gameHandler.js';
import { generateRandomShips } from '../utils/generateShips.js';

const botIntervals = new Map<string, NodeJS.Timeout>();

export function createBotGame(playerAccountId: string) {
  const gameId = generateId();
  const player = players.get(playerAccountId);
  
  if (!player) {
    console.error("Player not found");
    return;
  }

  const botAccountId = "bot-" + generateId();
  const playerGameId = generateId();
  const botGameId = generateId();

  const botShips = generateRandomShips();

  games.set(gameId, {
    idGame: gameId,
    players: {
      [playerAccountId]: {
        playerIndex: playerGameId,
        ships: [],
        board: null
      },
      [botAccountId]: {
        playerIndex: botGameId,
        ships: botShips,
        board: null
      }
    }
  });

  console.log(`Bot game ${gameId} created`);

  if (player.ws.readyState === 1) {
    player.ws.send(JSON.stringify({
      type: "create_game",
      data: JSON.stringify({
        idGame: gameId,
        idPlayer: playerGameId
      }),
      id: 0
    }));
    console.log(`Result: Sent create_game to ${player.name} for bot match`);
  }

  startBotAI(gameId, botGameId);

  return gameId;
}

export function canPlaceShip(board: boolean[][], x: number, y: number, length: number, direction: boolean): boolean {
  if (direction) {
    if (y + length > 10) return false;
    for (let dy = 0; dy < length; dy++) {
      if (board[x][y + dy]) return false;
      for (let dx = -1; dx <= 1; dx++) {
        for (let dy2 = -1; dy2 <= 1; dy2++) {
          const nx = x + dx;
          const ny = y + dy + dy2;
          if (nx >= 0 && nx < 10 && ny >= 0 && ny < 10) {
            if (board[nx][ny]) return false;
          }
        }
      }
    }
  } else {
    if (x + length > 10) return false;
    for (let dx = 0; dx < length; dx++) {
      if (board[x + dx][y]) return false;
      for (let dx2 = -1; dx2 <= 1; dx2++) {
        for (let dy = -1; dy <= 1; dy++) {
          const nx = x + dx + dx2;
          const ny = y + dy;
          if (nx >= 0 && nx < 10 && ny >= 0 && ny < 10) {
            if (board[nx][ny]) return false;
          }
        }
      }
    }
  }
  return true;
}

function startBotAI(gameId: string, botPlayerIndex: string) {
  const attackedCells = new Set<string>();

  const botInterval = setInterval(() => {
    const game = games.get(gameId);
    
    if (!game) {
      clearInterval(botInterval);
      botIntervals.delete(gameId);
      return;
    }

    if (game.currentTurn === botPlayerIndex) {
      let x, y;
      let attempts = 0;

      do {
        x = Math.floor(Math.random() * 10);
        y = Math.floor(Math.random() * 10);
        attempts++;
      } while (attackedCells.has(`${x},${y}`) && attempts < 100);

      if (attempts >= 100) {
        console.log("Bot couldn't find valid cell");
        clearInterval(botInterval);
        botIntervals.delete(gameId);
        return;
      }

      attackedCells.add(`${x},${y}`);
      console.log(`Bot attacking at (${x}, ${y})`);

      setTimeout(() => {
        processAttack(gameId, x, y, botPlayerIndex);
      }, 1000);
    }
  }, 1500);

  botIntervals.set(gameId, botInterval);
}

export function stopBotAI(gameId: string) {
  const interval = botIntervals.get(gameId);
  if (interval) {
    clearInterval(interval);
    botIntervals.delete(gameId);
    console.log(`Bot AI stopped for game ${gameId}`);
  }
}