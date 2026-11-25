/**
 * Briques communes à la session du jour et aux micro-leçons : en-tête avec barre de
 * progression, carte de phrase, note de prononciation, étapes d'écoute et de pratique orale.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowRight,
  AudioLines,
  Check,
  CheckCircle2,
  ChevronDown,
  Lightbulb,
  Mic,
  MicOff,
  Play,
  Repeat,
  RotateCcw,
  SkipForward,
  Square,
  VolumeX,
  X,
} from 'lucide-react';
import type { LessonPhrase } from '@/data/lessons';
import { markStyle, MARK_ORDER } from '@/lib/highlights';
import { analyzeWolof } from '@/lib/wolofOrthography';
import type { SpeakingResult } from '@/lib/progress';
import { resolveReference } from '@/lib/audio';
import { playReference } from '@/lib/referencePlayback';
import { HighlightedPhrase } from '@/components/HighlightedPhrase';
import { WaveProgress } from '@/components/WaveProgress';
import { ListenButtons } from '@/components/AudioButtons';
import type { useAudioPlayer } from '@/hooks/useAudioPlayer';
import type { useRecorder } from '@/hooks/useRecorder';

type Player = ReturnType<typeof useAudioPlayer>;
type Recorder = ReturnType<typeof useRecorder>;

/** Barre du haut : quitter, progression continue, accès aux sons. */
export function LessonHeader({
  pct,
  label,
  onQuit,
  quitLabel = 'Quitter',
  onOpenGlossary,
}: {
  pct: number;
  label: string;
  onQuit: () => void;
  quitLabel?: string;
  onOpenGlossary: () => void;
}) {
  return (
    <header className="sticky top-0 z-20 bg-cream/90 backdrop-blur-md">
      <div className="mx-auto max-w-xl px-4 pt-4 pb-3">
        <div className="flex items-center gap-3">
          <button
            onClick={onQuit}
            aria-label={quitLabel}
            className="w-10 h-10 -ml-1 rounded-full flex items-center justify-center text-ink-400 hover:text-ink-800 hover:bg-cream-200 transition-colors tap-highlight-none"
          >
            <X className="w-6 h-6" strokeWidth={2.5} />
          </button>
          <div
            className="flex-1 h-4 rounded-full bg-cream-300/70 overflow-hidden"
            role="progressbar"
            aria-label="Progression"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={pct}
          >
            <div
              className="relative h-full rounded-full bg-emerald-500 transition-[width] duration-500 ease-out"
              style={{ width: `${Math.max(pct, 4)}%` }}
            >
              <span className="absolute inset-x-2 top-1 h-1 rounded-full bg-white/35" />
            </div>
          </div>
          <button
            onClick={onOpenGlossary}
            aria-label="Ouvrir Sons & Repères"
            className="w-10 h-10 -mr-1 rounded-full flex items-center justify-center text-ink-400 hover:text-emerald-700 hover:bg-cream-200 transition-colors tap-highlight-none"
          >
            <AudioLines className="w-5 h-5" />
          </button>
        </div>
        <p className="text-center text-xs font-bold text-ink-400 mt-2">
          {label}
        </p>
      </div>
    </header>
  );
}

export function Footer({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed bottom-0 inset-x-0 z-20 bg-gradient-to-t from-cream via-cream to-cream/0 pt-8 pb-safe">
      <div className="mx-auto max-w-xl px-4">{children}</div>
    </div>
  );
}

