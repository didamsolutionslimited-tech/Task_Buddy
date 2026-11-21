// Floating instant-messaging widget (bottom-right) with voice calling.
// Talks to the backend WebSocket at ws://localhost:5000/ws/chat.
import React, { useEffect, useRef, useState, useCallback } from 'react';
import CallDialog from './CallDialog.tsx';

const WS_URL = 'ws://localhost:5000/ws/chat';

const MY_NAME_KEY = 'tb_chat_name';
const MY_EMAIL_KEY = 'tb_chat_email';

interface ChatMsg {
  id?: number;
  from: string;
  fromName?: string | null;
  to: string;
  content?: string;
  offerAmount?: number | null;
  offerStatus?: string | null;
  created_at?: string;
}

export default function ChatWidget({ dark }: { dark?: boolean }) {
  const [open, setOpen] = useState(false);
  const [me, setMe] = useState<string | null>(() => {
    try { return localStorage.getItem(MY_EMAIL_KEY); } catch { return null; }
  });
  const [name, setName] = useState<string>(() => {
    try { return localStorage.getItem(MY_NAME_KEY) || ''; } catch { return ''; }
  });
  const [joinEmail, setJoinEmail] = useState('');
  const [peer, setPeer] = useState<string>('');
  const [peerInput, setPeerInput] = useState('');
  const [peerName, setPeerName] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState('');
  const [online, setOnline] = useState<string[]>([]);
  const [connected, setConnected] = useState(false);
  const [call, setCall] = useState<{ peer: string; outgoing: boolean } | null>(null);
  const [incoming, setIncoming] = useState<{ from: string; fromName?: string | null } | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);

  const connect = useCallback((email: string, displayName: string) => {
    if (socketRef.current) socketRef.current.close();
    const ws = new WebSocket(`${WS_URL}?user=${encodeURIComponent(email)}&name=${encodeURIComponent(displayName)}`);
    socketRef.current = ws;

    ws.onopen = () => setConnected(true);
    ws.onclose = () => setConnected(false);
    ws.onerror = () => setConnected(false);

    ws.onmessage = (ev) => {
      let msg: any;
      try { msg = JSON.parse(String(ev.data)); } catch { return; }

      if (msg.type === 'chat-message') {
        const m: ChatMsg = msg.message;
        setMessages((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m]));
      } else if (msg.type === 'update-message') {
        const m: ChatMsg = msg.message;
        setMessages((prev) => prev.map((x) => (x.id !== undefined && m.id !== undefined && x.id === m.id ? { ...x, ...m } : x)));
      } else if (msg.type === 'presence') {
        setOnline(msg.online || []);
      } else if (msg.type === 'call-invite') {
        setIncoming({ from: msg.from, fromName: msg.fromName });
      } else if (msg.type === 'call-answer' && !msg.accepted) {
        setCall(null);
      }
    };
  }, [peer]);

  // (re)connect when identity becomes known
  useEffect(() => {
    if (me && open && (!socketRef.current || socketRef.current.readyState > WebSocket.OPEN)) {
      connect(me, name);
      setPeerInput(me === peer ? '' : peer);
    }
  }, [me, open]);

  const startChat = () => {
    if (!joinEmail.trim()) return;
    if (!name.trim()) { alert('Please enter your name first'); return; }
    try {
      localStorage.setItem(MY_EMAIL_KEY, joinEmail.trim());
      localStorage.setItem(MY_NAME_KEY, name.trim());
    } catch {}
    setMe(joinEmail.trim());
    setName(name.trim());
  };

  const openPeerChat = async () => {
    const next = peerInput.trim();
    if (!next || !me) return;
    setPeer('');
    setMessages([]);
    try {
      const res = await fetch(`http://localhost:5000/api/chat?me=${encodeURIComponent(me)}&other=${encodeURIComponent(next)}`);
      const data = await res.json();
      if (Array.isArray(data.messages)) setMessages(data.messages);
    } catch {}
    setPeerName(next);
    setPeer(next);
    setPeerInput('');
  };

  useEffect(() => {
    if (peer && me) {
      (async () => {
        try {
          const res = await fetch(`http://localhost:5000/api/chat?me=${encodeURIComponent(me)}&other=${encodeURIComponent(peer)}`);
          const data = await res.json();
          if (Array.isArray(data.messages)) setMessages(data.messages);
        } catch {}
      })();
    }
  }, [peer, me]);

  // connect socket when identity set, keep it alive while open
  useEffect(() => {
    if (me && open) connect(me, name);
  }, [me, open, connect]);

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages]);

  const send = () => {
    const ws = socketRef.current;
    if (!me || !peer || !input.trim() || !ws || ws.readyState !== WebSocket.OPEN) return;
    ws.send(JSON.stringify({ type: 'chat-message', to: peer, content: input.trim() }));
    setInput('');
  };

  const [offerInput, setOfferInput] = useState('');
  const sendOffer = () => {
    const ws = socketRef.current;
    const amount = parseFloat(offerInput.replace(/[^0-9.]/g, ''));
    if (!me || !peer || !Number.isFinite(amount) || amount <= 0 || !ws || ws.readyState !== WebSocket.OPEN) return;
    ws.send(JSON.stringify({ type: 'chat-message', to: peer, offerAmount: amount }));
    setOfferInput('');
  };

  const decideOffer = async (m: ChatMsg, action: 'accept' | 'decline') => {
    if (!m.id || !me) return;
    const res = await fetch(`http://localhost:5000/api/chat/${m.id}/offer`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, me }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert(data.error || 'Could not update the offer');
    }
  };

  const acceptIncoming = () => {
    if (incoming) {
      setCall({ peer: incoming.from, outgoing: false });
      setIncoming(null);
    }
  };

  return (
    <>
      {/* FAB */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-6 right-6 z-[90] w-14 h-14 rounded-full bg-gradient-to-br from-buddy-cyan to-buddy-blue text-white text-2xl shadow-xl hover:scale-105 transition"
        title="Messages"
      >
        💬
      </button>

      {open && (
        <div className="fixed bottom-24 right-6 z-[95] w-96 max-w-[92vw] bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden flex flex-col" style={{ height: 520 }}>
          <div className="px-5 py-4 bg-gradient-to-r from-buddy-cyan to-buddy-blue text-white flex items-center justify-between">
            <div>
              <p className="font-extrabold">Messages</p>
              <p className="text-xs opacity-80">{connected ? (me ? me : '') : 'connecting to chat server…'}</p>
            </div>
            <button onClick={() => setOpen(false)} className="text-white/80 hover:text-white text-xl">✕</button>
          </div>

          {!me ? (
            <div className="p-5 flex-1 flex flex-col gap-3">
              <p className="text-sm text-gray-500 dark:text-gray-400">Enter your name and email to join chat.</p>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name"
                className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm" />
              <input value={joinEmail} onChange={(e) => setJoinEmail(e.target.value)} placeholder="you@example.com" type="email"
                className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm" />
              <button onClick={startChat} className="bg-buddy-orange hover:bg-orange-600 text-white py-2.5 rounded-xl font-bold text-sm transition">
                Join chat
              </button>
            </div>
          ) : (
            <>
              <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-800 flex items-center gap-2">
                <input
                  value={peerInput}
                  onChange={(e) => setPeerInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && openPeerChat()}
                  placeholder="Chat with… (tasker/client email)"
                  className="flex-1 px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                />
                <button onClick={openPeerChat} className="px-3 py-2 rounded-xl bg-buddy-blue hover:bg-blue-700 text-white text-sm font-bold transition">Go</button>
              </div>

              <div ref={listRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-2 bg-gray-50 dark:bg-gray-950">
                {messages.map((m, i) => {
                  const mine = m.from === me;
                  if (m.offerAmount != null) {
                    const status = (m as any).offerStatus;
                    const decided = status === 'accepted' || status === 'declined';
                    return (
                      <div key={m.id ?? i} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] px-3.5 py-2.5 rounded-2xl border text-sm ${mine ? 'bg-buddy-blue/10 border-buddy-blue/30 text-gray-900 dark:text-white' : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 text-gray-900 dark:text-white shadow'}`}>
                          <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wide">Price offer</p>
                          <p className={`text-xl font-extrabold ${status === 'accepted' ? 'text-green-500' : status === 'declined' ? 'text-red-500' : 'text-buddy-dark dark:text-white'}`}>
                            ₦{Number(m.offerAmount).toLocaleString()} {status ? status.toUpperCase() : ''}
                          </p>
                          {!mine && status === 'proposed' && (
                            <div className="flex gap-2 mt-2">
                              <button onClick={() => decideOffer(m, 'accept')} className="px-3 py-1.5 rounded-full bg-green-500 hover:bg-green-600 text-white text-xs font-bold">Accept</button>
                              <button onClick={() => decideOffer(m, 'decline')} className="px-3 py-1.5 rounded-full bg-red-500 hover:bg-red-600 text-white text-xs font-bold">Decline</button>
                            </div>
                          )}
                          {mine && !decided && <p className="text-[11px] text-gray-400 mt-1">Waiting for response…</p>}
                        </div>
                      </div>
                    );
                  }
                  return (
                    <div key={m.id ?? i} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] px-3.5 py-2 rounded-2xl text-sm ${mine ? 'bg-buddy-blue text-white rounded-br-md' : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-bl-md shadow'}`}>
                        {m.content}
                      </div>
                    </div>
                  );
                })}
                {messages.length === 0 && (
                  <p className="text-center text-xs text-gray-400 dark:text-gray-500 pt-10">
                    No messages yet. Type an email above, hit Go, then start chatting in real time.
                    {peer && online.includes(peer) && <span className="block mt-1 text-green-500 font-bold">🟢 {peer} is online</span>}
                  </p>
                )}
              </div>

              {peer && (
                <div className="px-4 py-2 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                  <span>{peer}</span>
                  <button
                    onClick={() => setCall({ peer, outgoing: true })}
                    className="px-3 py-1.5 rounded-full bg-green-500 hover:bg-green-600 text-white font-bold transition"
                  >
                    📞 Voice call
                  </button>
                </div>
              )}

              <div className="p-3 border-t border-gray-100 dark:border-gray-800 flex gap-2">
                <input
                  value={offerInput}
                  onChange={(e) => setOfferInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && sendOffer()}
                  disabled={!peer}
                  placeholder={peer ? '₦ price offer…' : 'Choose who to chat with first'}
                  className="w-32 px-3 py-2.5 rounded-xl border border-amber-300 bg-amber-50 dark:bg-gray-800 dark:border-gray-700 text-gray-900 dark:text-white text-sm disabled:opacity-50"
                />
                <button onClick={sendOffer} disabled={!peer}
                  className="px-3 py-2.5 rounded-xl bg-buddy-amber hover:bg-amber-500 text-white text-sm font-bold disabled:opacity-50 transition">₦</button>
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && send()}
                  disabled={!peer}
                  placeholder={peer ? 'Type a message…' : 'Choose who to chat with first'}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm disabled:opacity-50"
                />
                <button onClick={send} disabled={!peer}
                  className="px-4 py-2.5 rounded-xl bg-buddy-orange hover:bg-orange-600 text-white text-sm font-bold disabled:opacity-50 transition">
                  Send
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {incoming && !call && (
        <div className="fixed bottom-24 right-6 z-[96] w-80 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 p-5 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">Incoming call request</p>
          <p className="text-lg font-extrabold text-buddy-dark dark:text-white truncate">{incoming.fromName || incoming.from}</p>
          <div className="flex gap-3 justify-center mt-4">
            <button onClick={() => setIncoming(null)} className="px-4 py-2 rounded-full bg-red-500 hover:bg-red-600 text-white text-sm font-bold">Decline</button>
            <button onClick={acceptIncoming} className="px-4 py-2 rounded-full bg-green-500 hover:bg-green-600 text-white text-sm font-bold">Accept</button>
          </div>
        </div>
      )}

      {call && (
        <CallDialog
          socket={socketRef.current}
          me={me || ''}
          peer={call.peer}
          peerName={peerName}
          outgoing={call.outgoing}
          onClosed={() => setCall(null)}
        />
      )}
    </>
  );
}
