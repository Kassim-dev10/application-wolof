import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  Play,
  Headphones,
  Volume2,
  Volume1,
  Check,
  RotateCcw,
  Mic,
  Square,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  BookOpen,
  Circle,
  Repeat,
  MicOff,
  Flame,
  VolumeX,
} from 'lucide-react';
import type { Lesson } from '@/data/lessons';
import { markStyle, MARK_ORDER } from '@/lib/highlights';
import { analyzeWolof } from '@/lib/wolofOrthography';
import {
  computeStreak,
  dateKey,
  describeNextReview,
  type ProgressState,
  type SpeakingResult,
} from '@/lib/progress';
import {
  PLANNED_KIND_LABEL,
  type DurationProfile,
  type PhaseKind,
  type PlannedPhrase,
  type SessionPlan,
} from '@/lib/sessionPlan';
import type { SessionSummaryInput } from '@/hooks/useProgress';
import { HighlightedPhrase } from '@/components/HighlightedPhrase';
import { WaveProgress } from '@/components/WaveProgress';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import { useAudioAvailability } from '@/hooks/useAudioAvailability';
import { resolveReference } from '@/lib/audio';
import { playReference } from '@/lib/referencePlayback';
import { ReferenceAudio } from '@/components/ReferenceAudio';
import { useRecorder } from '@/hooks/useRecorder';

interface Props {
  plan: SessionPlan;
  progress: ProgressState;
  /** auto-évaluation d'une phrase : enregistrée aussitôt dans la progression */
  onResult: (phraseId: string, result: SpeakingResult) => void;
  /** appelé une seule fois, à l'arrivée sur le récapitulatif */
  onComplete: (summary: SessionSummaryInput) => void;
  onExit: () => void;
  onOpenGlossary: () => void;
}

type Results = Record<string, SpeakingResult>;

const PHASE_NAMES: Record<PhaseKind, string> = {
  listen: 'Son & Orthographe',
  assembly: 'Assemblage oral',
  speak: 'Pratique à voix haute',
  recap: 'Récapitulatif',
};

const RESULT_LABEL: Record<SpeakingResult, string> = {
  mastered: 'Maîtrisée',
  review: 'À revoir',
};

const KIND_BADGE: Record<PlannedPhrase['kind'], string> = {
  review: 'bg-sky-100 text-sky-700',
  new: 'bg-sand-100 text-sand-800',
  consolidation: 'bg-ink-100 text-ink-600',
};

