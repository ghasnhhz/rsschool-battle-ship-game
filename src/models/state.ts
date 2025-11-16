import { WebSocket } from 'ws';

export interface Player {
  name: string;
  password: string;
  wins: number;
  ws: WebSocket;
}

export interface Room {
  roomUsers: {
    name: string,
    index: number | string,
  }[]; 
}

export interface Game {
  idGame: string
  players: {
    [playerId: string]: {
      playerIndex: string,
      ships: Ship[],
      board: any
    }
  },
  currentTurn?: string
}

export interface Ship {
  position: {
    x: number,
    y: number,
  },
  direction: boolean,
  length: number,
  type: "small" | "medium" | "large" | "huge";
  hits?: { x: number; y: number }[];
}

export const players = new Map<string, Player>();
export const rooms = new Map<string, Room>();
export const games = new Map<string, Game>();