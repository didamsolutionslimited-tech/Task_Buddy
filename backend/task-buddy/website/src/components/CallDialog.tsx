// WebRTC voice-call overlay with signaling over the chat WebSocket.
import React, { useEffect, useRef, useState } from 'react';

interface CallDialogProps {
  socket: WebSocket | null;
  me: string;
  peer: string;
  peerName?: string | null;
  outgoing: boolean; // true: I invited. false: incoming call
  onClosed: () => void;
}

const RTC_CONFIG: RTCConfiguration = {
  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
};

export default function CallDialog({ socket, me, peer, peerName, outgoing, onClosed }: CallDialogProps) {
  const [phase, setPhase] = useState<'ringing' | 'connecting' | 'active' | 'ended'>('ringing');
  const [seconds, setSeconds] = useState(0);
  const [muted, setMuted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<any>(null);
  const startedRef = useRef(false); // guards double start

  const startMediaIfNeeded = async () => {
    if (startedRef.current) return;
    startedRef.current = true;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      localStreamRef.current = stream;

      const pc = new RTCPeerConnection(RTC_CONFIG);
      pcRef.current = pc;
      stream.getTracks().forEach((t) => pc.addTrack(t, stream));

      pc.onicecandidate = (e) => {
        if (e.candidate && socket && socket.readyState === WebSocket.OPEN) {
          socket.send(JSON.stringify({ type: 'signal', to: peer, data: { candidate: e.candidate } }));
        }
      };
      pc.ontrack = (e) => {
        if (audioRef.current) {
          audioRef.current.srcObject = e.streams[0];
          audioRef.current.play().catch(() => {});
        }
      };
      pc.onconnectionstatechange = () => {
        if (pc.connectionState === 'connected') setPhase('active');
        if (pc.connectionState === 'failed') setError('Connection failed');
        if (pc.connectionState === 'disconnected') end();
      };

      if (outgoing) {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket?.send(JSON.stringify({ type: 'signal', to: peer, data: { sdp: pc.localDescription } }));
      }
      setPhase((p) => (p === 'ringing' && outgoing ? 'ringing' : 'connecting'));
    } catch (err: any) {
      setError(
        err?.name === 'NotAllowedError'
          ? 'Microphone access was blocked - allow it in your browser to call.'
          : 'Could not start the call: ' + (err?.message || 'unknown error')
      );
    }
  };

  useEffect(() => {
    if (!socket) return;
    const onMessage = (ev: MessageEvent) => {
      let msg: any;
      try { msg = JSON.parse(String(ev.data)); } catch { return; }
      if (msg.type === 'signal' && msg.from === peer) {
        (async () => {
          const pc = pcRef.current;
          if (msg.data.sdp?.type === 'offer' && !outgoing) {
            await startMediaIfNeeded();
            const p = pcRef.current!;
            await p.setRemoteDescription(new RTCSessionDescription(msg.data.sdp));
            const answer = await p.createAnswer();
            await p.setLocalDescription(answer);
            socket.send(JSON.stringify({ type: 'signal', to: peer, data: { sdp: p.localDescription } }));
          } else if (msg.data.sdp?.type === 'answer' && outgoing) {
            const p = pcRef.current;
            if (p && p.signalingState !== 'stable') {
              await p.setRemoteDescription(new RTCSessionDescription(msg.data.sdp));
              setPhase('connecting');
            }
          } else if (msg.data.candidate && pcRef.current) {
            try { await pcRef.current.addIceCandidate(new RTCIceCandidate(msg.data.candidate)); } catch {}
          }
        })();
      } else if (msg.type === 'call-answer' && msg.from === peer && msg.accepted && outgoing) {
        startMediaIfNeeded();
      } else if (msg.type === 'call-end' && msg.from === peer) {
        cleanup();
        setPhase('ended');
        setTimeout(onClosed, 1200);
      }
    };
    socket.addEventListener('message', onMessage);
    return () => socket.removeEventListener('message', onMessage);
  }, [socket, peer, outgoing]);

  useEffect(() => {
    if (phase !== 'active') return;
    timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(timerRef.current);
  }, [phase]);

  // outgoing call: invite the peer
  useEffect(() => {
    if (outgoing) {
      socket?.send(JSON.stringify({ type: 'call-invite', to: peer }));
      // start gathering ICE while ringing
      startMediaIfNeeded();
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const cleanup = () => {
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    pcRef.current?.close();
    pcRef.current = null;
  };

  const end = () => {
    socket?.send(JSON.stringify({ type: 'call-end', to: peer }));
    cleanup();
    setPhase('ended');
    setTimeout(onClosed, 1200);
  };

  const accept = () => {
    socket?.send(JSON.stringify({ type: 'call-answer', to: peer, accepted: true }));
    startMediaIfNeeded(); // callee waits for the offer from the caller
  };

  const decline = () => {
    socket?.send(JSON.stringify({ type: 'call-answer', to: peer, accepted: false }));
    cleanup();
    onClosed();
  };

  const mmss = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;

  const statusText =
    phase === 'ringing'
      ? outgoing ? `Calling ${peerName || peer}…` : `Incoming call from ${peerName || peer}`
      : phase === 'connecting' ? 'Connecting…'
      : phase === 'active' ? mmss
      : 'Call ended';

  if (phase === 'ended') {
    return (
      <div className="fixed inset-0 z-[100] bg-black/70 flex items-center justify-center">
        <div className="bg-white dark:bg-gray-900 rounded-3xl px-10 py-8 text-center">
          <p className="text-lg font-extrabold text-buddy-dark dark:text-white">Call ended</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] bg-black/70 flex items-center justify-center px-4">
      <audio ref={audioRef} autoPlay />
      <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-sm px-8 py-10 text-center">
        <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-buddy-cyan to-buddy-blue flex items-center justify-center text-white text-3xl font-extrabold mb-6">
          {(peerName || peer || '?').slice(0, 1).toUpperCase()}
        </div>
        <p className="text-xl font-extrabold text-buddy-dark dark:text-white truncate">{peerName || peer}</p>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 mb-6">{error || statusText}</p>

        {outgoing || phase !== 'ringing' ? (
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => {
                setMuted((m) => {
                  const stream = localStreamRef.current;
                  stream?.getAudioTracks().forEach((t) => (t.enabled = m));
                  return !m;
                });
              }}
              className={`w-12 h-12 rounded-full flex items-center justify-center text-xl transition ${muted ? 'bg-buddy-orange text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'}`}
              title={muted ? 'Unmute' : 'Mute'}
            >
              🎙
            </button>
            <button
              onClick={end}
              className="w-14 h-14 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center text-2xl shadow-lg transition"
              title="End call"
            >
              📞
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={decline}
              className="w-14 h-14 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center text-2xl shadow-lg transition"
              title="Decline"
            >
              ✕
            </button>
            <button
              onClick={accept}
              className="w-14 h-14 rounded-full bg-green-500 hover:bg-green-600 text-white flex items-center justify-center text-2xl shadow-lg transition"
              title="Accept"
            >
              ✓
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
