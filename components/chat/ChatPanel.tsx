'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowUp, Headphones, MessageCircle, X } from 'lucide-react';
import { Dialog as DialogPrimitive } from '@base-ui/react/dialog';
import {
  Dialog,
  DialogDescription,
  DialogPortal,
  DialogTitle,
} from '@/components/ui/dialog';
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
  const [state, setState] = useState<ChatState>(initialState);
  const [busy, setBusy] = useState(false);
  const [input, setInput] = useState('');
  const [voice, setVoice] = useState(false);
  const stateRef = useRef(state);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const timers = useRef(new Set<ReturnType<typeof setTimeout>>());

  const update = (nextState: ChatState) => {
    stateRef.current = nextState;
    setState(nextState);
  };

  useEffect(() => {
    const pendingTimers = timers.current;
    return () => pendingTimers.forEach(clearTimeout);
  }, []);

  useEffect(() => {
    if (scrollRef.current)
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [state.context.chatTranscript.length, busy]);

  useEffect(() => {
    if (open && !voice && !busy) inputRef.current?.focus();
  }, [open, voice, busy]);

  const submit = async (value: string) => {
    if (!value.trim() || busy) return;
    setBusy(true);
    setInput('');
    const result = transition(stateRef.current, value);
    update(result.state);

    await new Promise<void>((resolve) => {
      const timer = setTimeout(() => {
        timers.current.delete(timer);
        resolve();
      }, 260);
      timers.current.add(timer);
    });

    for (const reply of result.replies) {
      update(addReply(stateRef.current, reply));
    }
    setBusy(false);
  };

  const closeChat = () => {
    setVoice(false);
    setOpen(false);
  };

  return (
    <>
      <button
        className="chat-launcher"
        aria-label={open ? 'Close chat' : 'Open chat'}
        onClick={() => (open ? closeChat() : setOpen(true))}
      >
        {open ? <X size={23} /> : <MessageCircle size={25} />}
      </button>

      <Dialog
        open={open}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) closeChat();
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
                  <div>
                    <DialogTitle>Chicago Financial</DialogTitle>
                    <DialogDescription>AI assistant</DialogDescription>
                  </div>
                  <button
                    className="agent-handoff"
                    aria-label="Open voice agent"
                    onClick={() => setVoice(true)}
                  >
                    <Headphones size={15} />
                    <span>Agent</span>
                  </button>
                  <button
                    className="icon-button"
                    aria-label="Close chat"
                    onClick={closeChat}
                  >
                    <X size={19} />
                  </button>
                </header>

                <div
                  className="chat-messages"
                  ref={scrollRef}
                  role="log"
                  aria-label="Chat messages"
                >
                  {state.context.chatTranscript.map((item, index) => (
                    <div className={`message ${item.role}`} key={index}>
                      <div>
                        <p>{item.text}</p>
                        <span className="message-meta">
                          {item.role === 'assistant' ? 'Assistant' : 'You'}
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
                </div>

                <form
                  className="chat-composer"
                  onSubmit={(event) => {
                    event.preventDefault();
                    void submit(input);
                  }}
                >
                  <label className="sr-only" htmlFor="chat-input">
                    Your message
                  </label>
                  <input
                    ref={inputRef}
                    id="chat-input"
                    type="text"
                    autoComplete="off"
                    maxLength={1000}
                    placeholder="Type a message"
                    value={input}
                    onChange={(event) => setInput(event.target.value)}
                    disabled={busy}
                  />
                  <button
                    aria-label="Send message"
                    type="submit"
                    disabled={busy || !input.trim()}
                  >
                    <ArrowUp size={19} />
                  </button>
                </form>
              </>
            )}
          </DialogPrimitive.Popup>
        </DialogPortal>
      </Dialog>
    </>
  );
}
