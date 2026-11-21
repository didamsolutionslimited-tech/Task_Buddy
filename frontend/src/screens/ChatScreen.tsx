// Real-time client ↔ tasker chat with price negotiation and voice calls.
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View, Text, TextInput as RNTextInput, StyleSheet, TouchableOpacity,
  FlatList, KeyboardAvoidingView, Platform, Image, Modal,
} from 'react-native';
import { ChatClient, ChatMsg, fetchHistory } from '../chat-client';
import { API_BASE } from '../api/config';
import { brand, headingFont, headingFontBold } from '../theme';
import { useTheme } from '../theme-context';

const MY_EMAIL_KEY = 'tb_chat_email';

export default function ChatScreen({ navigation, route }: any) {
  const initialMe = route?.params?.me || null;
  const initialPeer = route?.params?.peer || '';
  const { palette } = useTheme();

  const [me, setMe] = useState<string | null>(initialMe);
  const [nameInput, setNameInput] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [peer, setPeer] = useState(initialPeer);
  const [peerInput, setPeerInput] = useState('');
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState('');
  const [online, setOnline] = useState<string[]>([]);
  const [connected, setConnected] = useState(false);

  // voice call overlay state
  const [callState, setCallState] = useState<null | { peer: string; outgoing: boolean; inviteOnMount?: boolean }>(null);
  const [incoming, setIncoming] = useState<null | { from: string; fromName?: string | null }>(null);

  // offer state
  const [offerModal, setOfferModal] = useState(false);
  const [offerAmount, setOfferAmount] = useState('');

  const clientRef = useRef<ChatClient | null>(null);
  const listRef = useRef<any>(null);

  const handleIncomingCall = useCallback((from: string, fromName?: string | null) => {
    if (from !== peer) setPeer(from);
    setIncoming({ from, fromName });
  }, [peer]);

  useEffect(() => {
    if (!me) return;
    const client = new ChatClient(me, '', {
      onMessage: (m) => {
        setMessages((prev) => (prev.some((x) => x.id !== undefined && x.id === m.id) ? prev : [...prev, m]));
      },
      onUpdateMessage: (m) => {
        setMessages((prev) => prev.map((x) => (x.id !== undefined && m.id !== undefined && x.id === m.id ? { ...x, ...m } : x)));
      },
      onPresence: setOnline,
      onCallInvite: handleIncomingCall,
      onCallAnswer: (from, accepted) => {
        if (callState?.peer === from && callState.outgoing && !accepted) {
          setCallState(null);
        }
      },
      onCallEnd: (from) => {
        if (callState?.peer === from || incoming?.from === from) {
          setCallState(null);
          setIncoming(null);
        }
      },
      onSignal: () => {}, // per-peer handlers receive signals via setSignalHandler
    });
    clientRef.current = client;
    const wrapped = client.ws;
    if (wrapped) {
      wrapped.addEventListener?.('open', () => setConnected(true));
      wrapped.addEventListener?.('close', () => setConnected(false));
      wrapped.addEventListener?.('error', () => setConnected(false));
    }

    return () => client.close();
  }, [me]);

  useEffect(() => {
    if (me && peer) {
      fetchHistory(me, peer).then((m) => setMessages(m)).catch(() => {});
    }
  }, [me, peer]);

  useEffect(() => {
    listRef.current?.scrollToEnd?.({ animated: true });
  }, [messages.length]);

  const send = () => {
    if (!clientRef.current || !me || !peer || !input.trim()) return;
    clientRef.current.send(peer, input.trim());
    setInput('');
  };

  const sendOffer = () => {
    const amount = parseFloat(offerAmount.replace(/[^0-9.]/g, ''));
    if (!clientRef.current || !me || !peer || !Number.isFinite(amount) || amount <= 0) {
      alert('Enter a valid amount');
      return;
    }
    clientRef.current.sendOffer(peer, amount);
    setOfferModal(false);
    setOfferAmount('');
  };

  const decideOffer = async (m: ChatMsg, action: 'accept' | 'decline') => {
    if (!me || !clientRef.current || !m.id) return;
    const res = await fetch(`${API_BASE}/chat/${m.id}/offer`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, me }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert(data.error || 'Could not update the offer');
    }
  };

  const joinChat = () => {
    const email = emailInput.trim();
    if (!email || !nameInput.trim()) return;
    setMe(email);
  };

  const startCall = (outgoing: boolean) => {
    if (!peer) return;
    setIncoming(null);
    setCallState({ peer, outgoing, inviteOnMount: outgoing });
  };

  if (!me) {
    return (
      <KeyboardAvoidingView behavior={Platform.OS === 'web' ? undefined : 'padding'} style={[styles.container, { backgroundColor: palette.bg, justifyContent: 'center' }]}>
        <Text style={[styles.title2, { color: palette.ink }]}>Chat</Text>
        <Text style={[styles.sub2, { color: palette.sub }]}>Enter your name and email to join.</Text>
        <RNTextInput value={nameInput} onChangeText={setNameInput} placeholder="Your name" placeholderTextColor="#999" style={[styles.input, { backgroundColor: palette.card, color: palette.ink, borderColor: palette.border }]} />
        <RNTextInput value={emailInput} onChangeText={setEmailInput} placeholder="you@example.com" autoCapitalize="none" keyboardType="email-address" placeholderTextColor="#999" style={[styles.input, { backgroundColor: palette.card, color: palette.ink, borderColor: palette.border }]} />
        <TouchableOpacity onPress={joinChat} style={styles.ctaBtn}>
          <Text style={styles.ctaText}>Join</Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    );
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'web' ? undefined : 'padding'} style={[styles.container, { backgroundColor: palette.bg }]}>
      {/* peer picker + call row */}
      <View style={[styles.peerBar, { backgroundColor: palette.card, borderBottomColor: palette.border }]}>
        <RNTextInput
          value={peer ? peer : peerInput}
          editable={!peer}
          onChangeText={setPeerInput}
          onSubmitEditing={() => { if (peerInput.trim()) { setPeer(peerInput.trim()); setPeerInput(''); } }}
          placeholder="Tasker/client email (e.g. you@example.com)"
          placeholderTextColor="#999"
          style={[styles.peerInput, { color: palette.ink, borderColor: palette.border }]}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <TouchableOpacity onPress={() => (peer ? setPeer('') : null)} style={styles.clearBtn}>
          <Text style={{ color: palette.sub }}>✕</Text>
        </TouchableOpacity>
        <TouchableOpacity
          disabled={!peer}
          onPress={() => startCall(true)}
          style={[styles.callBtn, !peer && { opacity: 0.4 }]}
        >
          <Text style={styles.callBtnText}>📞</Text>
        </TouchableOpacity>
      </View>
      <Text style={[styles.connectionDot, { color: connected ? '#22C55E' : palette.sub }]}>
        {connected ? '● online — messages sync instantly' : '○ connecting to chat server…'}
      </Text>

      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(m, i) => String(m.id ?? `local-${i}`)}
        contentContainerStyle={styles.list}
        renderItem={({ item: m }) => {
          const mine = m.from === me;
          if (m.offerAmount != null && m.offerAmount != undefined) {
            const status: string | null = (m as any).offerStatus ?? null;
            const decided = status === 'accepted' || status === 'declined';
            return (
              <View style={[styles.offerBubble, { backgroundColor: palette.card, borderColor: palette.border, alignSelf: mine ? 'flex-end' : 'flex-start' }]}>
                <Text style={{ color: palette.sub, fontSize: 12, fontFamily: headingFontBold }}>PRICE OFFER</Text>
                <Text style={{ color: status === 'accepted' ? '#22C55E' : status === 'declined' ? '#E5484D' : brand.ink, fontFamily: headingFont, fontSize: 20 }}>
                  ₦{Number(m.offerAmount).toLocaleString()} {status ? status.toUpperCase() : ''}
                </Text>
                {!mine && status === 'proposed' && (
                  <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
                    <TouchableOpacity onPress={() => decideOffer(m, 'accept')} style={[styles.decideBtn, { backgroundColor: '#22C55E' }]}>
                      <Text style={styles.decideText}>Accept</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => decideOffer(m, 'decline')} style={[styles.decideBtn, { backgroundColor: '#E5484D' }]}>
                      <Text style={styles.decideText}>Decline</Text>
                    </TouchableOpacity>
                  </View>
                )}
                {mine && !decided && <Text style={{ color: palette.sub, fontSize: 12, marginTop: 4 }}>Waiting for response…</Text>}
              </View>
            );
          }
          return (
            <View style={[styles.bubble, mine ? styles.mine : styles.theirs, { backgroundColor: mine ? brand.blue : palette.card, borderColor: mine ? brand.blue : palette.border }]}>
              <Text style={[styles.bubbleText, { color: mine ? '#fff' : palette.ink }]}>{m.content}</Text>
            </View>
          );
        }}
        ListEmptyComponent={
          <Text style={[styles.emptyHint, { color: palette.sub }]}>
            {peer
              ? `No messages yet — say hello!\nTip: use “₦ Offer” to negotiate a price.`
              : 'Enter the other side’s email above to open a conversation.'}
          </Text>
        }
      />

      {/* composer */}
      <View style={[styles.composer, { backgroundColor: palette.card, borderTopColor: palette.border }]}>
        <TouchableOpacity disabled={!peer} onPress={() => setOfferModal(true)} style={[styles.offerBtn, !peer && { opacity: 0.4 }]}>
          <Text style={styles.offerBtnText}>₦ Offer</Text>
        </TouchableOpacity>
        <RNTextInput
          value={input}
          editable={!!peer}
          onChangeText={setInput}
          placeholder={peer ? 'Type a message…' : 'Choose who to chat with first'}
          placeholderTextColor="#999"
          style={[styles.composerInput, { backgroundColor: palette.bg, color: palette.ink, borderColor: palette.border }]}
          onSubmitEditing={send}
        />
        <TouchableOpacity onPress={send} disabled={!peer} style={[styles.sendBtn, !peer && { opacity: 0.4 }]}>
          <Text style={[styles.sendText, { color: '#fff' }]}>Send</Text>
        </TouchableOpacity>
      </View>

      {/* price offer modal */}
      <Modal visible={offerModal} transparent animationType="fade">
        <View style={styles.modalBg}>
          <View style={[styles.modalCard, { backgroundColor: palette.card }]}>
            <Text style={{ fontFamily: headingFont, fontSize: 20, color: palette.ink, textAlign: 'center' }}>Propose a price</Text>
            <RNTextInput
              value={offerAmount}
              onChangeText={setOfferAmount}
              placeholder="₦ 15000"
              keyboardType="number-pad"
              placeholderTextColor="#999"
              style={[styles.input, { backgroundColor: palette.bg, color: palette.ink, borderColor: palette.border, marginTop: 16 }]}
            />
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
              <TouchableOpacity onPress={() => setOfferModal(false)} style={[styles.decideBtn, { backgroundColor: palette.border, flex: 1 }]}>
                <Text style={[styles.decideText, { color: palette.ink }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={sendOffer} style={[styles.decideBtn, { backgroundColor: brand.orange, flex: 1 }]}>
                <Text style={styles.decideText}>Send offer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* incoming call prompt */}
      <Modal visible={!!incoming} transparent animationType="fade">
        <View style={styles.modalBg}>
          <View style={[styles.modalCard, { backgroundColor: palette.card }]}>
            <Text style={{ color: palette.sub, textAlign: 'center', fontSize: 13 }}>Incoming call</Text>
            <Text style={{ fontFamily: headingFont, fontSize: 22, color: palette.ink, textAlign: 'center', marginTop: 4 }}>
              {incoming?.fromName || incoming?.from}
            </Text>
            <View style={{ flexDirection: 'row', gap: 12, marginTop: 20 }}>
              <TouchableOpacity
                onPress={() => { setIncoming(null); if (callState === null) setCallState({ peer: incoming!.from, outgoing: false, inviteOnMount: false }); }}
                style={[styles.decideBtn, { backgroundColor: '#22C55E', flex: 1, paddingVertical: 12 }]}
              >
                <Text style={styles.decideText}>Accept</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => { clientRef.current?.callEnd(incoming!.from); setIncoming(null); }}
                style={[styles.decideBtn, { backgroundColor: '#E5484D', flex: 1, paddingVertical: 12 }]}
              >
                <Text style={styles.decideText}>Decline</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* voice call overlay */}
      {callState && (
        <PriceCallOverlay
          client={clientRef.current}
          me={me}
          peer={callState.peer}
          outgoing={callState.outgoing}
          inviteOnMount={callState.inviteOnMount}
          palette={palette}
          onClose={() => setCallState(null)}
        />
      )}
    </KeyboardAvoidingView>
  );
}

