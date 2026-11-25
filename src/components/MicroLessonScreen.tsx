import { useEffect, useMemo, useRef, useState } from 'react';
import { AlertCircle, ArrowRight, Check, CheckCircle2, Flag, Headphones, Mic, RotateCcw, Sparkles, Trophy } from 'lucide-react';
import type { Lesson, LessonPhrase } from '@/data/lessons';
import type { SpeakingResult } from '@/lib/progress';
import { CHALLENGE_PASS_RATIO, challengeOrder, quizOptions, seededShuffle, type MicroLesson } from '@/lib/microLessons';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import { useAudioAvailability } from '@/hooks/useAudioAvailability';
import { useRecorder } from '@/hooks/useRecorder';
import { ListenButtons } from '@/components/AudioButtons';
import { HighlightedPhrase } from '@/components/HighlightedPhrase';
import { Footer, LessonHeader, ListenStep, SpeakStep } from '@/components/LessonParts';

interface Props {
  micro: MicroLesson;
  lesson: Lesson;
  /** pour les leurres des QCM : les phrases de tout le chapitre */
  chapterPhrases: LessonPhrase[];
  /** statut actuel de chaque phrase (pour mettre les « À revoir » en tête du défi) */
  phraseStatus: (phraseId: string) => SpeakingResult | undefined;
  /** auto-évaluation orale : enregistrée dans la progression des phrases */
  onResult: (phraseId: string, result: SpeakingResult) => void;
  /** fin de la micro-leçon : validée ou non, score éventuel (0..1) */
  onFinish: (passed: boolean, score?: number) => void;
  onExit: () => void;
  onOpenGlossary: () => void;
}

/** Une étape de micro-leçon : un écran. */
type Step =
  | { kind: 'listen'; phrase: LessonPhrase }
  | { kind: 'quiz'; phrase: LessonPhrase; mode: 'meaning' | 'translate'; retry?: boolean }
  | { kind: 'speak'; phrase: LessonPhrase; prompt?: 'wolof' | 'french'; priority?: boolean };

function buildSteps(micro: MicroLesson, phraseStatus: Props['phraseStatus']): Step[] {
  if (micro.kind === 'discover') {
    return [
      ...micro.phrases.map((phrase): Step => ({ kind: 'listen', phrase })),
      ...seededShuffle(micro.phrases, micro.id).map((phrase): Step => ({ kind: 'quiz', phrase, mode: 'meaning' })),
    ];
  }
  if (micro.kind === 'oral') return micro.phrases.map((phrase): Step => ({ kind: 'speak', phrase }));
  // Défi : le français s'affiche, on le dit en wolof à voix haute ; « À revoir » d'abord
  return challengeOrder(micro.phrases, phraseStatus, `${micro.id}:defi`).map(
    (phrase): Step => ({ kind: 'speak', phrase, prompt: 'french', priority: phraseStatus(phrase.id) === 'review' }),
  );
}

const KIND_ICON = { discover: Headphones, oral: Mic, challenge: Flag } as const;

