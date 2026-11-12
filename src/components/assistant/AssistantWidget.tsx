import { Bot, Minus, RotateCcw, SendHorizontal, X } from 'lucide-react';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useLocation } from 'react-router-dom';
import { Button } from '../shared';
import { MessageList } from '../chatbot/MessageList';
import { useCurrentUser } from '../../integration/loris';
import { SUGGESTED_TOPICS } from '../../types/chat';
import { useAssistant } from './AssistantProvider';

/*
 * z-index: above page chrome (z-30..60) and dialogs, below nothing.
 * bubble 80 < backdrop 90 < panel 91.
 */

function AssistantBubble({ hidden, onOpen, buttonRef }: { hidden: boolean; onOpen: () => void; buttonRef: React.Ref<HTMLButtonElement> }) {
  return (
    <button
      ref={buttonRef}
      type="button"
      onClick={onOpen}
      aria-label="Open Library Assistant"
      aria-expanded={!hidden}
      aria-haspopup="dialog"
      title="Ask the Library Assistant"
      tabIndex={hidden ? -1 : 0}
      className={`fixed right-4 z-80 grid size-13 place-items-center rounded-full bg-deep text-white shadow-[0_4px_14px_rgba(9,47,44,0.28)] transition duration-200 ease-out hover:-translate-y-0.5 hover:bg-ink hover:shadow-[0_8px_20px_rgba(9,47,44,0.32)] active:translate-y-0 motion-reduce:transition-none bottom-[calc(76px+env(safe-area-inset-bottom))] lg:bottom-6 lg:right-6 lg:size-14 ${hidden ? 'pointer-events-none scale-75 opacity-0' : 'scale-100 opacity-100'}`}
    >
      <Bot size={22} aria-hidden />
      <i className="absolute right-0.5 top-0.5 size-3 rounded-full border-2 border-deep bg-badge" aria-hidden />
    </button>
  );
}

function ChatInput({ disabled, onSend, inputRef }: { disabled: boolean; onSend: (t: string) => void; inputRef: React.Ref<HTMLInputElement> }) {
  const [value, setValue] = useState('');
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!value.trim() || disabled) return;
    onSend(value);
    setValue('');
  };
  return (
    <form onSubmit={submit} className="border-t border-line bg-white px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3">
      <div className="flex items-center gap-2 border border-line bg-white py-1 pl-3 pr-1 focus-within:border-brand">
        <input
          ref={inputRef}
          aria-label="Your question"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Type your question…"
          autoComplete="off"
          // 16px prevents iOS from zooming the page when the field is focused.
          className="h-9 w-full bg-transparent text-[16px] outline-none placeholder:text-muted focus-visible:outline-none"
        />
        <Button type="submit" variant="icon" filled size="sm" aria-label="Send" disabled={!value.trim() || disabled}><SendHorizontal size={16} /></Button>
      </div>
    </form>
  );
}

function TypingIndicator() {
  return (
    <div className="flex items-center gap-2.5 px-4 pb-3 text-[14px] text-muted" role="status" aria-live="polite">
      <span className="grid size-7 place-items-center rounded-full bg-ink text-white"><Bot size={13} aria-hidden /></span>
      <span className="flex items-center gap-1" aria-hidden>
        {[0, 150, 300].map((d) => <i key={d} className="size-1.5 animate-pulse rounded-full bg-brand" style={{ animationDelay: `${d}ms` }} />)}
      </span>
      <span>Assistant is preparing an answer…</span>
    </div>
  );
}

/**
 * Floating Library Assistant: a fixed bubble that expands into a chat panel.
 * Render once inside <AssistantProvider> (see EndUserLayout).
 */
