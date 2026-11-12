import { Bot } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { formatClock } from '../../lib/format';
import type { ChatMessage } from '../../types/chat';
import { HandoffExtras, HandoffTitle, OfflineExtras, SupportExtras, metaLabel } from './BotExtras';

interface Props {
  messages: ChatMessage[];
  mobile: boolean;
  initials: string;
  onFeedback: (id: string, v: 'yes' | 'no') => void;
  onBackToFaq: () => void;
  className?: string;
}

function BotAvatar() {
  return <span className="grid size-7 shrink-0 place-items-center rounded-full bg-ink text-white"><Bot size={13} /></span>;
}

function Text({ text }: { text: string }) {
  return <>{text.split('\n').map((line, i) => <p key={i} className={i ? 'mt-2' : ''}>{line}</p>)}</>;
}

export function MessageList({ messages, mobile, initials, onFeedback, onBackToFaq, className = '' }: Props) {
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => { endRef.current?.scrollIntoView({ block: 'end' }); }, [messages.length]);

  return (
    <div className={`${className}`} role="log" aria-live="polite" aria-label="Conversation">
      {!mobile && <p className="mx-auto mb-5 w-fit rounded-full bg-white/70 px-3 py-1 text-[9px] font-bold uppercase tracking-widest text-muted">Today</p>}
      <div className={mobile ? 'space-y-5' : 'space-y-6'}>
        {messages.map((m) => {
          const time = formatClock(new Date(m.at));
          if (m.role === 'user') {
            return (
              <div key={m.id} className="flex flex-col items-end">
                <div className="flex items-end gap-2">
                  <p className={`max-w-[560px] rounded-2xl rounded-br-md bg-ink px-4 py-3 text-white ${mobile ? 'text-[13px]' : 'text-[13px]'}`}>{m.text}</p>
                  {!mobile && <span className="grid size-7 shrink-0 place-items-center rounded-full bg-deep text-[9px] font-semibold text-white">{initials}</span>}
                </div>
                <p className={`mt-1.5 text-[10px] text-muted ${mobile ? '' : 'mr-9'}`}>{time}{mobile ? '' : ` • ${metaLabel(m)}`}</p>
              </div>
            );
          }
          const handoff = m.botKind === 'handoff';
          return (
            <div key={m.id} className="flex items-start gap-2.5">
              <BotAvatar />
              <div className="min-w-0 max-w-[640px] flex-1">
                <div className={`rounded-2xl rounded-tl-md px-4 py-3.5 text-[13px] leading-6 text-deep ${mobile ? 'bg-white shadow-[0_1px_6px_rgba(9,47,44,0.06)]' : 'bg-mint'} ${handoff && !mobile ? 'w-full' : 'w-fit'}`}>
                  {handoff && !mobile && <HandoffTitle />}
                  <Text text={m.text} />
                  {m.topic && (m.topic === 'save-offline' || m.topic === 'offline-library') && <OfflineExtras mobile={mobile} />}
                  {m.topic === 'support' && <SupportExtras mobile={mobile} />}
                  {handoff && <HandoffExtras mobile={mobile} onBackToFaq={onBackToFaq} />}
                  {m.botKind === 'matched' && (
                    <p className="mt-3 flex items-center justify-end gap-2 text-[10px] text-muted">
                      Was this helpful?
                      {(['yes', 'no'] as const).map((v) => (
                        <button key={v} aria-pressed={m.feedback === v} onClick={() => onFeedback(m.id, v)} className={`font-semibold ${m.feedback === v ? 'text-brand' : 'text-ink/70 hover:text-ink'}`}>{v === 'yes' ? 'Yes' : 'No'}</button>
                      ))}
                    </p>
                  )}
                </div>
                <p className="mt-1.5 text-[10px] text-muted">{time}{mobile ? '' : ` • ${metaLabel(m)}`}</p>
              </div>
            </div>
          );
        })}
      </div>
      <div ref={endRef} />
    </div>
  );
}