// ---------- voice call overlay (WebRTC, browser builds) ----------
function PriceCallOverlay({ client, me, peer, outgoing, inviteOnMount, palette, onClose }: any) {
  const [phase, setPhase] = useState<'ringing' | 'connecting' | 'active' | 'ended' | 'blocked'>(outgoing ? 'ringing' : 'connecting');
  const [seconds, setSeconds] = useState(0);
  const [note, setNote] = useState('');
  const pcRef = useRef<any>(null);
  const streamRef = useRef<any>(null);
  const timer = useRef<any>(null);
  const started = useRef(false);

  useEffect(() => {
    if (phase !== 'active') return;
    timer.current = setInterval(() => setSeconds((s: number) => s + 1), 1000);
    return () => clearInterval(timer.current);
  }, [phase]);

  const cleanup = () => {
    try { streamRef.current?.getTracks?.().forEach((t: any) => t.stop()); } catch {}
    try { pcRef.current?.close?.(); } catch {}
    pcRef.current = null;
  };

  useEffect(() => {
    if (inviteOnMount) {
      client.callInvite(peer);
      setNote('Ringing…');
      startWebRTC(true);
    } else {
      // callee: open the mic now; the caller's SDP offer arrives over the socket
      startWebRTC(false);
    }

    const disposeSignal = (client as any).setSignalHandler
      ? (client.setSignalHandler as any)(peer, (data: any) => {
          (async () => {
            const pc = pcRef.current;
            if (!pc) return;
            try {
              if (data.sdp?.type === 'offer') {
                await pc.setRemoteDescription(data.sdp);
                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);
                client.signal(peer, { sdp: pc.localDescription });
              } else if (data.sdp?.type === 'answer') {
                if (pc.signalingState !== 'stable') {
                  await pc.setRemoteDescription(data.sdp);
                }
                setPhase('connecting');
              } else if (data.candidate) {
                try { await pc.addIceCandidate(data.candidate); } catch {}
              }
            } catch {}
          })();
        })
      : null;

    return () => { cleanup(); if (disposeSignal) disposeSignal(); };
  }, []);

  const startWebRTC = async (makeOffer: boolean) => {
    if (started.current) return pcRef.current;
    started.current = true;
    if (Platform.OS !== 'web') {
      setNote('Voice calls need the mobile dev build (npx expo run:android).');
      setPhase('blocked');
      return null;
    }
    try {
      // @ts-ignore browser-only under expo web
      const stream: MediaStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      streamRef.current = stream;
      // @ts-ignore
      const pc = new (global as any).RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
      pcRef.current = pc;
      stream.getTracks().forEach((t: any) => pc.addTrack(t, stream));
      pc.onicecandidate = (e: any) => { if (e.candidate) client.signal(peer, { candidate: e.candidate }); };
      pc.ontrack = (e: any) => {
        const audio = new Audio();
        audio.srcObject = e.streams[0];
        audio.play().catch(() => {});
      };
      pc.onconnectionstatechange = () => {
        if (pc.connectionState === 'connected') setPhase('active');
        else if (pc.connectionState === 'failed') setNote('Connection failed');
      };
      if (makeOffer) {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        client.signal(peer, { sdp: pc.localDescription });
      }
      return pc;
    } catch (err: any) {
      if (err?.name === 'NotAllowedError') setNote('Microphone blocked — allow access in the browser.');
      else setNote('Could not start audio: ' + (err?.message || 'unknown'));
      return null;
    }
  };

  const end = () => {
    client.callEnd(peer);
    cleanup();
    setPhase('ended');
    setTimeout(onClose, 900);
  };

  const mmss = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
  const label = phase === 'active' ? mmss : note || 'Connecting…';

  return (
    <Modal transparent animationType="fade">
      <View style={[styles.modalBg, { backgroundColor: 'rgba(0,0,0,0.7)' }]}>
        <View style={[styles.modalCard, { backgroundColor: palette.card, alignItems: 'center', paddingHorizontal: 36, paddingVertical: 40 }]}>
          <View style={[styles.avatar, { backgroundColor: brand.blue }]}>
            <Text style={styles.avatarText}>{(peer || '?').slice(0, 1).toUpperCase()}</Text>
          </View>
          <Text style={{ fontFamily: headingFont, fontSize: 22, color: palette.ink }}>{peer}</Text>
          <Text style={{ color: palette.sub, marginTop: 6, marginBottom: 24, fontSize: 14 }}>{label}</Text>
          <TouchableOpacity onPress={end} style={[styles.decideBtn, { backgroundColor: '#E5484D', paddingHorizontal: 24, paddingVertical: 12 }]}>
            <Text style={styles.decideText}>End call</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  title2: { fontSize: 30, fontFamily: headingFont, textAlign: 'center', marginBottom: 6 },
  sub2: { fontSize: 15, textAlign: 'center', marginBottom: 24 },
  input: { borderWidth: 1, borderRadius: 12, padding: 14, fontSize: 16, marginBottom: 12, textAlign: 'center' },
  ctaBtn: { backgroundColor: brand.orange, borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  ctaText: { color: '#fff', fontFamily: headingFontBold, fontSize: 16 },
  peerBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, gap: 8, borderBottomWidth: 1 },
  peerInput: { flex: 1, borderRadius: 12, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14 },
  clearBtn: { padding: 8 },
  callBtn: { backgroundColor: '#22C55E', borderRadius: 999, padding: 10 },
  callBtnText: { fontSize: 16 },
  // connectionDot
  connectionDot: { fontSize: 12, paddingHorizontal: 16, paddingTop: 6 },
  list: { paddingHorizontal: 12, paddingBottom: 16, gap: 8 },
  bubble: { maxWidth: '80%', paddingVertical: 10, paddingHorizontal: 14, borderRadius: 18, borderWidth: 1 },
  mine: { alignSelf: 'flex-end', borderBottomRightRadius: 4 },
  theirs: { alignSelf: 'flex-start', borderBottomLeftRadius: 4 },
  bubbleText: { fontSize: 15 },
  offerBubble: { borderRadius: 18, borderWidth: 1, padding: 14, marginVertical: 4, maxWidth: '80%' },
  emptyHint: { textAlign: 'center', marginTop: 40, fontSize: 13, lineHeight: 20 },
  composer: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10, borderTopWidth: 1 },
  offerBtn: { backgroundColor: '#FBB03B', paddingHorizontal: 10, paddingVertical: 10, borderRadius: 12 },
  offerBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  composerInput: { flex: 1, borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 10, fontSize: 15 },
  sendBtn: { backgroundColor: brand.orange, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 16 },
  sendText: { fontWeight: '800', fontSize: 14 },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 24 },
  modalCard: { borderRadius: 24, padding: 24 },
  decideBtn: { borderRadius: 12, paddingVertical: 10, paddingHorizontal: 16, alignItems: 'center' },
  decideText: { color: '#fff', fontFamily: headingFontBold, fontSize: 14 },
  avatar: { width: 90, height: 90, borderRadius: 45, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  avatarText: { color: '#fff', fontSize: 36, fontFamily: headingFont },
});
