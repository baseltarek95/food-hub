import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useLocation } from 'wouter';
import { ArrowLeft, ArrowRight, Mic, MicOff, Pause, Play, RotateCcw, Sun } from 'lucide-react';
import { BackButton, LoadingState, ErrorState, NotFoundInline } from '@/components/fh';
import { useFoodData, usePageMeta, imgSrc, scaleQty, fmtQty } from '@/lib/food';

type WakeSentinel = { release: () => Promise<void>; addEventListener: (t: 'release', cb: () => void) => void };
type WakeNav = Navigator & { wakeLock?: { request: (t: 'screen') => Promise<WakeSentinel> } };
type SpeechRec = {
  continuous: boolean; interimResults: boolean; lang: string;
  start: () => void; stop: () => void;
  onresult: ((e: { resultIndex: number; results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
};
type SpeechCtor = new () => SpeechRec;

function fmt(s: number) {
  const m = Math.floor(s / 60);
  return `${String(m).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

export default function CookModePage() {
  const [, navigate] = useLocation();
  const { id } = useParams<{ id: string }>();
  const { catalog, isLoading, error, retry } = useFoodData();
  const recipe = catalog?.recipes.find((r) => r.id === id);
  usePageMeta(recipe ? `Cooking ${recipe.title}` : 'Cook mode', 'Step-by-step cook mode with timers.');
  const servings = Number(new URLSearchParams(window.location.search).get('servings')) || recipe?.servings || 1;

  const [step, setStep] = useState(0);
  const [remaining, setRemaining] = useState(0);
  const [running, setRunning] = useState(false);
  const deadline = useRef(0);
  const remainingRef = useRef(remaining);
  remainingRef.current = remaining;
  const [wake, setWake] = useState<'off' | 'on' | 'unsupported' | 'denied'>('off');
  const [voice, setVoice] = useState<'off' | 'listening' | 'unsupported' | 'error'>('off');
  const [heard, setHeard] = useState('');
  const sentinel = useRef<WakeSentinel | null>(null);
  const rec = useRef<SpeechRec | null>(null);
  const total = recipe?.steps.length ?? 0;

  const goNext = useCallback(() => setStep((s) => Math.min(total - 1, s + 1)), [total]);
  const goPrev = useCallback(() => setStep((s) => Math.max(0, s - 1)), []);
  const nextRef = useRef(goNext); nextRef.current = goNext;
  const prevRef = useRef(goPrev); prevRef.current = goPrev;

  useEffect(() => {
    setRunning(false);
    setRemaining(recipe?.steps[step]?.timerSeconds ?? 0);
  }, [step, recipe]);

  useEffect(() => {
    if (!running) return;
    deadline.current = Date.now() + remainingRef.current * 1000;
    const tick = () => {
      const seconds = Math.max(0, Math.ceil((deadline.current - Date.now()) / 1000));
      setRemaining(seconds);
      if (seconds === 0) {
        setRunning(false);
        try { navigator.vibrate?.([200, 100, 200]); } catch { /* ignore */ }
      }
    };
    const t = window.setInterval(tick, 250);
    document.addEventListener('visibilitychange', tick);
    return () => {
      window.clearInterval(t);
      document.removeEventListener('visibilitychange', tick);
    };
  }, [running]);

  const requestWake = useCallback(async () => {
    const nav = navigator as WakeNav;
    if (!nav.wakeLock) { setWake('unsupported'); return; }
    try {
      const s = await nav.wakeLock.request('screen');
      sentinel.current = s;
      setWake('on');
      s.addEventListener('release', () => { if (sentinel.current === s) setWake('off'); });
    } catch { setWake('denied'); }
  }, []);

  useEffect(() => {
    void requestWake();
    const onVis = () => { if (document.visibilityState === 'visible' && sentinel.current) void requestWake(); };
    document.addEventListener('visibilitychange', onVis);
    return () => {
      document.removeEventListener('visibilitychange', onVis);
      void sentinel.current?.release().catch(() => undefined);
      sentinel.current = null;
      const activeRecognition = rec.current;
      rec.current = null;
      activeRecognition?.stop();
    };
  }, [requestWake]);

  const toggleVoice = () => {
    if (voice === 'listening') { rec.current?.stop(); rec.current = null; setVoice('off'); return; }
    const w = window as unknown as { SpeechRecognition?: SpeechCtor; webkitSpeechRecognition?: SpeechCtor };
    const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!Ctor) { setVoice('unsupported'); return; }
    const r = new Ctor();
    r.continuous = true; r.interimResults = false; r.lang = 'en-US';
    r.onresult = (e) => {
      const res = e.results[e.results.length - 1];
      const text = (res?.[0]?.transcript ?? '').toLowerCase().trim();
      setHeard(text);
      if (/\bnext\b/.test(text)) nextRef.current();
      else if (/\b(previous|back)\b/.test(text)) prevRef.current();
    };
    r.onerror = () => { rec.current = null; r.stop(); setVoice('error'); };
    r.onend = () => { if (rec.current === r) { try { r.start(); } catch { setVoice('off'); } } };
    rec.current = r;
    try { r.start(); setVoice('listening'); } catch { setVoice('error'); }
  };

  if (isLoading) return <div className="min-h-[100dvh] bg-[#fbf7ed] p-5"><LoadingState label="Loading cook mode" /></div>;
  if (error || !catalog) return <div className="min-h-[100dvh] bg-[#fbf7ed] p-5"><ErrorState onRetry={retry} /></div>;
  if (!recipe || total === 0) return <div className="min-h-[100dvh] bg-[#fbf7ed] p-5"><NotFoundInline what="Recipe" back="/explore" /></div>;

  const current = recipe.steps[step];
  const wakeText = { on: 'Screen stays on', off: 'Keep screen on', unsupported: 'Screen lock not supported', denied: 'Screen lock blocked' }[wake];
  const voiceText = { off: 'Say "next" or "previous"', listening: 'Listening for "next" / "previous"', unsupported: 'Voice control is not supported in this browser', error: 'Microphone unavailable or blocked' }[voice];

  return (
    <main className="min-h-[100dvh] bg-[#17271e] text-[#fffdf4]">
      <div className="mx-auto flex min-h-[100dvh] max-w-[760px] flex-col px-5 pb-6 pt-4">
        <div className="flex items-center justify-between gap-3">
          <BackButton dark fallback={`/recipes/${recipe.id}`} />
          <div className="text-center">
            <p className="text-[10px] font-extrabold uppercase tracking-[.14em] text-[#c5d5c2]">Cook mode · {servings} people</p>
            <p className="mt-0.5 text-[13px] font-extrabold">{recipe.title}</p>
          </div>
          <button type="button" onClick={() => void requestWake()} disabled={wake === 'on' || wake === 'unsupported'} className="flex items-center gap-1 rounded-full bg-[#2c4032] px-3 py-2 text-[10px] font-bold text-[#d2dfd1] disabled:opacity-80" aria-live="polite" data-testid="button-wake-lock">
            <Sun size={12} /> {wakeText}
          </button>
        </div>
        <div className="mt-4 flex items-center gap-2">
          <span className="rounded-full bg-[#355341] px-3 py-1.5 text-[10px] font-extrabold">STEP {step + 1} OF {total}</span>
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#263b2e]" aria-hidden><div className="h-full rounded-full bg-[#bdceaf] transition-transform" style={{ width: '100%', transform: `translateX(-${100 - ((step + 1) / total) * 100}%)` }} /></div>
        </div>
        <div className="my-5 h-[180px] overflow-hidden rounded-[19px] md:h-[240px]"><img src={imgSrc(recipe.image)} alt={recipe.title} className="h-full w-full object-cover" /></div>
        <h1 aria-live="polite" className="font-display text-[24px] font-extrabold leading-tight tracking-[-.8px] md:text-[30px]">{current.text}</h1>

        {current.timerSeconds > 0 ? (
          <div className="mt-4 rounded-[17px] bg-[#263b2e] p-4">
            <p className="text-[10px] font-extrabold uppercase tracking-[.13em] text-[#c5d6c4]">Step timer</p>
            <p className="mt-1 font-display text-[34px] font-extrabold tabular-nums" role="timer" aria-live={remaining === 0 ? 'assertive' : 'off'} data-testid="text-timer">{remaining === 0 ? 'Done' : fmt(remaining)}</p>
            <div className="mt-2 flex gap-2">
              <button type="button" onClick={() => (remaining === 0 ? setRemaining(current.timerSeconds) : setRunning(!running))} className="flex items-center gap-1 rounded-full bg-[#dfe9d9] px-4 py-2 text-[11px] font-extrabold text-[#315641]" data-testid="button-timer">
                {running ? <><Pause size={12} /> Pause timer</> : <><Play size={12} /> {remaining === 0 ? 'Reset' : remaining < current.timerSeconds ? 'Resume' : 'Start timer'}</>}
              </button>
              <button type="button" onClick={() => { setRunning(false); setRemaining(current.timerSeconds); }} className="flex items-center gap-1 rounded-full border border-white/20 px-4 py-2 text-[11px] font-bold" aria-label="Reset timer"><RotateCcw size={12} /> Reset</button>
            </div>
          </div>
        ) : (
          <p className="mt-4 rounded-[14px] border border-white/10 p-3 text-[11px] text-[#d6dfd2]">No timer for this step. Take your time.</p>
        )}

        <details className="mt-4 rounded-[14px] border border-white/10 p-3 text-[12px] text-[#d6dfd2]">
          <summary className="cursor-pointer font-bold">Ingredients for {servings}</summary>
          <ul className="mt-2 space-y-1">{recipe.ingredients.map((i) => <li key={i.name} className="flex justify-between"><span>{i.name}</span><span>{fmtQty(scaleQty(i.quantity, recipe.servings, servings), i.unit)}</span></li>)}</ul>
        </details>

        <div className="mt-auto pt-6">
          <p className="mb-3 text-center text-[11px] text-[#d3dfd0]" aria-live="polite" data-testid="text-voice-status">
            {voiceText}{heard && voice === 'listening' ? ` · heard "${heard}"` : ''}
          </p>
          <div className="flex items-center justify-between gap-3">
            <button type="button" onClick={goPrev} disabled={step === 0} className="grid h-12 w-12 place-items-center rounded-full bg-[#293d31] disabled:opacity-40" aria-label="Previous step" data-testid="button-prev-step"><ArrowLeft size={16} /></button>
            <button type="button" onClick={toggleVoice} aria-pressed={voice === 'listening'} className="flex items-center gap-2 rounded-full border border-white/15 px-4 py-2.5 text-[11px] text-[#d3dfd0]" data-testid="button-voice">
              {voice === 'listening' ? <><MicOff size={14} /> Stop voice</> : <><Mic size={14} /> Voice control</>}
            </button>
            {step < total - 1 ? (
              <button type="button" onClick={goNext} className="flex items-center gap-2 rounded-full bg-[#e7ebdc] px-5 py-3 text-[12px] font-extrabold text-[#243c2e]" data-testid="button-next-step">Next <ArrowRight size={14} /></button>
            ) : (
              <button type="button" onClick={() => navigate(`/recipes/${recipe.id}`)} className="rounded-full bg-[#e7ebdc] px-5 py-3 text-[12px] font-extrabold text-[#243c2e]" data-testid="button-finish">Finish</button>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
