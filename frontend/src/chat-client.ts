// Real-time chat client for the app: WebSocket + REST history.
import { WS_URL, API_BASE } from './api/config';

export interface ChatMsg {
  id?: number;
  from: string;
  fromName?: string | null;
  to: string;
  content?: string;
  offerAmount?: number | null;
  offerStatus?: string | null;
  created_at?: string;
}

export interface ChatEvents {
  onMessage: (m: ChatMsg) => void;
  onUpdateMessage?: (m: ChatMsg) => void;
  onCallAnswer?: (from: string, accepted: boolean) => void;
  onPresence: (online: string[]) => void;
  onCallInvite: (from: string, fromName?: string | null) => void;
  onCallEnd: (from: string) => void;
  onSignal?: (from: string, data: any) => void;
}

export class ChatClient {
  ws: WebSocket | null = null;
  myEmail: string;
  events: ChatEvents;
  private signalHandlers = new Map<string, (data: any) => void>();

  constructor(myEmail: string, myName: string, events: ChatEvents) {
    this.myEmail = myEmail;
    this.events = events;
    this.connect();
  }

  // a WebRTC call overlay registers per-peer signal handling here
  setSignalHandler = (peer: string, fn: (data: any) => void) => {
    this.signalHandlers.set(peer, fn);
    return () => { this.signalHandlers.delete(peer); };
  };

  private dispatchSignal = (from: string, data: any) => {
    const handler = this.signalHandlers.get(from);
    if (handler) handler(data);
    this.events.onSignal?.(from, data);
  };

  private connect() {
    try {
      this.ws = new WebSocket(`${WS_URL}?user=${encodeURIComponent(this.myEmail)}&name=${encodeURIComponent('')}`);
    } catch (err) {
      return;
    }
    this.ws.onmessage = (ev) => {
      let msg: any;
      try { msg = JSON.parse(String(ev.data)); } catch { return; }
      if (msg.type === 'chat-message') {
        this.events.onMessage(msg.message as ChatMsg);
      } else if (msg.type === 'update-message') {
        this.events.onUpdateMessage?.(msg.message as ChatMsg);
      } else if (msg.type === 'presence') {
        this.events.onPresence(msg.online || []);
      } else if (msg.type === 'call-invite') {
        this.events.onCallInvite?.(msg.from, msg.fromName);
      } else if (msg.type === 'call-answer') {
        this.events.onCallAnswer?.(msg.from, !!msg.accepted);
      } else if (msg.type === 'call-end') {
        this.events.onCallEnd?.(msg.from);
      } else if (msg.type === 'signal') {
        this.dispatchSignal(msg.from, msg.data);
      }
    };
  }

  send = (to: string, content: string) => this.raw({ type: 'chat-message', to, content });
  sendOffer = (to: string, amount: number) => this.raw({ type: 'chat-message', to, offerAmount: amount });
  callInvite = (to: string) => this.raw({ type: 'call-invite', to });
  callAnswer = (to: string, accepted: boolean) => this.raw({ type: 'call-answer', to, accepted });
  callEnd = (to: string) => this.raw({ type: 'call-end', to });
  signal = (to: string, data: any) => this.raw({ type: 'signal', to, data });

  isOpen = () => !!this.ws && this.ws.readyState === WebSocket.OPEN;
  close = () => this.ws?.close();

  private raw(payload: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(payload));
    }
  }
}

export const fetchHistory = async (me: string, other: string): Promise<ChatMsg[]> => {
  const res = await fetch(`${API_BASE}/chat?me=${encodeURIComponent(me)}&other=${encodeURIComponent(other)}`);
  const data = await res.json();
  return Array.isArray(data.messages) ? data.messages : [];
};