export function SessionScreen({ plan, progress, onResult, onComplete, onExit, onOpenGlossary }: Props) {
  const [phaseIdx, setPhaseIdx] = useState(0);
  const [results, setResults] = useState<Results>({});
  const completedRef = useRef(false);

  const phase = plan.phases[phaseIdx];
  const isLast = phaseIdx === plan.phases.length - 1;

  const goNext = useCallback(() => {
    setPhaseIdx((i) => Math.min(i + 1, plan.phases.length - 1));
    window.scrollTo(0, 0);
  }, [plan.phases.length]);

  const handleResult = useCallback(
    (phraseId: string, r: SpeakingResult) => {
      setResults((prev) => ({ ...prev, [phraseId]: r }));
      onResult(phraseId, r);
    },
    [onResult],
  );

  // Arrivée sur le récapitulatif : la session est enregistrée dans l'historique
  useEffect(() => {
    if (phase !== 'recap' || completedRef.current) return;
    completedRef.current = true;
    const values = Object.values(results);
    onComplete({
      lessonId: plan.lesson.id,
      duration: plan.duration,
      practiced: values.length,
      mastered: values.filter((r) => r === 'mastered').length,
      review: values.filter((r) => r === 'review').length,
    });
  }, [phase, results, onComplete, plan.lesson.id, plan.duration]);

  return (
    <div className="min-h-screen bg-ink-50 flex flex-col">
      {/* Top bar */}
      <header className="sticky top-0 z-20 bg-ink-50/90 backdrop-blur-md border-b border-ink-100">
        <div className="px-4 pt-4 pb-3">
          <div className="flex items-center justify-between gap-3">
            <button
              onClick={onExit}
              className="flex items-center gap-1.5 text-ink-600 hover:text-ink-900 transition-colors tap-highlight-none"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="text-sm">Accueil</span>
            </button>
            <span className="text-[11px] text-ink-400 uppercase tracking-widest text-right">
              {plan.duration} min · {plan.profile.label} · Leçon {plan.lesson.order}
            </span>
          </div>

          {/* Phase progress */}
          <div className="flex items-center gap-1.5 mt-3">
            {plan.phases.map((p, i) => (
              <div
                key={p}
                className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                  phaseIdx >= i ? 'bg-terra-500' : 'bg-ink-200'
                }`}
              />
            ))}
          </div>
          <div className="flex items-center justify-between mt-2">
            <span className="text-sm font-semibold text-ink-800">
              Phase {phaseIdx + 1} · {PHASE_NAMES[phase]}
            </span>
          </div>
        </div>
      </header>

      <main className="flex-1 px-4 py-5 pb-24">
        <div key={phase} className="animate-fadeIn">
          {phase === 'listen' && <Phase1Listening plan={plan} />}
          {phase === 'assembly' && <Phase2Assembly lesson={plan.lesson} />}
          {phase === 'speak' && <Phase3Speaking plan={plan} onResult={handleResult} />}
          {phase === 'recap' && (
            <Phase4Recap
              plan={plan}
              results={results}
              progress={progress}
              onOpenGlossary={onOpenGlossary}
              onFinish={onExit}
            />
          )}
        </div>
      </main>

      {/* Bottom nav (hidden on recap) */}
      {!isLast && (
        <div className="sticky bottom-0 bg-gradient-to-t from-ink-50 via-ink-50/95 to-transparent pt-6 pb-[max(1rem,env(safe-area-inset-bottom))] px-4">
          <button
            onClick={goNext}
            className="w-full bg-ink-900 hover:bg-ink-800 active:scale-[0.98] text-ink-50 rounded-2xl py-4 flex items-center justify-center gap-2.5 shadow-lift transition-all tap-highlight-none"
          >
            <span className="font-semibold text-[15px]">
              {plan.phases[phaseIdx + 1] === 'recap' ? 'Voir le récapitulatif' : 'Phase suivante'}
            </span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
}

function KindBadge({ item, lesson }: { item: PlannedPhrase; lesson: Lesson }) {
  const otherLesson = item.kind === 'review' && item.lessonId !== lesson.id;
  return (
    <span className={`inline-flex text-[10px] font-medium uppercase tracking-wide px-2 py-0.5 rounded-full ${KIND_BADGE[item.kind]}`}>
      {PLANNED_KIND_LABEL[item.kind]}
      {otherLesson ? ` · ${item.lessonTitle}` : ''}
    </span>
  );
}

function PlanSummary({ plan }: { plan: SessionPlan }) {
  const count = (k: PlannedPhrase['kind']) => plan.phrases.filter((p) => p.kind === k).length;
  const parts = [
    count('review') && `${count('review')} révision${count('review') > 1 ? 's' : ''}`,
    count('new') && `${count('new')} nouvelle${count('new') > 1 ? 's' : ''}`,
    count('consolidation') && `${count('consolidation')} en consolidation`,
  ].filter(Boolean);
  return <>{parts.join(' · ')}</>;
}

// ───────────────────────────── Phase 1 ─────────────────────────────

function Phase1Listening({ plan }: { plan: SessionPlan }) {
  const { profile } = plan;
  const [listens, setListens] = useState<Record<string, number>>({});
  const player = useAudioPlayer();
  useAudioAvailability(plan.phrases.flatMap((p) => [p.phrase.audioUrl, p.phrase.slowAudioUrl]));

  const presentKinds = useMemo(() => {
    const kinds = new Set(plan.phrases.flatMap((p) => analyzeWolof(p.phrase.wolof).map((f) => f.kind)));
    return MARK_ORDER.filter((k) => kinds.has(k));
  }, [plan.phrases]);

  const sources = plan.phrases.map((p) => resolveReference(p.phrase));
  const checking = sources.some((s) => s.checking);
  const withAudio = plan.phrases.filter((_, i) => sources[i].normal || sources[i].slow);
  const done = withAudio.filter((p) => (listens[p.phrase.id] ?? 0) >= profile.listenTarget).length;

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3 bg-white rounded-2xl p-4">
        <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-sand-100 flex items-center justify-center">
          <Headphones className="w-5 h-5 text-sand-700" />
        </div>
        <div>
          <h3 className="font-semibold text-ink-900 text-[15px]">Écoute et repérage</h3>
          <p className="text-sm text-ink-500 mt-0.5 leading-relaxed">{profile.pace}</p>
          <p className="text-xs text-ink-400 mt-1.5">
            <PlanSummary plan={plan} />
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 text-xs">
        {presentKinds.map((m) => (
          <span key={m} className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full ${markStyle[m].className}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-current opacity-60" />
            {markStyle[m].label}
          </span>
        ))}
      </div>

      {!checking && withAudio.length === 0 ? (
        <div className="flex items-start gap-2.5 bg-white ring-1 ring-ink-100 rounded-2xl p-4 text-sm text-ink-600">
          <VolumeX className="w-5 h-5 flex-shrink-0 text-ink-400" />
          <p className="leading-relaxed">
            Les enregistrements natifs de ces phrases ne sont pas encore disponibles. Lis chaque phrase à voix haute en suivant la note
            de prononciation et les sons surlignés : aucune voix de synthèse ne remplace un locuteur.
          </p>
        </div>
      ) : (
        <p className="text-xs text-ink-500 px-1">
          {profile.slowFirst ? 'Commence chaque phrase en lecture lente, puis passe à la lecture normale. ' : ''}
          Objectif : {profile.listenTarget} écoute{profile.listenTarget > 1 ? 's' : ''} par phrase
          {checking ? '' : ` · ${done}/${withAudio.length} atteint${done > 1 ? 's' : ''}`}
          {!checking && withAudio.length < plan.phrases.length
            ? ` · ${plan.phrases.length - withAudio.length} phrase${plan.phrases.length - withAudio.length > 1 ? 's' : ''} sans audio natif pour l'instant`
            : ''}
          .
        </p>
      )}

      <div className="space-y-3">
        {plan.phrases.map((item) => {
          const p = item.phrase;
          const src = sources[plan.phrases.indexOf(item)];
          const hasAudio = !!(src.normal || src.slow);
          const count = listens[p.id] ?? 0;
          const reached = count >= profile.listenTarget;
          return (
            <article key={p.id} className="bg-white rounded-3xl shadow-soft p-5">
              <div className="mb-3 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <KindBadge item={item} lesson={plan.lesson} />
                  {hasAudio && (
                    <span className={`text-[11px] flex items-center gap-1 ${reached ? 'text-leaf-700' : 'text-ink-400'}`}>
                      {reached && <Check className="w-3.5 h-3.5" />}
                      {Math.min(count, profile.listenTarget)}/{profile.listenTarget} écoute{profile.listenTarget > 1 ? 's' : ''}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-ink-400 uppercase tracking-wide leading-relaxed">{p.situation}</p>
                <p className="font-display text-2xl text-ink-900 mt-1.5 leading-snug">
                  <HighlightedPhrase text={p.wolof} />
                </p>
                <p className="text-sm text-ink-700 mt-1">{p.french}</p>
                {p.literal && <p className="text-xs text-ink-400 mt-0.5 italic">Littéralement : {p.literal}</p>}
              </div>

              <ReferenceAudio
                phrase={p}
                player={player}
                slowFirst={profile.slowFirst}
                onPlay={() => setListens((l) => ({ ...l, [p.id]: (l[p.id] ?? 0) + 1 }))}
              />

              <div className="mt-4 flex items-start gap-2 bg-sand-50 rounded-xl p-3 ring-1 ring-sand-100">
                <Volume2 className="w-4 h-4 text-sand-700 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-ink-600 leading-relaxed">{p.pronunciationNote}</p>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

// ───────────────────────────── Phase 2 ─────────────────────────────

/** Mélange déterministe : l'ordre proposé ne doit jamais être déjà la bonne réponse. */
function shuffledSteps(steps: string[]): string[] {
  const hash = (s: string) => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);
  const out = [...steps].sort((a, b) => hash(a) - hash(b));
  if (out.join() === steps.join() && out.length > 1) out.push(out.shift()!);
  return out;
}

function Phase2Assembly({ lesson }: { lesson: Lesson }) {
  const task = lesson.assembly;
  const [selected, setSelected] = useState<string[]>([]);
  const [checked, setChecked] = useState(false);

  const phraseById = useMemo(() => new Map(lesson.phrases.map((p) => [p.id, p])), [lesson.phrases]);
  const bank = useMemo(() => (task ? shuffledSteps(task.steps) : []), [task]);

  if (!task) {
    return (
      <div className="bg-white rounded-3xl shadow-soft p-5 text-sm text-ink-500">
        Pas d'exercice d'assemblage pour cette leçon. Passe directement à la pratique à voix haute.
      </div>
    );
  }

  const isCorrect = checked && selected.join(',') === task.steps.join(',');
  const fullWolof = task.steps.map((id) => phraseById.get(id)?.wolof).join(' ');
  const fullFrench = task.steps.map((id) => phraseById.get(id)?.french).join(' ');

  const toggle = (id: string) => {
    if (checked) return;
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3 bg-white rounded-2xl p-4">
        <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-terra-100 flex items-center justify-center">
          <Volume1 className="w-5 h-5 text-terra-700" />
        </div>
        <div>
          <h3 className="font-semibold text-ink-900 text-[15px]">Construis ta réponse</h3>
          <p className="text-sm text-ink-500 mt-0.5 leading-relaxed">{task.prompt}</p>
        </div>
      </div>

      <div className="bg-ink-900 text-ink-50 rounded-3xl p-5">
        <p className="text-[11px] uppercase tracking-widest text-ink-400 mb-1.5">Situation</p>
        <p className="font-display text-xl leading-snug">{task.situation}</p>
        <p className="text-sm text-ink-300 mt-2 leading-relaxed">{task.situationDetail}</p>
      </div>

      <div className="bg-white rounded-3xl shadow-soft p-5 min-h-[120px]">
        <p className="text-[11px] text-ink-400 uppercase tracking-wide mb-3">Ta séquence</p>
        {selected.length === 0 ? (
          <p className="text-sm text-ink-300 italic">Touche les blocs ci-dessous dans l'ordre naturel…</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {selected.map((id, i) => (
              <span key={id} className="inline-flex items-center gap-1.5 bg-ink-100 text-ink-800 rounded-xl px-3 py-2 text-sm">
                <span className="text-[10px] text-ink-400 font-mono">{i + 1}</span>
                {phraseById.get(id)?.wolof}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-2.5">
        <p className="text-[11px] text-ink-400 uppercase tracking-wide px-1">Blocs disponibles</p>
        <div className="grid gap-2.5">
          {bank.map((id) => {
            const p = phraseById.get(id);
            if (!p) return null;
            const used = selected.includes(id);
            const idx = selected.indexOf(id);
            const wrong = checked && used && task.steps[idx] !== id;
            return (
              <button
                key={id}
                onClick={() => toggle(id)}
                disabled={checked}
                className={`text-left rounded-2xl p-4 transition-all tap-highlight-none disabled:opacity-70 ${
                  wrong
                    ? 'bg-terra-50 ring-2 ring-terra-300'
                    : used
                      ? 'bg-leaf-50 ring-2 ring-leaf-400'
                      : 'bg-white shadow-soft hover:shadow-lift'
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-display text-lg text-ink-900 leading-snug">{p.wolof}</p>
                    <p className="text-sm text-ink-500 mt-0.5">{p.french}</p>
                  </div>
                  <div className="flex-shrink-0">
                    {used ? (
                      <span
                        className={`w-7 h-7 rounded-full text-white flex items-center justify-center text-xs font-semibold ${
                          wrong ? 'bg-terra-500' : 'bg-leaf-500'
                        }`}
                      >
                        {idx + 1}
                      </span>
                    ) : (
                      <span className="w-7 h-7 rounded-full bg-ink-100 text-ink-400 flex items-center justify-center">
                        <Plus />
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex gap-2.5 pt-1">
        {!checked ? (
          <button
            onClick={() => setChecked(true)}
            disabled={selected.length !== task.steps.length}
            className="flex-1 bg-ink-900 disabled:bg-ink-300 text-ink-50 rounded-2xl py-3.5 flex items-center justify-center gap-2 font-semibold transition-all tap-highlight-none disabled:cursor-not-allowed"
          >
            <Check className="w-4 h-4" />
            {selected.length === task.steps.length ? 'Vérifier' : `Place encore ${task.steps.length - selected.length} bloc(s)`}
          </button>
        ) : (
          <>
            {isCorrect ? (
              <div className="flex-1 bg-leaf-50 ring-1 ring-leaf-300 text-leaf-800 rounded-2xl p-4">
                <p className="font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5" /> Séquence naturelle
                </p>
                <p className="text-sm mt-2 leading-relaxed font-display">{fullWolof}</p>
                <p className="text-xs text-leaf-700 mt-1">{fullFrench}</p>
              </div>
            ) : (
              <div className="flex-1 bg-terra-50 ring-1 ring-terra-300 text-terra-800 rounded-2xl p-4">
                <p className="font-semibold flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" /> Pas tout à fait
                </p>
                <p className="text-sm mt-2 leading-relaxed">L'ordre naturel serait :</p>
                <p className="text-sm mt-1.5 font-display text-ink-900">{fullWolof}</p>
                <p className="text-xs text-terra-700 mt-1">{fullFrench}</p>
              </div>
            )}
            <button
              onClick={() => {
                setSelected([]);
                setChecked(false);
              }}
              className="bg-ink-100 text-ink-700 rounded-2xl px-5 py-3.5 flex items-center gap-2 font-medium tap-highlight-none hover:bg-ink-200 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              Refaire
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function Plus() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

// ───────────────────────────── Phase 3 ─────────────────────────────

type CompareStep = 'reference' | 'voice' | null;

function Phase3Speaking({
  plan,
  onResult,
}: {
  plan: SessionPlan;
  onResult: (phraseId: string, r: SpeakingResult) => void;
}) {
  const profile: DurationProfile = plan.profile;
  const byId = useMemo(() => new Map(plan.phrases.map((p) => [p.phrase.id, p])), [plan.phrases]);

  /** File de pratique : les phrases du plan, puis (30 min) un second passage des « À revoir ». */
  const [queue, setQueue] = useState<string[]>(() => plan.phrases.map((p) => p.phrase.id));
  const [entryResults, setEntryResults] = useState<(SpeakingResult | undefined)[]>([]);
  const [idx, setIdx] = useState(0);
  const [hasReplayed, setHasReplayed] = useState(false);
  const [compareStep, setCompareStep] = useState<CompareStep>(null);
  const autoCompareRef = useRef(false);

  const player = useAudioPlayer();
  const recorder = useRecorder();
  useAudioAvailability(plan.phrases.flatMap((p) => [p.phrase.audioUrl, p.phrase.slowAudioUrl]));

  const item = byId.get(queue[idx])!;
  const phrase = item.phrase;
  const refs = resolveReference(phrase);
  const isSecondPass = idx >= plan.phrases.length;
  const evaluated = entryResults.filter(Boolean).length;
  const allDone = queue.length > 0 && queue.every((_, i) => entryResults[i]);

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

  const goTo = (i: number) => {
    autoCompareRef.current = false;
    recorder.reset();
    player.stop();
    setCompareStep(null);
    setHasReplayed(false);
    setIdx(i);
  };

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
    setCompareStep('voice');
    recorder.playRecording(() => {
      setCompareStep(null);
      setHasReplayed(true);
    });
  };

  const handleEval = (r: SpeakingResult) => {
    onResult(phrase.id, r);
    const nextResults = [...entryResults];
    nextResults[idx] = r;
    setEntryResults(nextResults);

    let nextQueue = queue;
    const alreadyQueuedTwice = queue.filter((id) => id === phrase.id).length > 1;
    if (profile.secondPass && r === 'review' && !isSecondPass && !alreadyQueuedTwice) {
      nextQueue = [...queue, phrase.id];
      setQueue(nextQueue);
    }

    const after = nextQueue.findIndex((_, i) => i > idx && !nextResults[i]);
    const before = nextQueue.findIndex((_, i) => !nextResults[i]);
    const next = after !== -1 ? after : before;
    if (next !== -1) goTo(next);
    else {
      recorder.reset();
      player.stop();
      setCompareStep(null);
    }
  };

  const current = entryResults[idx];
  const busy = recorder.isRecording || recorder.isRequesting || compareStep !== null;

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3 bg-white rounded-2xl p-4">
        <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-leaf-100 flex items-center justify-center">
          <Mic className="w-5 h-5 text-leaf-700" />
        </div>
        <div>
          <h3 className="font-semibold text-ink-900 text-[15px]">Pratique à voix haute</h3>
          <p className="text-sm text-ink-500 mt-0.5 leading-relaxed">
            Écoute le modèle, enregistre-toi : la référence puis ta voix sont rejouées à la suite pour comparer. Évalue ensuite honnêtement.
          </p>
          {profile.secondPass && (
            <p className="text-xs text-ink-400 mt-1.5">Format 30 min : chaque phrase « À revoir » repasse une seconde fois en fin de pratique.</p>
          )}
        </div>
      </div>

      {/* Progress: one segment per entry, tappable */}
      <div className="px-1">
        <div className="flex items-center gap-1.5">
          {queue.map((id, i) => (
            <button
              key={`${id}-${i}`}
              onClick={() => goTo(i)}
              disabled={busy}
              aria-label={`Phrase ${i + 1}${entryResults[i] ? ` · ${RESULT_LABEL[entryResults[i]!]}` : ''}`}
              className={`h-2 flex-1 rounded-full transition-colors tap-highlight-none disabled:cursor-not-allowed ${
                entryResults[i] === 'mastered'
                  ? 'bg-leaf-500'
                  : entryResults[i] === 'review'
                    ? 'bg-terra-400'
                    : i === idx
                      ? 'bg-ink-700'
                      : i >= plan.phrases.length
                        ? 'bg-terra-100'
                        : 'bg-ink-200'
              } ${i === idx ? 'ring-2 ring-offset-2 ring-offset-ink-50 ring-ink-700' : ''}`}
            />
          ))}
        </div>
        <p className="text-xs text-ink-400 mt-2">
          {isSecondPass ? 'Second passage · ' : ''}Phrase {idx + 1} sur {queue.length} · {evaluated} évaluée{evaluated > 1 ? 's' : ''}
        </p>
      </div>

      {/* Reference phrase */}
      <article className="bg-white rounded-3xl shadow-soft p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-1.5">
            <KindBadge item={item} lesson={plan.lesson} />
            <p className="text-[11px] text-ink-400 uppercase tracking-wide leading-relaxed">{phrase.situation}</p>
          </div>
          {current && (
            <span
              className={`flex-shrink-0 text-[11px] px-2 py-1 rounded-full ${
                current === 'mastered' ? 'text-leaf-700 bg-leaf-100' : 'text-terra-700 bg-terra-100'
              }`}
            >
              {RESULT_LABEL[current]}
            </span>
          )}
        </div>
        <p className="font-display text-2xl text-ink-900 mt-1.5 leading-snug">
          <HighlightedPhrase text={phrase.wolof} />
        </p>
        <p className="text-sm text-ink-700 mt-1">{phrase.french}</p>

        <div className="mt-4">
          <p className="text-[11px] text-ink-400 uppercase tracking-wide mb-2">Audio de référence</p>
          <ReferenceAudio phrase={phrase} player={player} disabled={busy} />
        </div>

        <div className="mt-3 flex items-start gap-2 bg-sand-50 rounded-xl p-3 ring-1 ring-sand-100">
          <Volume2 className="w-4 h-4 text-sand-700 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-ink-600 leading-relaxed">{phrase.pronunciationNote}</p>
        </div>
      </article>

      {/* Recorder */}
      <article className="bg-white rounded-3xl shadow-soft p-5">
        <p className="text-[11px] text-ink-400 uppercase tracking-wide mb-4">Ton enregistrement</p>

        <div className="flex flex-col items-center py-3">
          <button
            onClick={handleRecord}
            disabled={recorder.isRequesting || compareStep !== null}
            aria-label={recorder.isRecording ? 'Arrêter l\'enregistrement' : 'Commencer l\'enregistrement'}
            className={`relative w-20 h-20 rounded-full flex items-center justify-center transition-all tap-highlight-none disabled:opacity-60 ${
              recorder.isRecording ? 'bg-terra-600 text-white scale-105' : 'bg-ink-900 text-ink-50 hover:bg-ink-800'
            }`}
          >
            {recorder.isRecording && <span className="absolute inset-0 rounded-full bg-terra-400 animate-pulseRing" />}
            {recorder.isRecording ? (
              <Square className="w-7 h-7 relative" fill="currentColor" />
            ) : (
              <Mic className="w-8 h-8 relative" />
            )}
          </button>
          <span className="text-sm font-medium text-ink-700 mt-4 text-center">
            {recorder.isRequesting
              ? 'Autorise l\'accès au micro dans ton navigateur…'
              : recorder.isRecording
                ? 'Enregistrement… touche pour stopper'
                : recorder.hasRecording
                  ? 'Touche pour recommencer'
                  : 'Touche pour t\'enregistrer'}
          </span>

          {recorder.isRecording && (
            <div className="w-full mt-4">
              <WaveProgress progress={recorder.progress} active bars={30} />
            </div>
          )}
        </div>

        {recorder.isSimulated && (recorder.isRecording || recorder.hasRecording) && (
          <div className="mt-1 mb-3 flex items-start gap-2 bg-ink-50 rounded-xl p-3 text-xs text-ink-500">
            <MicOff className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <p>Micro indisponible ou refusé : l'enregistrement est simulé et la réécoute sera muette. Prononce quand même la phrase à voix haute.</p>
          </div>
        )}

        {recorder.hasRecording && !recorder.isRecording && (
          <div className="mt-2 animate-fadeIn space-y-2.5">
            {/* Comparison status */}
            <div className="grid grid-cols-2 gap-2">
              <div
                className={`rounded-xl px-3 py-2 text-xs flex items-center gap-2 ${
                  compareStep === 'reference' ? 'bg-terra-600 text-white' : refs.normal ? 'bg-ink-50 text-ink-500' : 'bg-ink-50 text-ink-300 line-through'
                }`}
                title={refs.normal ? undefined : 'Audio natif pas encore enregistré'}
              >
                {refs.normal ? <Play className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />} 1. Modèle
              </div>
              <div
                className={`rounded-xl px-3 py-2 text-xs flex items-center gap-2 ${
                  compareStep === 'voice' ? 'bg-sky-600 text-white' : 'bg-ink-50 text-ink-500'
                }`}
              >
                <Mic className="w-3.5 h-3.5" /> 2. Ta voix
              </div>
            </div>
            {compareStep === 'voice' && <WaveProgress progress={recorder.progress} active bars={30} className="h-5" />}
            {!refs.normal && !refs.checking && (
              <p className="text-[11px] text-ink-400 leading-relaxed">
                Pas encore de référence native pour cette phrase : seule ta voix est rejouée. Compare-la à la note de prononciation.
              </p>
            )}

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={runCompare}
                disabled={compareStep !== null}
                className="flex items-center justify-center gap-2 rounded-2xl py-3 text-sm font-medium bg-sky-50 text-sky-800 ring-1 ring-sky-200 hover:bg-sky-100 transition-all tap-highlight-none disabled:opacity-60"
              >
                <Repeat className="w-4 h-4" />
                {refs.normal ? 'Comparer' : 'Réécouter'}
              </button>
              <button
                onClick={replayVoice}
                disabled={compareStep !== null}
                className="flex items-center justify-center gap-2 rounded-2xl py-3 text-sm font-medium bg-ink-100 text-ink-700 hover:bg-ink-200 transition-all tap-highlight-none disabled:opacity-60"
              >
                <Play className="w-4 h-4" />
                Ma voix seule
              </button>
            </div>

            {/* Self-eval */}
            <div className="pt-2">
              <p className="text-xs text-ink-500 mb-2.5 text-center">
                {hasReplayed ? 'Comment évalues-tu ta production ?' : 'Réécoute-toi après le modèle pour pouvoir t\'évaluer.'}
              </p>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  onClick={() => handleEval('mastered')}
                  disabled={!hasReplayed || compareStep !== null}
                  className="flex items-center justify-center gap-2 bg-leaf-500 hover:bg-leaf-600 text-white rounded-2xl py-3.5 font-semibold transition-all tap-highlight-none active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  Maîtrisée
                </button>
                <button
                  onClick={() => handleEval('review')}
                  disabled={!hasReplayed || compareStep !== null}
                  className="flex items-center justify-center gap-2 bg-ink-100 hover:bg-ink-200 text-ink-700 rounded-2xl py-3.5 font-semibold transition-all tap-highlight-none active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <RotateCcw className="w-5 h-5" />
                  À revoir
                </button>
              </div>
            </div>
          </div>
        )}

        {!recorder.hasRecording && !recorder.isRecording && !recorder.isRequesting && (
          <p className="text-xs text-ink-400 text-center mt-2">Enregistre-toi pour activer la comparaison et l'auto-évaluation.</p>
        )}
      </article>

      {allDone && (
        <div className="bg-leaf-50 ring-1 ring-leaf-200 text-leaf-800 rounded-2xl p-4 text-center animate-scaleIn">
          <CheckCircle2 className="w-7 h-7 mx-auto mb-2" />
          <p className="font-semibold">Pratique terminée</p>
          <p className="text-sm text-leaf-700 mt-1">Tes évaluations sont enregistrées. Passe au récapitulatif.</p>
        </div>
      )}
    </div>
  );
}

// ───────────────────────────── Phase 4 ─────────────────────────────

function Phase4Recap({
  plan,
  results,
  progress,
  onOpenGlossary,
  onFinish,
}: {
  plan: SessionPlan;
  results: Results;
  progress: ProgressState;
  onOpenGlossary: () => void;
  onFinish: () => void;
}) {
  const today = dateKey();
  const mastered = plan.phrases.filter((p) => results[p.phrase.id] === 'mastered');
  const review = plan.phrases.filter((p) => results[p.phrase.id] === 'review');
  const notPracticed = plan.phrases.filter((p) => !results[p.phrase.id]);
  const streak = computeStreak(progress.sessions, today);

  const nextReview = (id: string) => {
    const p = progress.phrases[id];
    return p ? `Prochaine révision : ${describeNextReview(p.nextReviewOn, today)}` : undefined;
  };

  return (
    <div className="space-y-4">
      <div className="text-center pt-2 pb-1">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-leaf-100 mb-3">
          <Sparkles className="w-8 h-8 text-leaf-600" />
        </div>
        <h3 className="font-display text-2xl text-ink-900">Session terminée</h3>
        <p className="text-sm text-ink-500 mt-1.5">
          {plan.lesson.title} · {plan.duration} min
        </p>
        {streak > 0 && (
          <p className="inline-flex items-center gap-1.5 text-sm font-semibold text-terra-600 mt-2">
            <Flame className="w-4 h-4" />
            {streak} jour{streak > 1 ? 's' : ''} d'affilée
          </p>
        )}
      </div>

      <RecapSection
        title="Phrases maîtrisées"
        icon={<CheckCircle2 className="w-4 h-4 text-leaf-600" />}
        tone="leaf"
        items={mastered}
        badge="Maîtrisée"
        detail={nextReview}
        empty="Aucune phrase marquée « Maîtrisée » pendant cette session."
      />
      <RecapSection
        title="À revoir"
        icon={<RotateCcw className="w-4 h-4 text-terra-600" />}
        tone="terra"
        items={review}
        badge="À revoir"
        detail={nextReview}
        empty="Aucune phrase à revoir."
      />
      {notPracticed.length > 0 && (
        <RecapSection
          title="Non pratiquées à voix haute"
          icon={<Circle className="w-4 h-4 text-ink-400" />}
          tone="ink"
          items={notPracticed}
          badge="Non évaluée"
          detail={(id) =>
            progress.phrases[id] ? nextReview(id) : 'Reviendra comme nouvelle phrase à une prochaine session'
          }
          empty=""
        />
      )}

      <div className="bg-ink-900 text-ink-100 rounded-3xl p-5">
        <p className="text-sm leading-relaxed">
          {notPracticed.length === plan.phrases.length
            ? 'Tu n\'as évalué aucune phrase à voix haute. La pratique orale est ce qui construit l\'aisance : reprends la phase de pratique à ta prochaine séance.'
            : review.length + notPracticed.length === 0
              ? 'Toutes les phrases de cette session sont maîtrisées. Elles reviendront en révision espacée pour bien s\'ancrer.'
              : 'Session enregistrée. Les phrases à revoir reviendront dès demain en début de session.'}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2.5 pt-1">
        <button
          onClick={onOpenGlossary}
          className="bg-white shadow-soft text-ink-800 rounded-2xl py-3.5 flex items-center justify-center gap-2 font-medium tap-highlight-none hover:shadow-lift transition-all"
        >
          <BookOpen className="w-4 h-4" />
          Glossaire des sons
        </button>
        <button
          onClick={onFinish}
          className="bg-ink-900 text-ink-50 rounded-2xl py-3.5 flex items-center justify-center gap-2 font-semibold tap-highlight-none hover:bg-ink-800 transition-all"
        >
          <Check className="w-4 h-4" />
          Terminer
        </button>
      </div>
    </div>
  );
}

const TONES = {
  leaf: { head: 'bg-leaf-50 border-leaf-100', title: 'text-leaf-800', count: 'text-leaf-700', badge: 'text-leaf-700 bg-leaf-100' },
  terra: { head: 'bg-terra-50 border-terra-100', title: 'text-terra-800', count: 'text-terra-700', badge: 'text-terra-700 bg-terra-100' },
  ink: { head: 'bg-ink-50 border-ink-100', title: 'text-ink-700', count: 'text-ink-500', badge: 'text-ink-500 bg-ink-100' },
} as const;

function RecapSection({
  title,
  icon,
  tone,
  items,
  badge,
  detail,
  empty,
}: {
  title: string;
  icon: React.ReactNode;
  tone: keyof typeof TONES;
  items: PlannedPhrase[];
  badge: string;
  detail?: (phraseId: string) => string | undefined;
  empty: string;
}) {
  const t = TONES[tone];
  return (
    <section className="bg-white rounded-3xl shadow-soft overflow-hidden">
      <div className={`flex items-center gap-2 px-5 py-3.5 border-b ${t.head}`}>
        {icon}
        <h4 className={`text-sm font-semibold ${t.title}`}>{title}</h4>
        <span className={`ml-auto text-xs font-medium ${t.count}`}>{items.length}</span>
      </div>
      {items.length === 0 ? (
        <p className="px-5 py-4 text-sm text-ink-400">{empty}</p>
      ) : (
        <ul className="divide-y divide-ink-100">
          {items.map(({ phrase }) => {
            const d = detail?.(phrase.id);
            return (
              <li key={phrase.id} className="px-5 py-3.5 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-display text-base text-ink-900 leading-snug">{phrase.wolof}</p>
                  <p className="text-xs text-ink-500 mt-0.5">{phrase.french}</p>
                  {d && <p className="text-[11px] text-ink-400 mt-1">{d}</p>}
                </div>
                <span className={`flex-shrink-0 text-[11px] px-2 py-1 rounded-full ${t.badge}`}>{badge}</span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