export function AssistantWidget() {
  const { open, messages, loading, openAssistant, minimize, close, send, clear, setFeedback } = useAssistant();
  const user = useCurrentUser();
  const { pathname } = useLocation();
  const bubbleRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const wasOpen = useRef(false);

  // Move focus into the panel on open, back to the bubble on close.
  useEffect(() => {
    if (open) {
      const t = setTimeout(() => inputRef.current?.focus(), 200);
      wasOpen.current = true;
      return () => clearTimeout(t);
    }
    if (wasOpen.current) { bubbleRef.current?.focus(); wasOpen.current = false; }
  }, [open]);

  // Following a link from an answer navigates; get the panel out of the way.
  const firstPath = useRef(pathname);
  useEffect(() => {
    if (firstPath.current !== pathname) { firstPath.current = pathname; minimize(); }
  }, [pathname, minimize]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, close]);

  const showTopics = messages.length <= 1;

  return (
    <>
      <AssistantBubble hidden={open} onOpen={openAssistant} buttonRef={bubbleRef} />

      {/* Translucent, blurred overlay: the page stays visible but de-emphasised. */}
      <div
        aria-hidden
        onClick={minimize}
        className={`fixed inset-0 z-90 bg-deep/25 backdrop-blur-xs transition-opacity duration-200 motion-reduce:transition-none ${open ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
      />

      <section
        role="dialog"
        aria-label="Library Assistant"
        aria-modal="false"
        inert={!open}
        className={`fixed z-91 flex flex-col overflow-hidden border-line bg-page/95 backdrop-blur-xl origin-bottom-right transition duration-200 ease-out motion-reduce:transition-none
          inset-0 h-dvh
          sm:inset-auto sm:bottom-6 sm:right-6 sm:h-[min(600px,calc(100dvh-3rem))] sm:w-[min(440px,calc(100vw-3rem))] sm:border sm:shadow-[0_16px_48px_rgba(9,47,44,0.22)]
          lg:w-[clamp(420px,33vw,600px)]
          ${open ? 'translate-y-0 scale-100 opacity-100' : 'pointer-events-none translate-y-4 scale-95 opacity-0'}`}
      >
        <header className="flex items-center justify-between gap-3 border-b border-line bg-white px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
          <div className="flex min-w-0 items-center gap-3">
            <span className="relative grid size-9 shrink-0 place-items-center rounded-[4px] bg-ink text-white">
              <Bot size={17} aria-hidden />
              <i className={`absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full border-2 border-white ${loading ? 'animate-pulse bg-muted' : 'bg-brand'}`} aria-hidden />
            </span>
            <div className="min-w-0">
              <h2 className="m-0 truncate text-[18px] font-semibold leading-tight text-deep">Library Assistant</h2>
              <p className="m-0 text-[13px] text-muted">{loading ? 'Preparing an answer…' : 'Online · Automated answers'}</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center">
            <Button variant="icon" size="sm" onClick={clear} aria-label="Start a new conversation" title="New conversation"><RotateCcw size={15} /></Button>
            <Button variant="icon" size="sm" onClick={minimize} aria-label="Minimize assistant" title="Minimize"><Minus size={17} /></Button>
            <Button variant="icon" size="sm" onClick={close} aria-label="Close assistant" title="Close"><X size={17} /></Button>
          </div>
        </header>

        <MessageList
          className="no-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4"
          messages={messages}
          mobile
          initials={user.initials}
          onFeedback={setFeedback}
          onBackToFaq={() => inputRef.current?.focus()}
        />

        {loading && <TypingIndicator />}

        {showTopics && !loading && (
          <div className="no-scrollbar flex gap-2 overflow-x-auto px-4 pb-3">
            {SUGGESTED_TOPICS.map((t) => (
              <Button key={t.question} variant="text" shape="pill" size="sm" className="shrink-0 bg-white" onClick={() => send(t.question, 'suggested_topic')}>{t.chip}</Button>
            ))}
          </div>
        )}

        <ChatInput disabled={loading} onSend={(t) => send(t)} inputRef={inputRef} />
      </section>
    </>
  );
}
