import { AlertTriangle, Check, Flag, Flame, Headphones, Mic, Play, Target, Trophy } from 'lucide-react';
import type { Lesson } from '@/data/lessons';
import type { SessionDuration } from '@/lib/highlights';
import type { LessonStats, ProgressSummary } from '@/lib/progress';
import { DURATION_PROFILES, type SessionPlan } from '@/lib/sessionPlan';
import type { MicroLesson, MicroProgressState, MicroStatus } from '@/lib/microLessons';
import { Logo } from '@/components/AppShell';

interface Props {
  lessons: Lesson[];
  chapters: MicroLesson[][];
  statuses: Record<string, MicroStatus>;
  microProgress: MicroProgressState;
  lessonStats: Record<string, LessonStats>;
  /** thème de la session du jour */
  dailyLessonId: string;
  onDailyLessonChange: (id: string) => void;
  duration: SessionDuration;
  onDurationChange: (duration: SessionDuration) => void;
  /** aperçu du contenu de la session du jour */
  preview: SessionPlan;
  summary: ProgressSummary;
  storageOk: boolean;
  onStartDaily: () => void;
  onStartMicro: (micro: MicroLesson) => void;
}

const DURATIONS: SessionDuration[] = [15, 20, 30];

const STATUS_LABEL: Record<MicroStatus, string> = { done: 'Terminée', recommended: 'Recommandée', todo: 'À faire' };

/** Décalage horizontal des pastilles : un tracé qui serpente doucement. */
const ZIGZAG = [0, 52, 72, 52, 0, -52, -72, -52];

function microIcon(micro: MicroLesson) {
  if (micro.kind === 'oral') return Mic;
  if (micro.kind === 'challenge') return Flag;
  return Headphones;
}

const plural = (n: number, words: string) => `${n} ${n > 1 ? words.replace(/(\S)(?=\s|$)/g, '$1s') : words}`;

