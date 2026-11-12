import { Bot, ChevronRight, Headset, MessagesSquare, RotateCcw } from 'lucide-react';
import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { DesktopComposer, MobileComposer } from '../../components/chatbot/Composer';
import { MessageList } from '../../components/chatbot/MessageList';
import { MobileBottomNav, MobileTopBar } from '../../components/layout/MobileChrome';
import { SiteFooter } from '../../components/layout/SiteFooter';
import { TopNav } from '../../components/layout/TopNav';
import { Alert, Button, PageHeader, SectionHeader } from '../../components/shared';
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
            <h1 className="m-0 text-[24px] font-medium text-deep">Library Assistant</h1>
          </div>
          <Button variant="icon" size="sm" onClick={chat.clear} aria-label="Clear conversation"><RotateCcw size={16} /></Button>
        </div>
        <div ref={topicsRef} className="no-scrollbar flex gap-2 overflow-x-auto px-4 pb-3">
          {SUGGESTED_TOPICS.map((t) => (
            <Button key={t.chip} variant="text" shape="pill" size="sm" className="bg-white" onClick={() => chat.send(t.question)}>{t.chip}</Button>
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
      <PageHeader tone="dark" size="md" icon={<MessagesSquare size={20} />} title="Library Assistant" className="py-8" contentClassName="px-8" />
      <div className="mx-auto flex max-w-[1312px] items-start gap-8 px-8 pt-8">
        <aside className="w-[300px] shrink-0 space-y-5">
          <div className="bg-white p-4">
            <Alert severity="info">This assistance provides automated responses based strictly on library documentation.</Alert>
          </div>
          <div className="bg-white p-4">
            <SectionHeader as="h2" size="sm" title="Suggested Topics" actions={<span className="text-[13px] font-normal normal-case tracking-normal text-muted">Instant answers</span>} />
            <div ref={topicsRef} className="mt-3 space-y-1">
              {SUGGESTED_TOPICS.map((t) => (
                <button key={t.question} onClick={() => chat.send(t.question)} className="flex w-full items-center justify-between border-b border-line px-1 py-2.5 text-left text-[16px] text-deep hover:bg-mint-soft">
                  {t.question}<ChevronRight size={13} className="text-muted" />
                </button>
              ))}
            </div>
          </div>
          <Link to={ROUTES.support} className="flex items-center gap-3 bg-mint p-4">
            <Headset size={20} className="text-ink" aria-hidden />
            <span><span className="block text-[17px] font-semibold text-deep">Need Human Assistance?</span><span className="text-[14px] text-muted">Archivists respond within 24 hours.</span></span>
          </Link>
        </aside>

        <section className="min-w-0 flex-1 overflow-hidden bg-white">
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <div className="flex items-center gap-3">
              <span className="grid size-8 place-items-center rounded-[4px] bg-ink text-white"><Bot size={15} /></span>
              <div><p className="m-0 text-[19px] font-semibold leading-tight text-deep">Conversation with Library Assistant</p><p className="m-0 text-[13px] text-muted">Current Session</p></div>
            </div>
            <Button variant="secondary" size="sm" shape="pill" onClick={chat.clear} leftIcon={<RotateCcw size={13} />}>Clear</Button>
          </div>
          <MessageList className="max-h-[760px] min-h-[420px] overflow-y-auto bg-page px-6 py-6" messages={chat.messages} mobile={false} initials={user.initials} onFeedback={chat.setFeedback} onBackToFaq={backToFaq} />
          <DesktopComposer onSend={chat.send} />
        </section>
      </div>
      <SiteFooter />
    </div>
  );
}
