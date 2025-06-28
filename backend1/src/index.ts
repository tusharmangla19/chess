import { WebSocketServer } from 'ws';
import { createGameState, addUser, removeUser, setupMessageHandler } from './game-manager';

const wss = new WebSocketServer({ port: 8081 });
const state = createGameState();

wss.on('connection', (ws) => {
    addUser(state, ws);
    
    setupMessageHandler(state, ws);
    
    ws.on('close', () => {
        removeUser(state, ws);
    });
});

console.log('✅ WebSocket server started on port 8081'); 