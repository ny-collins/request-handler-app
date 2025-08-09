import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import jwt from 'jsonwebtoken';
import { env } from './config/environment';

interface AuthenticatedWebSocket extends WebSocket {
    userId?: number;
}

const clients = new Map<number, AuthenticatedWebSocket>();

export const createWebSocketServer = (server: Server) => {
    const wss = new WebSocketServer({ server });

    wss.on('connection', (ws: AuthenticatedWebSocket, req) => {
        const token = req.url?.split('token=')[1];

        if (token) {
            try {
                const decoded = jwt.verify(token, env.JWT_SECRET) as any;
                ws.userId = decoded.id;
                clients.set(decoded.id, ws);

                ws.on('close', () => {
                    clients.delete(decoded.id);
                });
            } catch (error) {
                ws.close();
            }
        }
    });
};

export const sendNotificationToClient = (userId: number, notification: any) => {
    const client = clients.get(userId);
    if (client && client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(notification));
    }
};
