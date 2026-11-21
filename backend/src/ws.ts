import { Server as WebSocketServer, WebSocket } from 'ws';

/**
 * Real-time hub for chat and WebRTC call signaling.
 *
 * URL: ws://host:PORT/ws/chat?user=<email>[&name=<display name>]
 *
 * Client -> server message types:
 *   { type: 'chat-message', to, content }       -> persisted, then delivered
 *   { type: 'call-invite', to }                 -> relayed to recipient as 'call-invite'
 *   { type: 'call-answer', to, accepted }       -> relayed
 *   { type: 'signal', to, data }                -> WebRTC SDP/ICE relay
 *   { type: 'call-end', to }                    -> relayed
 *
 * All relay messages carry `from` (the sender's email) and `fromName`.
 */

export interface ChatSocket extends WebSocket {
  userEmail?: string;
  userName?: string;
}

const userSockets = new Map<string, Set<ChatSocket>>();

const conversationKey = (a: string, b: string) => [a, b].sort().join('|');

const sendJson = (ws: WebSocket, payload: unknown) => {
  if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(payload));
};

const relay = (target?: ChatSocket, payload?: unknown) => {
  if (target) sendJson(target, payload);
};

export const isOnline = (email: string) => userSockets.has(email);

// Push an arbitrary payload to every open socket of the given emails
export const broadcastToEmails = (emails: string[], payload: unknown) => {
  for (const email of emails) {
    for (const s of userSockets.get(email) ?? []) sendJson(s, payload);
  }
};

export const handleMessage = async (ws: ChatSocket, raw: string) => {
  let msg: any;
  try {
    msg = JSON.parse(raw);
  } catch {
    return;
  }

  const from = ws.userEmail!;
  const fromName = ws.userName;
  const { to } = msg;

  switch (msg.type) {
    case 'chat-message': {
      const { content, offerAmount } = msg;
      if (!to || (!content && offerAmount == null)) return;
      const poolModule = await import('./config/db');
      const pool = poolModule.default;
      const offer = Number(offerAmount) > 0 ? Number(offerAmount) : null;
      const result = await pool.query(
        `INSERT INTO chat_messages (conversation_key, sender_email, sender_name, recipient_email, content, offer_amount, offer_status)
         VALUES ($1, $2, $3, $4, $5, $6, CASE WHEN $6::numeric IS NOT NULL THEN 'proposed' ELSE NULL END)
         RETURNING id, created_at`,
        [conversationKey(from, to), from, fromName ?? null, to, String(content ?? '').slice(0, 4000), offer]
      );
      const row = result.rows[0];
      const message = {
        id: row.id,
        from,
        fromName: fromName ?? null,
        to,
        content: String(content ?? '').slice(0, 4000),
        offerAmount: offer,
        offerStatus: offer != null ? 'proposed' : null,
        created_at: row.created_at,
      };
      // deliver to recipient and echo to sender (multi-tab support)
      for (const s of userSockets.get(to) ?? []) sendJson(s, { type: 'chat-message', message });
      for (const s of userSockets.get(from) ?? []) sendJson(s, { type: 'chat-message', message, self: true });
      break;
    }

    case 'call-invite':
    case 'call-answer':
    case 'call-end':
      for (const s of userSockets.get(to) ?? []) {
        sendJson(s, { type: msg.type, from, fromName: fromName ?? null, accepted: msg.accepted });
      }
      break;

    case 'signal':
      // WebRTC SDP/ICE payloads are binary-unsafe size-wise but text-JSON is fine
      for (const s of userSockets.get(to) ?? []) {
        sendJson(s, { type: 'signal', from, data: msg.data });
      }
      break;

    default:
      break;
  }
};

export const setupChatServer = (httpServer: any) => {
  const wss = new WebSocketServer({ server: httpServer, path: '/ws/chat' });

  wss.on('connection', (socket: ChatSocket, req: any) => {
    try {
      const url = new URL(req.url, 'http://localhost');
      const email = url.searchParams.get('user');
      if (!email) {
        socket.close();
        return;
      }
      socket.userEmail = email;
      socket.userName = url.searchParams.get('name') || undefined;

      if (!userSockets.has(email)) userSockets.set(email, new Set());
      userSockets.get(email)!.add(socket);

      // tell everyone I'm online (simple broadcast presence)
      const online: string[] = [];
      userSockets.forEach((_v, k) => online.push(k));
      for (const set of userSockets.values()) {
        for (const s of set) sendJson(s, { type: 'presence', online });
      }

      socket.on('message', (data: any) => handleMessage(socket, String(data)));

      socket.on('close', () => {
        const set = userSockets.get(email);
        if (!set) return;
        set.delete(socket);
        if (set.size === 0) userSockets.delete(email);
        const online: string[] = [];
        userSockets.forEach((_v, k) => online.push(k));
        for (const s of set) sendJson(s, { type: 'presence', online });
      });
    } catch (err) {
      socket.close();
    }
  });

  console.log('💬 WebSocket chat server ready at /ws/chat');
};

export { userSockets };