export function PathScreen({
  lessons,
  chapters,
  statuses,
  microProgress,
  lessonStats,
  dailyLessonId,
  onDailyLessonChange,
  duration,
  onDurationChange,
  preview,
  summary,
  storageOk,
  onStartDaily,
  onStartMicro,
}: Props) {
  const allMicro = chapters.flat();
  const doneMicro = allMicro.filter((m) => statuses[m.id] === 'done').length;
  const totalPhrases = lessons.reduce((n, l) => n + l.phrases.length, 0);
  const masteredPhrases = lessons.reduce((n, l) => n + (lessonStats[l.id]?.mastered ?? 0), 0);
  const recommended = allMicro.find((m) => statuses[m.id] === 'recommended');
  const count = (k: 'review' | 'new' | 'consolidation') => preview.phrases.filter((p) => p.kind === k).length;
  const programme = [
    count('review') > 0 && plural(count('review'), 'révision'),
    count('new') > 0 && plural(count('new'), 'nouvelle phrase'),
    count('consolidation') > 0 && `${count('consolidation')} en consolidation`,
    preview.includeAssembly && 'assemblage',
  ].filter(Boolean) as string[];

  return (
    <div className="space-y-6">
      {/* En-tête compact */}
      <header className="flex items-center justify-between gap-3 animate-fadeIn">
        <div className="lg:hidden">
          <Logo />
        </div>
        <h1 className="hidden lg:block font-display text-3xl font-bold text-ink-900">Ton parcours</h1>
        <div className="flex items-center gap-2">
          <span
            className="flex items-center gap-1.5 rounded-full bg-white ring-1 ring-ink-100 px-3 py-2 text-sm font-extrabold text-emerald-700"
            title="Micro-leçons terminées"
          >
            <Trophy className="w-4 h-4" />
            {doneMicro}/{allMicro.length}
          </span>
          <span
            className={`flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-extrabold ${
              summary.streak > 0 ? 'bg-ochre-100 text-ochre-800' : 'bg-white text-ink-400 ring-1 ring-ink-100'
            }`}
            title="Série de jours de pratique"
          >
            <Flame className="w-4 h-4" fill={summary.streak > 0 ? 'currentColor' : 'none'} />
            {summary.streak}
            <span className="sr-only">{summary.streak > 1 ? 'jours' : 'jour'} d'affilée</span>
          </span>
        </div>
      </header>

      {!storageOk && (
        <div className="rounded-2xl bg-terra-50 ring-1 ring-terra-200 text-terra-800 p-4 flex items-start gap-2.5 text-sm">
          <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <p>Le stockage local est indisponible (navigation privée ?) : ta progression ne sera pas conservée après fermeture.</p>
        </div>
      )}

      {/* Session du jour : accès rapide */}
      <section className="card p-4 sm:p-5 space-y-4 animate-fadeIn" aria-label="Session du jour">
        <div className="flex items-center justify-between gap-3">
          <p className="flex items-center gap-1.5 text-sm font-extrabold text-ink-800">
            <Target className="w-4 h-4 text-emerald-600" />
            Session du jour
          </p>
          <span className="text-xs font-semibold text-ink-400">{DURATION_PROFILES[duration].label}</span>
        </div>
        <div className="grid grid-cols-[1fr_auto] gap-2.5 items-stretch">
          <div role="radiogroup" aria-label="Durée de la session du jour" className="grid grid-cols-3 gap-1 rounded-2xl bg-cream-200 p-1">
            {DURATIONS.map((d) => {
              const selected = duration === d;
              return (
                <button
                  key={d}
                  role="radio"
                  aria-checked={selected}
                  onClick={() => onDurationChange(d)}
                  className={`rounded-xl py-2.5 text-sm font-extrabold transition-all tap-highlight-none ${
                    selected ? 'bg-white text-emerald-700 shadow-card' : 'text-ink-500 hover:text-ink-800'
                  }`}
                >
                  {d}
                  <span className="hidden sm:inline"> min</span>
                </button>
              );
            })}
          </div>
          <button onClick={onStartDaily} className="btn-primary px-5 py-3" aria-label={`Lancer la session du jour de ${duration} minutes`}>
            <Play className="w-5 h-5" fill="currentColor" />
            <span className="hidden sm:inline">Lancer</span>
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-ink-500">
          <label htmlFor="daily-theme" className="font-semibold">
            Thème :
          </label>
          <select
            id="daily-theme"
            value={dailyLessonId}
            onChange={(e) => onDailyLessonChange(e.target.value)}
            className="rounded-lg bg-cream-100 border border-ink-200 px-2 py-1 text-xs font-bold text-ink-800 max-w-[12rem] truncate"
          >
            {lessons.map((l) => (
              <option key={l.id} value={l.id}>
                {String(l.order).padStart(2, '0')} · {l.title}
              </option>
            ))}
          </select>
          <span className="basis-full">Au programme : {programme.join(' · ')}</span>
        </div>
        <div className="flex items-center gap-3 text-xs font-semibold text-ink-500">
          <div className="flex-1 h-2 rounded-full bg-cream-200 overflow-hidden" aria-hidden>
            <div className="h-full rounded-full bg-emerald-500 transition-all duration-700" style={{ width: `${(masteredPhrases / totalPhrases) * 100}%` }} />
          </div>
          <span className="tabular-nums">
            {masteredPhrases} / {totalPhrases} phrases maîtrisées
          </span>
        </div>
      </section>

      {/* Chapitres */}
      {chapters.map((micros, ci) => {
        const lesson = lessons[ci];
        const done = micros.filter((m) => statuses[m.id] === 'done').length;
        const complete = done === micros.length;
        const s = lessonStats[lesson.id];
        return (
          <section key={lesson.id} aria-labelledby={`chap-${lesson.id}`} className="animate-fadeIn" style={{ animationDelay: `${Math.min(ci, 4) * 60}ms` }}>
            {/* En-tête de chapitre */}
            <div
              className={`relative overflow-hidden rounded-[1.75rem] p-5 ${
                complete ? 'bg-gradient-to-br from-emerald-600 to-emerald-800 text-white shadow-lift' : 'card'
              }`}
            >
              {complete && <div className="absolute -right-8 -top-10 w-36 h-36 rounded-full bg-ochre-300/25 blur-2xl" aria-hidden />}
              <div className="relative flex items-center gap-4">
                <span
                  className={`flex-shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center font-display text-2xl font-bold ${
                    complete ? 'bg-white/15 text-white' : 'bg-ochre-100 text-ochre-800'
                  }`}
                >
                  {complete ? <Check className="w-7 h-7" strokeWidth={3} /> : String(lesson.order).padStart(2, '0')}
                </span>
                <div className="min-w-0 flex-1">
                  <p className={`text-[11px] font-bold uppercase tracking-[0.14em] ${complete ? 'text-emerald-100' : 'text-ochre-600'}`}>
                    Chapitre {String(lesson.order).padStart(2, '0')}
                  </p>
                  <h2 id={`chap-${lesson.id}`} className={`font-display text-xl font-bold leading-tight mt-0.5 ${complete ? 'text-white' : 'text-ink-900'}`}>
                    {lesson.title}
                  </h2>
                </div>
              </div>
              <div className="relative mt-4">
                <div className={`flex items-baseline justify-between text-xs font-bold mb-1.5 ${complete ? 'text-emerald-50' : 'text-ink-600'}`}>
                  <span>
                    {done} / {micros.length} leçons terminées
                  </span>
                  <span className={complete ? 'text-emerald-100' : 'text-ink-400'}>
                    {s?.mastered ?? 0}/{lesson.phrases.length} phrases maîtrisées
                  </span>
                </div>
                <div className={`h-2.5 rounded-full overflow-hidden ${complete ? 'bg-white/20' : 'bg-cream-200'}`}>
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${complete ? 'bg-white' : 'bg-emerald-500'}`}
                    style={{ width: `${(done / micros.length) * 100}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Parcours vertical des micro-leçons */}
            <ol className="relative mt-2 py-4">
              <span aria-hidden className="absolute left-1/2 top-0 bottom-0 -translate-x-1/2 w-1 bg-[repeating-linear-gradient(to_bottom,theme(colors.ochre.200)_0_8px,transparent_8px_16px)]" />
              {micros.map((m, mi) => {
                const status = statuses[m.id] ?? 'todo';
                const Icon = microIcon(m);
                const offset = ZIGZAG[mi % ZIGZAG.length];
                const best = microProgress.lessons[m.id]?.bestScore;
                return (
                  <li key={m.id} className="relative flex flex-col items-center py-3" style={{ transform: `translateX(${offset}px)` }}>
                    {status === 'recommended' && (
                      <span className="mb-2 rounded-xl bg-ochre-400 text-ink-900 text-xs font-extrabold px-3 py-1.5 shadow-press-ochre animate-pop relative after:absolute after:left-1/2 after:-bottom-1 after:-translate-x-1/2 after:w-2.5 after:h-2.5 after:bg-ochre-400 after:rotate-45">
                        Commencer
                      </span>
                    )}
                    <button
                      onClick={() => onStartMicro(m)}
                      aria-label={`${m.title} (${STATUS_LABEL[status]}) : ${m.subtitle}`}
                      className={`relative w-[4.5rem] h-[4.5rem] rounded-full flex items-center justify-center transition-all tap-highlight-none select-none active:translate-y-[4px] active:shadow-none ${
                        status === 'done'
                          ? 'bg-emerald-500 text-white shadow-[0_5px_0_0_theme(colors.emerald.700)] hover:bg-emerald-400'
                          : status === 'recommended'
                            ? 'bg-ochre-400 text-ink-900 shadow-[0_5px_0_0_theme(colors.ochre.700)] ring-[6px] ring-ochre-200 hover:bg-ochre-300'
                            : 'bg-white text-ink-400 border-2 border-ink-200 shadow-[0_5px_0_0_theme(colors.ink.200)] hover:text-emerald-700 hover:border-emerald-300'
                      }`}
                    >
                      <Icon className="w-8 h-8" strokeWidth={2.2} />
                      {status === 'done' && (
                        <span className="absolute -right-1 -bottom-1 w-6 h-6 rounded-full bg-white text-emerald-600 ring-2 ring-emerald-500 flex items-center justify-center">
                          <Check className="w-3.5 h-3.5" strokeWidth={3.5} />
                        </span>
                      )}
                    </button>
                    <div className="relative mt-2.5 text-center max-w-[11rem] rounded-xl bg-cream px-2 py-1">
                      <p className="text-sm font-extrabold text-ink-900 leading-tight">{m.title}</p>
                      <p className="text-[11px] text-ink-500 leading-snug mt-0.5">{m.subtitle}</p>
                      <span
                        className={`inline-block mt-1.5 text-[10px] font-extrabold uppercase tracking-wide px-2 py-0.5 rounded-full ${
                          status === 'done' ? 'bg-emerald-100 text-emerald-800' : status === 'recommended' ? 'bg-ochre-100 text-ochre-800' : 'bg-ink-100 text-ink-500'
                        }`}
                      >
                        {STATUS_LABEL[status]}
                        {best !== undefined && m.kind === 'challenge' ? ` · ${Math.round(best * 100)} %` : ''}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ol>
          </section>
        );
      })}

      {!recommended && (
        <p className="card p-5 text-center text-sm font-semibold text-emerald-800">
          Toutes les micro-leçons sont terminées. Continue avec la session du jour pour entretenir tes acquis.
        </p>
      )}
    </div>
  );
}