export function MicroLessonScreen({ micro, lesson, chapterPhrases, phraseStatus, onResult, onFinish, onExit, onOpenGlossary }: Props) {
  // Ordre figé au lancement : les évaluations de la leçon ne le recomposent pas
  const [steps, setSteps] = useState<Step[]>(() => buildSteps(micro, phraseStatus));
  const [idx, setIdx] = useState(0);
  const [finished, setFinished] = useState(false);
  /** QCM : premier essai réussi ou non, par phrase */
  const [firstTry, setFirstTry] = useState<Record<string, boolean>>({});
  /** pratique orale : évaluations de la leçon */
  const [evaluations, setEvaluations] = useState<Record<string, SpeakingResult>>({});
  const reportedRef = useRef(false);

  const player = useAudioPlayer();
  const recorder = useRecorder();
  useAudioAvailability(micro.phrases.flatMap((p) => [p.audioUrl, p.slowAudioUrl]));

  const step = steps[idx];
  const pct = finished ? 100 : Math.round((idx / steps.length) * 100);

  // Bilan calculé une fois la leçon finie
  const outcome = useMemo(() => {
    if (micro.kind === 'oral') {
      const evaluated = micro.phrases.filter((p) => evaluations[p.id]).length;
      return { passed: evaluated === micro.phrases.length, score: undefined, evaluated };
    }
    if (micro.kind === 'challenge') {
      const mastered = micro.phrases.filter((p) => evaluations[p.id] === 'mastered').length;
      const score = micro.phrases.length ? mastered / micro.phrases.length : 0;
      return { passed: score >= CHALLENGE_PASS_RATIO, score, evaluated: mastered };
    }
    const answered = micro.phrases.filter((p) => p.id in firstTry);
    const correct = answered.filter((p) => firstTry[p.id]).length;
    const score = micro.phrases.length ? correct / micro.phrases.length : 0;
    return { passed: true, score, evaluated: correct };
  }, [micro, evaluations, firstTry]);

  useEffect(() => {
    if (!finished || reportedRef.current) return;
    reportedRef.current = true;
    onFinish(outcome.passed, outcome.score);
  }, [finished, outcome, onFinish]);

  const next = () => {
    player.stop();
    recorder.reset();
    if (idx + 1 < steps.length) setIdx(idx + 1);
    else setFinished(true);
    window.scrollTo(0, 0);
  };

  const answerQuiz = (phrase: LessonPhrase, correct: boolean) => {
    const isRetry = step.kind === 'quiz' && step.retry;
    if (!isRetry) setFirstTry((f) => ({ ...f, [phrase.id]: correct }));
    // Découverte : une erreur fait repasser la phrase en fin de leçon (une fois)
    if (!correct && micro.kind === 'discover' && !isRetry) {
      setSteps((s) => [...s, { kind: 'quiz', phrase, mode: 'meaning', retry: true }]);
    }
  };

  const quit = () => {
    if (!finished && idx > 0 && !window.confirm('Quitter la leçon ? Les phrases évaluées au micro restent enregistrées.')) return;
    player.stop();
    recorder.reset();
    onExit();
  };

  const stageLabel = finished
    ? 'Bilan'
    : step.kind === 'listen'
      ? 'Écoute'
      : step.kind === 'speak'
        ? step.prompt === 'french'
          ? 'Dis-le en wolof'
          : 'À voix haute'
        : step.mode === 'meaning'
          ? 'Que veut dire… ?'
          : 'Traduis en wolof';
  const counter = finished ? '' : ` · ${idx + 1}/${steps.length}`;

  return (
    <div className="min-h-screen flex flex-col">
      <LessonHeader
        pct={pct}
        label={`${micro.title} · ${stageLabel}${counter}`}
        onQuit={quit}
        quitLabel="Quitter la leçon"
        onOpenGlossary={onOpenGlossary}
      />
      <main className="flex-1 mx-auto w-full max-w-xl px-4 pt-2 pb-56">
        {finished ? (
          <ResultStep micro={micro} lesson={lesson} passed={outcome.passed} score={outcome.score} evaluated={outcome.evaluated} onExit={onExit} />
        ) : step.kind === 'listen' ? (
          <ListenStep
            key={`l-${idx}`}
            phrase={step.phrase}
            badge={<StepBadge micro={micro} />}
            player={player}
            slowFirst={false}
            target={1}
            count={0}
            onListen={() => undefined}
            onNext={next}
            isLast={false}
          />
        ) : step.kind === 'speak' ? (
          <SpeakStep
            key={`s-${idx}`}
            phrase={step.phrase}
            badge={<StepBadge micro={micro} />}
            player={player}
            recorder={recorder}
            isSecondPass={false}
            onEval={(id, r) => {
              onResult(id, r);
              setEvaluations((e) => ({ ...e, [id]: r }));
            }}
            onNext={next}
            isLast={idx + 1 === steps.length}
            lastLabel="Voir le bilan"
            prompt={step.prompt}
            aside={
              step.priority && (
                <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wide px-2.5 py-1 rounded-full bg-ochre-100 text-ochre-800">
                  <RotateCcw className="w-3 h-3" /> À revoir
                </span>
              )
            }
          />
        ) : (
          <QuizStep
            key={`q-${idx}`}
            phrase={step.phrase}
            mode={step.mode}
            retry={!!step.retry}
            pool={chapterPhrases}
            seed={micro.id}
            player={player}
            onAnswer={(ok) => answerQuiz(step.phrase, ok)}
            onNext={next}
            isLast={idx + 1 === steps.length}
          />
        )}
      </main>
    </div>
  );
}

function StepBadge({ micro }: { micro: MicroLesson }) {
  const Icon = KIND_ICON[micro.kind];
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wide px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800">
      <Icon className="w-3 h-3" /> {micro.title}
    </span>
  );
}

// ───────────────────────────── QCM ─────────────────────────────

