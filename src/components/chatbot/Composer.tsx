import { Mic, Search, SendHorizontal } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { useSpeechInput } from '../../hooks/useSpeechInput';

export function DesktopComposer({ onSend }: { onSend: (t: string) => void }) {
  const [value, setValue] = useState('');
  const submit = (e: FormEvent) => { e.preventDefault(); if (!value.trim()) return; onSend(value); setValue(''); };
  return (
    <form onSubmit={submit} className="border-t border-line bg-white px-5 pb-3 pt-4">
      <div className="flex items-center gap-3 rounded-full bg-mint py-1.5 pl-4 pr-1.5">
        <Search size={14} className="text-muted" />
        <input aria-label="Your question" value={value} onChange={(e) => setValue(e.target.value)} placeholder="Type your question (e.g. offline reading, bookmarks, account)..." className="w-full bg-transparent text-xs outline-none placeholder:text-muted" />
        <button type="submit" disabled={!value.trim()} className="flex items-center gap-1.5 rounded-full bg-ink px-5 py-2.5 text-xs font-semibold text-white disabled:opacity-60">Send <SendHorizontal size={12} /></button>
      </div>
      <div className="mt-2.5 flex justify-between text-[10px] text-muted">
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
        <input aria-label="Your question" value={value} onChange={(e) => setValue(e.target.value)} placeholder="Type your question…" className="w-full bg-transparent text-[13px] outline-none placeholder:text-muted" />
        <button type="button" onClick={speech.toggle} disabled={!speech.supported} aria-label={speech.supported ? 'Use voice input' : 'Voice input is not supported in this browser'} aria-pressed={speech.listening} className={`grid size-8 place-items-center ${speech.listening ? 'text-brand' : 'text-muted'} disabled:opacity-40`}><Mic size={16} /></button>
        <button type="submit" aria-label="Send" disabled={!value.trim()} className="grid size-10 place-items-center rounded-full bg-ink text-white disabled:opacity-60"><SendHorizontal size={16} /></button>
      </div>
      <p className="mt-2 flex items-center justify-center gap-1.5 text-[10px] text-muted"><i className="size-1.5 rounded-full bg-brand" />Automated library helper • Instant answers</p>
    </form>
  );
}
