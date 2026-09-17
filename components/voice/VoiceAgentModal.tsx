'use client';
import { useEffect, useRef, useState } from 'react';
import {
  Headphones,
  Mic,
  MicOff,
  PhoneOff,
  ShieldCheck,
  ArrowRight,
  Volume2,
  Check,
  X,
} from 'lucide-react';
import {
  createRealtimeConnection,
  type RealtimeConnection,
  type VoiceStatus,
  type Transfer,
} from '@/lib/realtime/createRealtimeConnection';
import type { HandoffContext, Message, Mode } from '@/lib/chat/types';
import { scriptedConversation } from '@/lib/demo/script';
export function VoiceAgentModal({
  context,
  mode,
  onClose,
}: {
  context: HandoffContext;
  mode: Mode;
  onClose: () => void;
}) {
  const [status, setStatus] = useState<VoiceStatus>('idle'),
    [muted, setMuted] = useState(false),
    [error, setError] = useState(''),
    [transcript, setTranscript] = useState<Message[]>([]),
    [blocked, setBlocked] = useState(false),
    [fallback, setFallback] = useState(false),
    [scripted, setScripted] = useState(false),
    [index, setIndex] = useState(0),
    [transfer, setTransfer] = useState<Transfer | null>(null),
    [transferReady, setTransferReady] = useState(false),
    [attempt, setAttempt] = useState(0);
  const startupAbort = useRef<AbortController | null>(null);
  const connection = useRef<RealtimeConnection | null>(null),
    log = useRef<HTMLDivElement>(null);
  const script = scriptedConversation(context.scenario, mode);
  useEffect(() => {
    let active = true;
    const abort = new AbortController();
    startupAbort.current = abort;
    const c = createRealtimeConnection(context, mode, {
      status: setStatus,
      error: setError,
      transcript: (m) => setTranscript((t) => [...t, m]),
      transfer: setTransfer,
      audioBlocked: () => setBlocked(true),
    });
    connection.current = c;
    void (async () => {
      try {
        const response = await fetch('/api/demo/config', {
          signal: AbortSignal.any([abort.signal, AbortSignal.timeout(10000)]),
        });
        if (!response.ok) throw new Error('Configuration unavailable');
        const config = (await response.json()) as {
          fallbackEnabled: boolean;
          voiceConfigured: boolean;
        };
        if (!active || abort.signal.aborted) return;
        setFallback(config.fallbackEnabled === true);
        if (!config.voiceConfigured) {
          setStatus('error');
          setError('Live voice is not configured yet.');
          return;
        }
        await c.start();
      } catch {
        if (active && !abort.signal.aborted) {
          setStatus('error');
          setError(
            'Voice support is temporarily unavailable. Please try again.',
          );
        }
      }
    })();
    return () => {
      active = false;
      abort.abort();
      c.close();
      connection.current = null;
    };
  }, [context, mode, attempt]);
  useEffect(() => {
    if (!transfer) return;
    const t = setTimeout(() => setTransferReady(true), 900);
    return () => clearTimeout(t);
  }, [transfer]);
  useEffect(() => {
    log.current?.scrollTo({
      top: log.current.scrollHeight,
      behavior: 'smooth',
    });
  }, [transcript, transfer]);
  const stop = () => {
    startupAbort.current?.abort();
    connection.current?.close();
    setStatus('ended');
    setMuted(false);
    setError('');
    setBlocked(false);
  };
  const close = () => {
    startupAbort.current?.abort();
    connection.current?.close();
    onClose();
  };
  const startScript = () => {
    startupAbort.current?.abort();
    connection.current?.close();
    setScripted(true);
    setIndex(0);
    setTransfer(null);
    setTransferReady(false);
    setMuted(false);
    setBlocked(false);
    setStatus('idle');
    setError('');
    setTranscript([
      {
        role: 'assistant',
        text: script[0].assistant,
        timestamp: new Date().toISOString(),
      },
    ]);
  };
  const next = () => {
    const current = script[index];
    const following = script[index + 1];
    if (!following) {
      stop();
      return;
    }
    setTranscript((t) => [
      ...t,
      ...(current.reply
        ? [
            {
              role: 'user' as const,
              text: current.reply,
              timestamp: new Date().toISOString(),
            },
          ]
        : []),
      {
        role: 'assistant',
        text: following.assistant,
        timestamp: new Date().toISOString(),
      },
    ]);
    setIndex(index + 1);
  };
  const statusText = scripted
    ? status === 'ended'
      ? 'Call ended'
      : 'Connected'
    : error
      ? fallback
        ? 'Voice unavailable'
        : 'Unable to connect'
      : muted
        ? 'Muted'
        : {
            idle: 'Getting ready',
            'requesting microphone': 'Allow microphone access',
            connecting: 'Connecting…',
            listening: 'Connected · Listening',
            'assistant speaking': 'Connected · Speaking',
            ending: 'Ending…',
            ended: 'Call ended',
            error: 'Unable to connect',
          }[status];
  return (
    <dialog
      open
      className="voice-modal-contained"
      aria-labelledby="voice-agent-title"
    >
      <div className="voice-top">
        <span>VOICE SUPPORT</span>
        <button
          className="icon-button"
          aria-label="Close voice call"
          onClick={close}
        >
          <X size={20} />
        </button>
      </div>
      <div className="assistant-avatar">
        <Headphones size={34} />
      </div>
      <h2 className="voice-title" id="voice-agent-title">
        Lincoln Financial
        <br />
        virtual assistant
      </h2>
      <p className="voice-subtitle">
        {mode === 'chat-handoff'
          ? 'Picking up right where you left off.'
          : 'A little guidance for your next step.'}
      </p>
      <div className="call-status" aria-live="polite">
        <i className={error ? 'error-dot' : ''} />
        {statusText}
      </div>
      <div
        className={`waveform ${!scripted && status === 'assistant speaking' ? 'active' : ''}`}
        aria-hidden="true"
      >
        {[12, 23, 34, 21, 43, 29, 49, 32, 22, 38, 26, 14].map((h, i) => (
          <span key={i} style={{ height: h, animationDelay: `${i * 0.08}s` }} />
        ))}
      </div>
      {mode === 'chat-handoff' && (
        <div className="carryover">
          <ShieldCheck size={18} />
          <div>
            <strong>Conversation connected</strong>
            <span>
              {context.verified ? 'Verification complete' : 'General support'} ·{' '}
              {context.scenario === 'HARDSHIP_MEDICAL'
                ? 'Family emergency'
                : context.scenario === 'NON_HARDSHIP_CAR'
                  ? 'Personal loan / new car'
                  : 'Your request'}
            </span>
          </div>
        </div>
      )}
      {error && (
        <div role="alert" className="voice-error">
          <p>{error}</p>
          <button
            className="outline-button"
            onClick={() => {
              setError('');
              setStatus('idle');
              setMuted(false);
              setBlocked(false);
              setTransfer(null);
              setTransferReady(false);
              setAttempt((n) => n + 1);
            }}
          >
            Try again
          </button>
          {fallback && (
            <button className="text-link" onClick={startScript}>
              Continue with guided transcript <ArrowRight size={16} />
            </button>
          )}
        </div>
      )}
      {blocked && !error && status !== 'ended' && (
        <button
          className="outline-button"
          onClick={async () => {
            if (await connection.current?.play()) setBlocked(false);
          }}
        >
          <Volume2 size={16} /> Enable speaker audio
        </button>
      )}
      {transcript.length > 0 && (
        <div
          className="voice-transcript"
          ref={log}
          role="log"
          aria-label="Call transcript"
        >
          {transcript.map((m, i) => (
            <p key={i}>
              <b>{m.role === 'assistant' ? 'Assistant' : 'You'}</b>
              {m.text}
            </p>
          ))}
        </div>
      )}
      {transfer && (
        <div className="transfer-card" aria-live="polite">
          <strong>
            <Check size={16} />
            {transferReady ? 'Follow-up ready' : 'Preparing follow-up…'}
          </strong>
          <p>{transfer.customerSummary}</p>
          <span>Relevant chat and voice context is included.</span>
        </div>
      )}
      {scripted && status !== 'ended' && (
        <div className="script-actions">
          <button className="primary-button" onClick={next}>
            {script[index].reply || 'Finish'}
            <ArrowRight size={16} />
          </button>
          <button
            className="text-link"
            onClick={() => {
              setTransferReady(false);
              setTransfer({
                reason: 'Customer requested specialist',
                customerSummary: [
                  context.initialIntent,
                  context.postAuthIntent,
                  ...transcript.map((m) => m.text),
                ]
                  .filter(Boolean)
                  .join(' ')
                  .slice(0, 1500),
              });
            }}
          >
            Prepare specialist follow-up
          </button>
        </div>
      )}
      {status === 'ended' ? (
        <button className="primary-button" onClick={close}>
          {mode === 'chat-handoff' ? 'Return to chat' : 'Return to FAQ'}
          <ArrowRight size={16} />
        </button>
      ) : (
        <div className="call-controls">
          <button
            disabled={
              scripted ||
              !!error ||
              !['listening', 'assistant speaking'].includes(status)
            }
            className={`call-control ${muted ? 'is-muted' : ''}`}
            aria-label={muted ? 'Unmute microphone' : 'Mute microphone'}
            aria-pressed={muted}
            onClick={() => {
              connection.current?.setMuted(!muted);
              setMuted(!muted);
            }}
          >
            {muted ? <MicOff /> : <Mic />}
            <span>{muted ? 'Unmute' : 'Mute'}</span>
          </button>
          <button
            className="call-control end-call"
            aria-label="End call"
            onClick={stop}
          >
            <PhoneOff />
            <span>End call</span>
          </button>
        </div>
      )}
      <p className="voice-disclaimer">AI-powered voice support</p>
    </dialog>
  );
}
