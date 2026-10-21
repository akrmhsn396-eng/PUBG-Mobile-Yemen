import express from 'express';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);
const port = process.env.PORT || 3000;

export interface ChatMessage {
  id: string;
  sender: string;
  text: string;
  time: number;
  badge?: string;
  color?: string;
  isQuickRadio?: boolean;
}

// In-memory persistent server message history during the session
const messageHistory: ChatMessage[] = [
  {
    id: 'system-hq-1',
    sender: 'القيادة العسكرية [HQ]',
    text: 'مرحباً بجميع المقاتلين في ساحة معركة اليمن! قناة الاتصال اللاسلكية العالمية نشطة الآن.',
    time: Date.now() - 60000,
    badge: 'HQ',
    color: '#00f0ff',
  },
  {
    id: 'system-hq-2',
    sender: 'برج المراقبة [Sanaa]',
    text: 'رادار التحذير المبكر يرصد تحركات العدو في القطاعات المجاورة. نسّقوا الهجوم!',
    time: Date.now() - 35000,
    badge: 'RECON',
    color: '#38bdf8',
  },
];

// Attach WebSocketServer
const wss = new WebSocketServer({ server, path: '/ws/chat' });

let connectedUsers = 0;

function broadcast(data: object) {
  const payload = JSON.stringify(data);
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  });
}

wss.on('connection', (ws: WebSocket) => {
  connectedUsers++;

  // Send initial chat history & presence count
  ws.send(
    JSON.stringify({
      type: 'init',
      messages: messageHistory,
      userCount: connectedUsers,
    })
  );

  // Broadcast presence update
  broadcast({
    type: 'presence',
    userCount: connectedUsers,
  });

  ws.on('message', (rawData: string) => {
    try {
      const data = JSON.parse(rawData.toString());
      if (data.type === 'message') {
        const rawText = String(data.text || '').trim();
        if (!rawText) return;

        const text = rawText.slice(0, 200);
        const sender = String(data.sender || 'مقاتل يمني').trim().slice(0, 30);

        const newMsg: ChatMessage = {
          id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          sender,
          text,
          time: Date.now(),
          badge: data.badge || 'COMBAT',
          color: data.color || '#38bdf8',
          isQuickRadio: !!data.isQuickRadio,
        };

        messageHistory.push(newMsg);
        if (messageHistory.length > 80) {
          messageHistory.shift();
        }

        broadcast({
          type: 'message',
          message: newMsg,
        });
      }
    } catch (err) {
      console.error('Error parsing client WS message:', err);
    }
  });

  ws.on('close', () => {
    connectedUsers = Math.max(0, connectedUsers - 1);
    broadcast({
      type: 'presence',
      userCount: connectedUsers,
    });
  });

  ws.on('error', (err) => {
    console.error('WebSocket client error:', err);
  });
});

app.use(express.json());

// API route to get chat history if needed
app.get('/api/chat/history', (_req, res) => {
  res.json({ messages: messageHistory, userCount: connectedUsers });
});

async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  } else {
    // Dynamic import Vite in dev mode
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  server.listen(port, () => {
    console.log(`Battlefield Server running at http://localhost:${port} with WebSockets on /ws/chat`);
  });
}

startServer();
