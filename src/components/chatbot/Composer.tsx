import { Mic, Search, SendHorizontal } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Button } from '../shared';
import { useSpeechInput } from '../../hooks/useSpeechInput';

export function DesktopComposer({ onSend }: { onSend: (t: string) => void }) {
  const [value, setValue] = useState('');
  const submit = (e: FormEvent) => { e.preventDefault(); if (!value.trim()) return; onSend(value); setValue(''); };
  return (
    <form onSubmit={submit} className="border-t border-line bg-white px-5 pb-3 pt-4">
      <div className="flex items-center gap-3 rounded-full bg-mint py-1.5 pl-4 pr-1.5">
        <Search size={14} className="text-muted" />
        <input aria-label="Your question" value={value} onChange={(e) => setValue(e.target.value)} placeholder="Type your question (e.g. offline reading, bookmarks, account)..." className="w-full bg-transparent text-[16px] outline-none placeholder:text-muted" />
        <Button type="submit" shape="pill" disabled={!value.trim()} rightIcon={<SendHorizontal size={13} />}>Send</Button>
      </div>
      <div className="mt-2.5 flex justify-between text-[13px] text-muted">
        <span><kbd className="rounded border border-line px-1 font-sans">Enter ⏎</kbd> to send • Instant match for keywords</span>
        <span>Use suggested questions on the left for fastest resolution</span>
      </div>
    </form>
  );
}

export function MobileComposer({ onSend }: { onSend: (t: string) => void }) {
  const [value, setValue] = useState('');
  const speech = useSpeechInput((t) => setValue((v) => (v ? `${v} ${t}` : t)));
  const submit = (e: FormEvent) => { e.preventDefault(); if (!value.trim()) return; onSend(value); setValue(''); };
  return (
    <form onSubmit={submit} className="bg-white px-4 pb-2 pt-3">
      <div className="flex items-center gap-2 rounded-full border border-line bg-white py-1.5 pl-4 pr-1.5">
        <input aria-label="Your question" value={value} onChange={(e) => setValue(e.target.value)} placeholder="Type your question…" className="w-full bg-transparent text-[16px] outline-none placeholder:text-muted" />
        <Button type="button" variant="icon" size="sm" shape="pill" onClick={speech.toggle} disabled={!speech.supported} aria-label={speech.supported ? 'Use voice input' : 'Voice input is not supported in this browser'} aria-pressed={speech.listening} className={speech.listening ? '!text-brand' : ''}><Mic size={16} /></Button>
        <Button type="submit" variant="icon" filled shape="pill" aria-label="Send" disabled={!value.trim()}><SendHorizontal size={16} /></Button>
      </div>
      <p className="mt-2 flex items-center justify-center gap-1.5 text-[13px] text-muted"><i className="size-1.5 rounded-full bg-brand" />Automated library helper • Instant answers</p>
    </form>
  );
}
