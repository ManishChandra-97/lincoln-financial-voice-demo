'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  MessageCircle,
  X,
  ArrowUp,
  ShieldCheck,
  Headphones,
  LockKeyhole,
} from 'lucide-react';
import { Dialog as DialogPrimitive } from '@base-ui/react/dialog';
import {
  Dialog,
  DialogPortal,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from '@/components/ui/input-otp';
import { addReply, initialState, transition } from '@/lib/chat/chatMachine';
import { VoiceAgentModal } from '@/components/voice/VoiceAgentModal';
import type { ChatState } from '@/lib/chat/types';
export function ChatPanel({
  open,
  setOpen,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
}) {
  const [state, setState] = useState<ChatState>(initialState),
    [busy, setBusy] = useState(false),
    [input, setInput] = useState(''),
    [error, setError] = useState(''),
    [voice, setVoice] = useState(false);
  const stateRef = useRef(state),
    generation = useRef(0),
    lock = useRef(false),
    scroll = useRef<HTMLDivElement>(null),
    scrollTop = useRef(0),
    inputRef = useRef<HTMLInputElement>(null),
    timers = useRef(new Set<ReturnType<typeof setTimeout>>());
  const update = useCallback((s: ChatState) => {
    stateRef.current = s;
    setState(s);
  }, []);
  const reset = useCallback(() => {
    generation.current++;
    timers.current.forEach(clearTimeout);
    timers.current.clear();
    lock.current = false;
    setBusy(false);
    setInput('');
    setError('');
    setVoice(false);
    setOpen(false);
    scrollTop.current = 0;
    update(initialState());
  }, [setOpen, update]);
  useEffect(() => {
    const pendingTimers = timers.current;
    const key = (e: KeyboardEvent) => {
      if (
        e.shiftKey &&
        e.key.toLowerCase() === 'r' &&
        !(e.target instanceof HTMLInputElement) &&
        !(e.target instanceof HTMLTextAreaElement) &&
        !(e.target instanceof HTMLElement && e.target.isContentEditable)
      ) {
        e.preventDefault();
        reset();
      }
    };
    window.addEventListener('keydown', key);
    return () => {
      window.removeEventListener('keydown', key);
      pendingTimers.forEach(clearTimeout);
    };
  }, [reset]);
  useEffect(() => {
    if (scroll.current) scroll.current.scrollTop = scroll.current.scrollHeight;
  }, [state.context.chatTranscript.length, busy]);
  useEffect(() => {
    if (open && !busy) inputRef.current?.focus();
  }, [open, busy, state.step]);
  const wait = (ms: number) =>
    new Promise<void>((resolve) => {
      const t = setTimeout(() => {
        timers.current.delete(t);
        resolve();
      }, ms);
      timers.current.add(t);
    });
  const submit = async (value: string) => {
    if (!value.trim() || lock.current) return;
    lock.current = true;
    setBusy(true);
    setError('');
    setInput('');
    const version = generation.current;
    let valid = false;
    if (stateRef.current.step === 'ASK_OTP') {
      try {
        const response = await fetch('/api/demo/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ otp: value }),
          signal: AbortSignal.timeout(10000),
        });
        if (!response.ok) throw new Error();
        valid = ((await response.json()) as { valid: boolean }).valid;
      } catch {
        if (version === generation.current) {
          setError('Verification is unavailable. Please try again.');
          setBusy(false);
          lock.current = false;
        }
        return;
      }
    }
    if (version !== generation.current) return;
    const result = transition(stateRef.current, value, valid);
    update(result.state);
    for (const reply of result.replies) {
      await wait(420);
      if (version !== generation.current) return;
      update(addReply(stateRef.current, reply));
    }
    setBusy(false);
    lock.current = false;
  };
  const ready = state.step === 'VOICE_READY' || state.step === 'COMPLETED';
  const numeric = state.step === 'ASK_LAST4' || state.step === 'ASK_OTP';
  return (
    <>
      <button
        className="chat-launcher"
        aria-label={open ? 'Close chat' : 'Open chat'}
        onClick={() => {
          if (open) setVoice(false);
          setOpen(!open);
        }}
      >
        {open ? <X size={25} /> : <MessageCircle size={26} />}
      </button>
      <Dialog
        open={open}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) setVoice(false);
          setOpen(nextOpen);
        }}
      >
        <DialogPortal>
          <DialogPrimitive.Popup
            data-slot="dialog-content"
            className="chat-panel"
            initialFocus={inputRef}
          >
            {voice ? (
              <VoiceAgentModal
                context={state.context}
                mode="chat-handoff"
                onClose={() => setVoice(false)}
              />
            ) : (
              <>
                <header className="chat-header">
                  <span className="chat-avatar" aria-hidden="true">
                    <MessageCircle size={21} />
                  </span>
                  <div>
                    <DialogTitle>Lincoln Financial</DialogTitle>
                    <DialogDescription>
                      Virtual support · Here to help
                    </DialogDescription>
                  </div>
                  <button
                    className="agent-handoff"
                    aria-label="Open voice agent"
                    onClick={() => setVoice(true)}
                  >
                    <Headphones size={16} />
                    <span>Agent</span>
                  </button>
                  <button
                    className="icon-button"
                    aria-label="Close chat"
                    onClick={() => setOpen(false)}
                  >
                    <X size={20} />
                  </button>
                </header>
                <div className="chat-ribbon" aria-live="polite">
                  <LockKeyhole size={13} />
                  {state.context.verified ? (
                    <>
                      <ShieldCheck size={14} /> Demo verified
                    </>
                  ) : (
                    'Please use demo details only'
                  )}
                </div>
                <div
                  className="chat-messages"
                  ref={(node) => {
                    scroll.current = node;
                    if (node) node.scrollTop = scrollTop.current;
                  }}
                  onScroll={(e) => {
                    scrollTop.current = e.currentTarget.scrollTop;
                  }}
                  role="log"
                  aria-label="Chat messages"
                >
                  <p className="chat-today">TODAY</p>
                  {state.context.chatTranscript.map((m, i) => (
                    <div className={`message ${m.role}`} key={i}>
                      {m.role === 'assistant' && (
                        <span className="message-avatar">
                          <LandmarkIcon />
                        </span>
                      )}
                      <div>
                        <p>{m.text}</p>
                        <span className="message-meta">
                          {m.role === 'assistant'
                            ? 'Lincoln virtual support'
                            : 'You'}
                        </span>
                      </div>
                    </div>
                  ))}
                  {busy && (
                    <output className="typing" aria-label="Assistant is typing">
                      <i />
                      <i />
                      <i />
                    </output>
                  )}
                  {ready && !busy && (
                    <div className="ready-card">
                      <ShieldCheck size={22} />
                      <div>
                        <strong>You’re ready to talk.</strong>
                        <p>Select Agent in the chat header.</p>
                      </div>
                    </div>
                  )}
                </div>
                {!busy && state.step === 'WELCOME' && (
                  <div className="quick-replies">
                    <button
                      onClick={() =>
                        submit(
                          'Things are tight and I need to withdraw some money.',
                        )
                      }
                    >
                      I need to withdraw money
                    </button>
                  </div>
                )}
                {!busy && state.step === 'POST_AUTH_INTENT' && (
                  <div className="quick-replies">
                    {[
                      [
                        'Family emergency',
                        'I’m having a family emergency. Can I speak to an agent?',
                      ],
                      [
                        'Personal loan / new car',
                        'I’m looking for a personal loan for a new car. Can I speak to an agent?',
                      ],
                      ['Speak to an agent', 'Can I speak to an agent?'],
                    ].map(([label, text]) => (
                      <button key={label} onClick={() => submit(text)}>
                        {label}
                      </button>
                    ))}
                  </div>
                )}
                {!ready && (
                  <form
                    className="chat-composer"
                    onSubmit={(e) => {
                      e.preventDefault();
                      void submit(input);
                    }}
                  >
                    <label className="sr-only" htmlFor="chat-input">
                      {state.step === 'ASK_LAST4'
                        ? 'Last four SSN digits'
                        : state.step === 'ASK_OTP'
                          ? 'One-time passcode'
                          : 'Your message'}
                    </label>
                    {state.step === 'ASK_OTP' ? (
                      <InputOTP
                        ref={inputRef}
                        id="chat-input"
                        aria-label="One-time passcode"
                        maxLength={5}
                        pattern="[0-9]*"
                        value={input}
                        onChange={setInput}
                        disabled={busy}
                        autoComplete="off"
                      >
                        <InputOTPGroup>
                          {[0, 1, 2, 3, 4].map((i) => (
                            <InputOTPSlot key={i} index={i} />
                          ))}
                        </InputOTPGroup>
                      </InputOTP>
                    ) : (
                      <input
                        ref={inputRef}
                        id="chat-input"
                        type={state.step === 'ASK_LAST4' ? 'password' : 'text'}
                        inputMode={numeric ? 'numeric' : 'text'}
                        autoComplete="off"
                        maxLength={numeric ? 16 : 1000}
                        placeholder={
                          state.step === 'ASK_LAST4'
                            ? 'Last four digits'
                            : 'Type your message…'
                        }
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        disabled={busy}
                      />
                    )}
                    <button
                      aria-label="Send message"
                      type="submit"
                      disabled={busy || !input.trim()}
                    >
                      <ArrowUp size={21} />
                    </button>
                  </form>
                )}
                {error && (
                  <p role="alert" className="composer-error">
                    {error}
                  </p>
                )}
                <div className="chat-note">
                  {state.step === 'ASK_LAST4'
                    ? 'Demo last four: 6513'
                    : state.step === 'ASK_OTP'
                      ? 'Demo passcode: 48197 · No SMS is sent'
                      : 'Demo experience · No real transactions'}
                </div>
              </>
            )}
          </DialogPrimitive.Popup>
        </DialogPortal>
      </Dialog>
    </>
  );
}
function LandmarkIcon() {
  return <span aria-hidden="true">L</span>;
}