/** La phrase au centre de l'écran : wolof en grand, français dessous. */
export function PhraseHero({
  phrase: p,
  badge,
  aside,
  compact = false,
}: {
  phrase: LessonPhrase;
  badge?: React.ReactNode;
  aside?: React.ReactNode;
  compact?: boolean;
}) {
  const kinds = useMemo(() => {
    const present = new Set(analyzeWolof(p.wolof).map((f) => f.kind));
    return MARK_ORDER.filter((k) => present.has(k));
  }, [p.wolof]);

  return (
    <div className="text-center">
      <div className="flex items-center justify-center gap-2 flex-wrap">
        {badge}
        {aside}
      </div>
      <p className={`text-ink-500 leading-relaxed max-w-md mx-auto ${compact ? 'text-xs mt-3' : 'text-[13px] mt-4'}`}>{p.situation}</p>
      <p
        lang="wo"
        className={`font-display font-semibold text-ink-900 leading-[1.2] break-words ${
          compact ? 'text-[1.9rem] sm:text-[2.4rem] mt-3' : 'text-[2.1rem] sm:text-[2.6rem] mt-4'
        }`}
      >
        <HighlightedPhrase text={p.wolof} />
      </p>
      <p className={`text-ink-600 font-medium leading-snug ${compact ? 'text-base mt-2' : 'text-lg mt-3'}`}>{p.french}</p>
      {p.literal && <p className="text-sm text-ink-400 mt-1 italic">Littéralement : {p.literal}</p>}
      {kinds.length > 0 && (
        <div className={`flex flex-wrap justify-center gap-1.5 ${compact ? 'mt-3' : 'mt-4'}`}>
          {kinds.map((k) => (
            <span key={k} className={`text-[11px] font-bold ${markStyle[k].className}`}>
              {markStyle[k].label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export function PronunciationNote({ phrase, defaultOpen }: { phrase: LessonPhrase; defaultOpen: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-2xl bg-ochre-50 ring-1 ring-ochre-200/70">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="w-full flex items-center gap-2 px-4 py-3 text-sm font-bold text-ochre-800 tap-highlight-none"
      >
        <Lightbulb className="w-4 h-4" />
        Note de prononciation
        <ChevronDown className={`w-4 h-4 ml-auto transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <p className="px-4 pb-4 -mt-0.5 text-sm text-ink-700 leading-relaxed text-left animate-fadeIn">{phrase.pronunciationNote}</p>}
    </div>
  );
}

// ───────────────────────────── Écoute ─────────────────────────────

export function ListenStep({
  phrase,
  badge,
  player,
  slowFirst,
  target,
  count,
  onListen,
  onNext,
  isLast,
  lastLabel = 'Passer à la suite',
}: {
  phrase: LessonPhrase;
  badge?: React.ReactNode;
  player: Player;
  slowFirst: boolean;
  target: number;
  count: number;
  onListen: (phraseId: string) => void;
  onNext: () => void;
  isLast: boolean;
  lastLabel?: string;
}) {
  const src = resolveReference(phrase);
  const hasAudio = !!(src.normal || src.slow);
  const reached = count >= target;

  return (
    <div className="animate-fadeSoft">
      <article className="card px-5 py-7 sm:px-8 sm:py-9 space-y-6">
        <PhraseHero
          phrase={phrase}
          badge={badge}
          aside={
            hasAudio && (
              <span
                className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full ${
                  reached ? 'bg-emerald-100 text-emerald-800' : 'bg-cream-200 text-ink-500'
                }`}
              >
                {reached && <Check className="w-3 h-3" strokeWidth={3} />}
                {Math.min(count, target)}/{target} écoute{target > 1 ? 's' : ''}
              </span>
            )
          }
        />
        <ListenButtons phrase={phrase} player={player} slowFirst={slowFirst} onPlay={() => onListen(phrase.id)} />
        <PronunciationNote phrase={phrase} defaultOpen />
      </article>

      <Footer>
        {hasAudio && !reached && (
          <p className="text-center text-xs font-semibold text-ink-500 mb-2.5">
            {slowFirst ? 'Commence par la lecture lente. ' : ''}Conseil : {target} écoute{target > 1 ? 's' : ''} avant de continuer.
          </p>
        )}
        <button onClick={onNext} className="btn-primary w-full">
          {isLast ? lastLabel : 'Continuer'}
          <ArrowRight className="w-5 h-5" />
        </button>
      </Footer>
    </div>
  );
}

// ───────────────────────────── Pratique à voix haute ─────────────────────────────

type CompareStep = 'reference' | 'voice' | null;

export function SpeakStep({
  phrase,
  badge,
  player,
  recorder,
  isSecondPass,
  onEval,
  onNext,
  isLast,
  lastLabel = 'Voir le récapitulatif',
  prompt = 'wolof',
  aside,
}: {
  phrase: LessonPhrase;
  badge?: React.ReactNode;
  player: Player;
  recorder: Recorder;
  isSecondPass: boolean;
  onEval: (phraseId: string, r: SpeakingResult) => void;
  onNext: () => void;
  isLast: boolean;
  lastLabel?: string;
  /**
   * « french » : seul le français s'affiche ; on dit la phrase en wolof au micro, puis la
   * réponse (wolof, audio, note) est révélée et rejouée avant ta voix pour comparer.
   */
  prompt?: 'wolof' | 'french';
  /** pastille supplémentaire à côté du badge */
  aside?: React.ReactNode;
}) {
  const refs = resolveReference(phrase);
  const [peeked, setPeeked] = useState(false);
  const [hasReplayed, setHasReplayed] = useState(false);
  const [compareStep, setCompareStep] = useState<CompareStep>(null);
  const [verdict, setVerdict] = useState<SpeakingResult | null>(null);
  const autoCompareRef = useRef(false);

  const { stopPlayback, playRecording } = recorder;
  const playVoice = useCallback(() => {
    setCompareStep('voice');
    playRecording(() => {
      setCompareStep(null);
      setHasReplayed(true);
    });
  }, [playRecording]);

  // Modèle natif puis ta voix ; sans fichier natif, ta voix seule (rien n'est simulé)
  const runCompare = useCallback(() => {
    stopPlayback();
    setCompareStep('reference');
    const started = playReference(player, phrase, 'normal', () => playVoice());
    if (!started) playVoice();
  }, [stopPlayback, player, phrase, playVoice]);

  // Juste après l'enregistrement : référence, puis ta voix, automatiquement
  useEffect(() => {
    if (autoCompareRef.current && recorder.hasRecording && !recorder.isRecording) {
      autoCompareRef.current = false;
      runCompare();
    }
  }, [recorder.hasRecording, recorder.isRecording, runCompare]);

  const handleRecord = async () => {
    if (recorder.isRecording) {
      recorder.stopRecording();
      return;
    }
    player.stop();
    recorder.stopPlayback();
    setCompareStep(null);
    setHasReplayed(false);
    autoCompareRef.current = true;
    await recorder.startRecording();
  };

  const replayVoice = () => {
    player.stop();
    playVoice();
  };

  const evaluate = (r: SpeakingResult) => {
    player.stop();
    recorder.stopPlayback();
    setCompareStep(null);
    setVerdict(r);
    onEval(phrase.id, r);
  };

  const busy = recorder.isRecording || recorder.isRequesting || compareStep !== null;
  const canEval = hasReplayed && compareStep === null && !recorder.isRecording && !verdict;
  const revealed = prompt === 'wolof' || peeked || !!verdict || (recorder.hasRecording && !recorder.isRecording);

  return (
    <div className="animate-fadeSoft">
      <article className="card px-5 py-6 sm:px-8 sm:py-8 space-y-5">
        {revealed ? (
          <PhraseHero
            phrase={phrase}
            badge={badge}
            compact
            aside={
              <>
                {aside}
                {isSecondPass && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-terra-100 text-terra-800">
                    <Repeat className="w-3 h-3" /> Second passage
                  </span>
                )}
              </>
            }
          />
        ) : (
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 flex-wrap">
              {badge}
              {aside}
            </div>
            <p className="text-xs text-ink-500 leading-relaxed max-w-md mx-auto mt-3">{phrase.situation}</p>
            <p className="eyebrow mt-4">Dis-le en wolof</p>
            <p className="text-2xl sm:text-[1.7rem] font-bold text-ink-900 leading-snug mt-2">« {phrase.french} »</p>
          </div>
        )}

        <div className="space-y-3">
          {revealed && <ListenButtons phrase={phrase} player={player} disabled={busy || !!verdict} compact />}

          {/* Micro : s'enregistrer, puis réécouter sa voix */}
          <button
            onClick={handleRecord}
            disabled={recorder.isRequesting || compareStep !== null || !!verdict}
            aria-label={recorder.isRecording ? 'Arrêter l\'enregistrement' : 'M\'enregistrer'}
            className={`relative w-full h-16 rounded-2xl flex items-center justify-center gap-3 text-base font-extrabold transition-all tap-highlight-none select-none
              active:translate-y-[4px] active:shadow-none disabled:opacity-50 disabled:cursor-not-allowed disabled:active:translate-y-0 ${
                recorder.isRecording
                  ? 'bg-terra-500 text-white shadow-[0_4px_0_0_theme(colors.terra.700)]'
                  : 'bg-emerald-600 text-white shadow-press hover:bg-emerald-500'
              }`}
          >
            <span className="relative w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              {recorder.isRecording && <span className="absolute inset-0 rounded-full bg-white/40 animate-pulseRing" />}
              {recorder.isRecording ? <Square className="w-5 h-5 relative" fill="currentColor" /> : <Mic className="w-6 h-6 relative" />}
            </span>
            {recorder.isRequesting
              ? 'Autorise le micro…'
              : recorder.isRecording
                ? 'Arrêter'
                : recorder.hasRecording
                  ? 'Me réenregistrer'
                  : prompt === 'french'
                    ? 'Le dire en wolof'
                    : 'M\'enregistrer'}
          </button>
          {!revealed && !recorder.isRecording && !recorder.isRequesting && (
            <button
              onClick={() => setPeeked(true)}
              className="w-full py-1.5 text-xs font-bold text-ink-400 hover:text-ink-700 tap-highlight-none"
            >
              Je ne sais pas : voir la réponse
            </button>
          )}
          <p className="sr-only" aria-live="polite">
            {recorder.isRecording ? 'Enregistrement en cours' : recorder.hasRecording ? 'Enregistrement terminé' : ''}
          </p>

          {recorder.isRecording && <WaveProgress progress={recorder.progress} active bars={30} className="h-6" />}

          {recorder.isSimulated && (recorder.isRecording || recorder.hasRecording) && (
            <div className="flex items-start gap-2 rounded-2xl bg-cream-100 p-3 text-xs text-ink-500">
              <MicOff className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <p>Micro indisponible ou refusé : l'enregistrement est simulé et la réécoute sera muette. Prononce quand même la phrase à voix haute.</p>
            </div>
          )}

          {recorder.hasRecording && !recorder.isRecording && (
            <div className="space-y-3 animate-fadeIn">
              {/* Où en est la comparaison */}
              <div className="flex items-center justify-center gap-2 text-xs font-bold">
                <span
                  className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 transition-colors ${
                    compareStep === 'reference'
                      ? 'bg-emerald-600 text-white'
                      : refs.normal
                        ? 'bg-cream-100 text-ink-500'
                        : 'bg-cream-100 text-ink-300 line-through'
                  }`}
                  title={refs.normal ? undefined : 'Audio natif pas encore enregistré'}
                >
                  {refs.normal ? <Play className="w-3 h-3" /> : <VolumeX className="w-3 h-3" />} 1. Modèle
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-ink-300" />
                <span
                  className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 transition-colors ${
                    compareStep === 'voice' ? 'bg-ochre-400 text-ink-900' : 'bg-cream-100 text-ink-500'
                  }`}
                >
                  <Mic className="w-3 h-3" /> 2. Ta voix
                </span>
              </div>
              {compareStep === 'voice' && <WaveProgress progress={recorder.progress} active bars={30} className="h-5" />}
              {!refs.normal && !refs.checking && (
                <p className="text-xs text-ink-500 text-center leading-relaxed">
                  Pas encore de référence native : seule ta voix est rejouée. Compare-la à la note de prononciation.
                </p>
              )}
              <div className="grid grid-cols-2 gap-3">
                <button onClick={runCompare} disabled={compareStep !== null || !!verdict} className="btn-soft py-3 text-sm">
                  <Repeat className="w-4 h-4" />
                  {refs.normal ? 'Comparer' : 'Réécouter'}
                </button>
                <button onClick={replayVoice} disabled={compareStep !== null || !!verdict} className="btn-soft py-3 text-sm">
                  <Play className="w-4 h-4" />
                  Ma voix
                </button>
              </div>
            </div>
          )}
        </div>

        {revealed && <PronunciationNote phrase={phrase} defaultOpen={false} />}
      </article>

      <Footer>
        {verdict ? (
          <div
            role="status"
            className={`-mx-4 px-4 pt-4 pb-1 rounded-t-[1.75rem] animate-slideUp ${verdict === 'mastered' ? 'bg-emerald-50' : 'bg-ochre-50'}`}
          >
            <div className="flex items-center gap-3">
              <span
                className={`w-11 h-11 rounded-full flex items-center justify-center animate-pop ${
                  verdict === 'mastered' ? 'bg-emerald-600 text-white' : 'bg-ochre-400 text-ink-900'
                }`}
              >
                {verdict === 'mastered' ? <Check className="w-6 h-6" strokeWidth={3} /> : <RotateCcw className="w-5 h-5" strokeWidth={2.5} />}
              </span>
              <div>
                <p className={`font-extrabold text-lg leading-tight ${verdict === 'mastered' ? 'text-emerald-800' : 'text-ochre-800'}`}>
                  {verdict === 'mastered' ? 'Maîtrisée, bravo !' : 'À revoir, c\'est noté'}
                </p>
                <p className="text-xs text-ink-600 mt-0.5">
                  {verdict === 'mastered' ? 'Elle reviendra en révision espacée pour bien s\'ancrer.' : 'Elle reviendra dès demain en début de session.'}
                </p>
              </div>
            </div>
            <button onClick={onNext} className={`${verdict === 'mastered' ? 'btn-primary' : 'btn-ochre'} w-full mt-4 mb-3`}>
              {isLast ? lastLabel : 'Continuer'}
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <div className="space-y-2.5">
            <p className="text-center text-xs font-semibold text-ink-500">
              {canEval
                ? 'Comment évalues-tu ta production ?'
                : recorder.hasRecording
                  ? 'Réécoute-toi après le modèle pour pouvoir t\'évaluer.'
                  : 'Enregistre-toi pour pouvoir t\'évaluer.'}
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => evaluate('review')} disabled={!canEval} className="btn-ochre">
                <RotateCcw className="w-5 h-5" />À revoir
              </button>
              <button onClick={() => evaluate('mastered')} disabled={!canEval} className="btn-primary">
                <CheckCircle2 className="w-5 h-5" />
                Maîtrisée
              </button>
            </div>
            <button
              onClick={onNext}
              disabled={busy}
              className="w-full flex items-center justify-center gap-1.5 py-1.5 text-xs font-bold text-ink-400 hover:text-ink-700 disabled:opacity-40 tap-highlight-none"
            >
              <SkipForward className="w-3.5 h-3.5" />
              Passer cette phrase
            </button>
          </div>
        )}
      </Footer>
    </div>
  );
}

