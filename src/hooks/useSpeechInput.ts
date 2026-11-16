import { useCallback, useRef, useState } from 'react';

interface RecognitionResultEvent { results: ArrayLike<ArrayLike<{ transcript: string }>> }
interface Recognition {
  lang: string; interimResults: boolean; maxAlternatives: number;
  onresult: ((e: RecognitionResultEvent) => void) | null;
  onend: (() => void) | null; onerror: (() => void) | null;
  start(): void; stop(): void;
}
type RecognitionCtor = new () => Recognition;

function getCtor(): RecognitionCtor | undefined {
  const w = window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition;
}

/** Dictation into the message field via the browser's Web Speech API (where supported). */
export function useSpeechInput(onText: (text: string) => void) {
  const [listening, setListening] = useState(false);
  const ref = useRef<Recognition | null>(null);
  const supported = typeof window !== 'undefined' && getCtor() !== undefined;

  const toggle = useCallback(() => {
    const Ctor = getCtor();
    if (!Ctor) return;
    if (listening) { ref.current?.stop(); return; }
    const rec = new Ctor();
    rec.lang = navigator.language || 'en-US';
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.onresult = (e) => onText(e.results[0][0].transcript);
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    ref.current = rec;
    setListening(true);
    rec.start();
  }, [listening, onText]);

  return { supported, listening, toggle };
}
