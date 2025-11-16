import { handleRegistration } from './playerHandler.js';
import { handleCreateRoom } from './roomHandler.js';
import { handleAddUserToRoom } from './roomHandler.js';
import { handleAddShips } from './shipHandler.js';
import { handleAttack } from './gameHandler/attackHandler.js';
import { handleRandomAttack } from './gameHandler/randomAttackHandler.js';
import { handleSinglePlay } from './roomHandler.js';

export function routeMessage(ws: any, msg: any) {
  console.log(`Command received: ${msg.type}`);
  switch (msg.type) {
    case 'reg':
      handleRegistration(ws, msg.data);
      break;
    case "create_room":
      handleCreateRoom(ws);
      break;
    case "add_user_to_room":
      handleAddUserToRoom(ws, msg.data);
      break;
    case "add_ships":
      handleAddShips(msg.data);
      break;
    case "attack":
      handleAttack(msg.data);
      break;
    case "randomAttack":
      handleRandomAttack(msg.data);
      break;
    case "single_play":
      handleSinglePlay(ws);
      break;
    default:
      console.log("Unknown message type:", msg.type);
  }
}