function QuizStep({
  phrase,
  mode,
  retry,
  pool,
  seed,
  player,
  onAnswer,
  onNext,
  isLast,
}: {
  phrase: LessonPhrase;
  mode: 'meaning' | 'translate';
  retry: boolean;
  pool: LessonPhrase[];
  seed: string;
  player: ReturnType<typeof useAudioPlayer>;
  onAnswer: (correct: boolean) => void;
  onNext: () => void;
  isLast: boolean;
}) {
  const field = mode === 'meaning' ? 'french' : 'wolof';
  const options = useMemo(() => quizOptions(phrase, pool, field, `${seed}:${mode}`), [phrase, pool, field, seed, mode]);
  const [choice, setChoice] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);
  const correct = checked && choice === phrase.id;

  const check = () => {
    if (!choice) return;
    setChecked(true);
    onAnswer(choice === phrase.id);
  };

  return (
    <div className="animate-fadeSoft">
      <article className="card px-5 py-7 sm:px-8 sm:py-8 space-y-5 text-center">
        <div className="flex items-center justify-center gap-2 flex-wrap">
          <span className="inline-flex text-[10px] font-extrabold uppercase tracking-wide px-2.5 py-1 rounded-full bg-ochre-100 text-ochre-800">
            {mode === 'meaning' ? 'Que veut dire…' : 'Comment dit-on…'}
          </span>
          {retry && (
            <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wide px-2.5 py-1 rounded-full bg-terra-100 text-terra-800">
              <RotateCcw className="w-3 h-3" /> Deuxième chance
            </span>
          )}
        </div>
        <p className="text-xs text-ink-500 leading-relaxed max-w-md mx-auto">{phrase.situation}</p>
        {mode === 'meaning' ? (
          <p lang="wo" className="font-display text-[2rem] sm:text-[2.4rem] font-semibold text-ink-900 leading-[1.2] break-words">
            <HighlightedPhrase text={phrase.wolof} />
          </p>
        ) : (
          <p className="text-2xl sm:text-[1.7rem] font-bold text-ink-900 leading-snug">« {phrase.french} »</p>
        )}
        {(mode === 'meaning' || checked) && <ListenButtons phrase={phrase} player={player} compact />}
      </article>

      <div className="mt-5 grid gap-2.5" role="radiogroup" aria-label="Propositions">
        {options.map((o) => {
          const selected = choice === o.id;
          const isAnswer = o.id === phrase.id;
          const state = !checked ? (selected ? 'selected' : 'idle') : isAnswer ? 'right' : selected ? 'wrong' : 'dim';
          return (
            <button
              key={o.id}
              role="radio"
              aria-checked={selected}
              disabled={checked}
              onClick={() => setChoice(o.id)}
              className={`w-full text-left rounded-2xl px-4 py-4 border-2 transition-all tap-highlight-none flex items-center gap-3 ${
                state === 'selected'
                  ? 'bg-emerald-50 border-emerald-500 shadow-[0_4px_0_0_theme(colors.emerald.500)]'
                  : state === 'right'
                    ? 'bg-emerald-50 border-emerald-500'
                    : state === 'wrong'
                      ? 'bg-terra-50 border-terra-400'
                      : state === 'dim'
                        ? 'bg-white border-ink-100 opacity-50'
                        : 'bg-white border-ink-200 shadow-press-ink hover:border-emerald-300 active:translate-y-[3px] active:shadow-none'
              }`}
            >
              <span
                className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                  state === 'right' ? 'bg-emerald-500 border-emerald-500 text-white' : state === 'wrong' ? 'bg-terra-400 border-terra-400 text-white' : selected ? 'border-emerald-500' : 'border-ink-200'
                }`}
              >
                {state === 'right' && <Check className="w-3.5 h-3.5" strokeWidth={3} />}
                {state === 'wrong' && <AlertCircle className="w-3.5 h-3.5" />}
                {state === 'selected' && <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />}
              </span>
              {mode === 'translate' ? (
                <span lang="wo" className="font-display text-lg text-ink-900 leading-snug">
                  {o.wolof}
                </span>
              ) : (
                <span className="text-[15px] font-semibold text-ink-800 leading-snug">{o.french}</span>
              )}
            </button>
          );
        })}
      </div>

      <Footer>
        {!checked ? (
          <button onClick={check} disabled={!choice} className="btn-primary w-full">
            <Check className="w-5 h-5" strokeWidth={3} />
            Vérifier
          </button>
        ) : (
          <div role="status" className={`-mx-4 px-4 pt-4 pb-1 rounded-t-[1.75rem] animate-slideUp ${correct ? 'bg-emerald-50' : 'bg-terra-50'}`}>
            <div className="flex items-start gap-3">
              <span
                className={`flex-shrink-0 w-11 h-11 rounded-full flex items-center justify-center animate-pop ${
                  correct ? 'bg-emerald-600 text-white' : 'bg-terra-500 text-white'
                }`}
              >
                {correct ? <Check className="w-6 h-6" strokeWidth={3} /> : <AlertCircle className="w-6 h-6" />}
              </span>
              <div className="min-w-0">
                <p className={`font-extrabold text-lg leading-tight ${correct ? 'text-emerald-800' : 'text-terra-800'}`}>
                  {correct ? 'Bonne réponse !' : 'Pas tout à fait'}
                </p>
                <p className="text-sm text-ink-700 mt-0.5">
                  <span lang="wo" className="font-display font-semibold">
                    {phrase.wolof}
                  </span>{' '}
                  = {phrase.french}
                </p>
              </div>
            </div>
            <button onClick={onNext} className={`${correct ? 'btn-primary' : 'btn-ochre'} w-full mt-4 mb-3`}>
              {isLast ? 'Voir le bilan' : 'Continuer'}
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </Footer>
    </div>
  );
}

// ───────────────────────────── Bilan ─────────────────────────────

function ResultStep({
  micro,
  lesson,
  passed,
  score,
  evaluated,
  onExit,
}: {
  micro: MicroLesson;
  lesson: Lesson;
  passed: boolean;
  score?: number;
  evaluated: number;
  onExit: () => void;
}) {
  const total = micro.phrases.length;
  const pct = score === undefined ? undefined : Math.round(score * 100);
  const title = passed ? (micro.kind === 'challenge' ? 'Chapitre validé !' : 'Leçon terminée !') : micro.kind === 'challenge' ? 'Presque !' : 'Leçon à reprendre';
  const message =
    micro.kind === 'oral'
      ? passed
        ? 'Toutes les phrases ont été dites et évaluées. Les « À revoir » reviendront dès demain dans la session du jour.'
        : `${evaluated} phrase${evaluated > 1 ? 's' : ''} évaluée${evaluated > 1 ? 's' : ''} sur ${total}. Évalue-les toutes pour valider la pratique orale.`
      : micro.kind === 'challenge'
        ? passed
          ? `${evaluated}/${total} phrases dites et jugées « Maîtrisée » : le chapitre « ${lesson.title} » est validé.`
          : `${evaluated}/${total} phrases jugées « Maîtrisée ». Il en faut ${Math.ceil(CHALLENGE_PASS_RATIO * total)} pour valider le chapitre : passe par l'atelier oral, puis retente le défi. Les « À revoir » repasseront en premier.`
        : `${evaluated}/${total} reconnue${evaluated > 1 ? 's' : ''} du premier coup. Passe à la suite du chapitre quand tu veux.`;

  return (
    <div className="animate-fadeSoft text-center pt-6">
      <span
        className={`inline-flex items-center justify-center w-24 h-24 rounded-full animate-pop ${
          passed ? 'bg-ochre-100 text-ochre-500' : 'bg-cream-200 text-ink-400'
        }`}
      >
        {passed ? <Trophy className="w-12 h-12" fill="currentColor" /> : <RotateCcw className="w-11 h-11" />}
      </span>
      <h2 className="font-display text-3xl font-bold text-ink-900 mt-5">{title}</h2>
      <p className="text-sm text-ink-500 mt-1.5">
        Chapitre {String(lesson.order).padStart(2, '0')} · {micro.title}
      </p>
      {pct !== undefined && (
        <div className="mx-auto mt-6 max-w-xs">
          <div className="flex items-baseline justify-between text-sm font-bold text-ink-700 mb-2">
            <span>Score</span>
            <span className="tabular-nums">{pct} %</span>
          </div>
          <div className="h-3 rounded-full bg-cream-200 overflow-hidden">
            <div className={`h-full rounded-full transition-all duration-700 ${passed ? 'bg-emerald-500' : 'bg-ochre-400'}`} style={{ width: `${pct}%` }} />
          </div>
        </div>
      )}
      <p className="card mt-6 p-5 text-sm text-ink-700 leading-relaxed text-left flex gap-3">
        {passed ? <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" /> : <Sparkles className="w-5 h-5 text-ochre-500 flex-shrink-0" />}
        <span>{message}</span>
      </p>
      <Footer>
        <button onClick={onExit} className="btn-primary w-full">
          Retour au parcours
          <ArrowRight className="w-5 h-5" />
        </button>
      </Footer>
    </div>
  );
}
