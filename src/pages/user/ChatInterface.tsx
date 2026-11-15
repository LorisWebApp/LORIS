import { Bot, ChevronRight, Headset, Info, MessagesSquare, RotateCcw } from 'lucide-react';
import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { DesktopComposer, MobileComposer } from '../../components/chatbot/Composer';
import { MessageList } from '../../components/chatbot/MessageList';
import { MobileBottomNav, MobileTopBar } from '../../components/layout/MobileChrome';
import { SiteFooter } from '../../components/layout/SiteFooter';
import { TopNav } from '../../components/layout/TopNav';
import { useChatSession } from '../../hooks/useChatSession';
import { useIsDesktop } from '../../hooks/useMediaQuery';
import { ROUTES, useCurrentUser } from '../../integration/loris';
import { SUGGESTED_TOPICS } from '../../types/chat';

export default function ChatInterface() {
  const isDesktop = useIsDesktop();
  const user = useCurrentUser();
  const chat = useChatSession();
  const topicsRef = useRef<HTMLDivElement>(null);

  const backToFaq = () => {
    topicsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    topicsRef.current?.querySelector<HTMLButtonElement>('button')?.focus();
  };

  if (!isDesktop) {
    return (
      <div className="flex h-dvh flex-col bg-page pb-[60px]">
        <MobileTopBar />
        <div className="flex items-center justify-between px-4 pb-2 pt-1">
          <div className="flex items-center gap-2.5">
            <span className="relative grid size-8 place-items-center rounded-full bg-ink text-white">
              <Bot size={15} /><i className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full border-2 border-page bg-brand" />
            </span>
            <h1 className="font-serif text-lg text-deep">Library Assistant</h1>
          </div>
          <button onClick={chat.clear} aria-label="Clear conversation" className="grid size-8 place-items-center text-ink/70"><RotateCcw size={16} /></button>
        </div>
        <div ref={topicsRef} className="no-scrollbar flex gap-2 overflow-x-auto px-4 pb-3">
          {SUGGESTED_TOPICS.map((t) => (
            <button key={t.chip} onClick={() => chat.send(t.question)} className="shrink-0 rounded-full bg-white px-3.5 py-1.5 text-[11px] font-semibold text-ink shadow-[0_1px_4px_rgba(9,47,44,0.06)]">{t.chip}</button>
          ))}
        </div>
        <MessageList className="min-h-0 flex-1 overflow-y-auto px-4 py-3" messages={chat.messages} mobile initials={user.initials} onFeedback={chat.setFeedback} onBackToFaq={backToFaq} />
        <div className="border-t border-line"><MobileComposer onSend={chat.send} /></div>
        <MobileBottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-page">
      <TopNav />
      <section className="bg-ink text-white">
        <div className="mx-auto flex h-[100px] max-w-[1312px] items-center gap-3 px-8">
          <MessagesSquare size={18} className="text-white/80" />
          <h1 className="font-serif text-[40px]">Library Assistant</h1>
        </div>
      </section>
      <div className="mx-auto flex max-w-[1312px] items-start gap-8 px-8 pt-8">
        <aside className="w-[300px] shrink-0 space-y-5">
          <div className="flex gap-2.5 rounded-2xl bg-white p-4 text-[12px] leading-5 text-ink/80">
            <Info size={14} className="mt-0.5 shrink-0" />
            <p>This assistance provides automated responses based strictly on library documentation.</p>
          </div>
          <div className="rounded-2xl bg-white p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-[11px] font-bold uppercase tracking-wider text-deep">Suggested Topics</h2>
              <span className="text-[10px] text-muted">Instant answers</span>
            </div>
            <div ref={topicsRef} className="mt-3 space-y-2">
              {SUGGESTED_TOPICS.map((t) => (
                <button key={t.question} onClick={() => chat.send(t.question)} className="flex w-full items-center justify-between rounded-lg bg-mint px-3 py-2.5 text-left text-[12px] text-deep hover:bg-badge/50">
                  {t.question}<ChevronRight size={12} className="text-muted" />
                </button>
              ))}
            </div>
          </div>
          <Link to={ROUTES.support} className="flex items-center gap-3 rounded-2xl bg-mint p-4">
            <span className="grid size-9 place-items-center rounded-lg bg-white text-ink"><Headset size={16} /></span>
            <span><span className="block text-[13px] font-semibold text-deep">Need Human Assistance?</span><span className="text-[11px] text-muted">Archivists respond within 24 hours.</span></span>
          </Link>
        </aside>

        <section className="min-w-0 flex-1 overflow-hidden rounded-2xl bg-white">
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <div className="flex items-center gap-3">
              <span className="grid size-8 place-items-center rounded-lg bg-ink text-white"><Bot size={15} /></span>
              <div><p className="font-serif text-[15px] font-semibold text-deep">Conversation with Library Assistant</p><p className="text-[10px] text-muted">Current Session</p></div>
            </div>
            <button onClick={chat.clear} className="flex items-center gap-1.5 rounded-full bg-mint px-3 py-1.5 text-[11px] font-semibold text-ink"><RotateCcw size={12} />Clear</button>
          </div>
          <MessageList className="max-h-[760px] min-h-[420px] overflow-y-auto bg-page px-6 py-6" messages={chat.messages} mobile={false} initials={user.initials} onFeedback={chat.setFeedback} onBackToFaq={backToFaq} />
          <DesktopComposer onSend={chat.send} />
        </section>
      </div>
      <SiteFooter />
    </div>
  );
}
