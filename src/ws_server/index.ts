import 'dotenv/config';
import { WebSocketServer } from 'ws';
import { handleConnection } from '../handlers/connectionHandler.js';


let wss: WebSocketServer;

export function startWsServer() {
  wss = new WebSocketServer({ port: Number(process.env.WS_PORT) });
  
  wss.on('listening', () => {
    console.log('Protocol: ws');
    console.log('Host: localhost');
    console.log(`Port: ${Number(process.env.WS_PORT)}`);
    console.log(`WebSocket Server started on: ws://localhost:${Number(process.env.WS_PORT)}`);
  });
  
  wss.on('connection', (ws) => {
    console.log("New client connected");
    handleConnection(ws);
  });

  wss.on('error', (error) => {
    console.error('WebSocket server error:', error);
  });
}

process.on('SIGINT', () => {
  console.log('Shutting down WebSocket server...');
  
  if (wss) {
    wss.clients.forEach((client) => {
      client.close(1000, 'Server shutting down');
    });
    
    wss.close(() => {
      console.log('WebSocket server closed successfully');
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
});

process.on('SIGTERM', () => {
  console.log('Shutting down WebSocket server...');
  
  if (wss) {
    wss.clients.forEach((client) => {
      client.close(1000, 'Server shutting down');
    });
    
    wss.close(() => {
      console.log('WebSocket server closed successfully');
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
});