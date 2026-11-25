import { Headphones, Mic, Sparkles, ArrowRight, Flame, CalendarDays, BookOpen, CheckCircle2, RotateCcw, Layers, AlertTriangle } from 'lucide-react';
import type { Lesson } from '@/data/lessons';
import type { SessionDuration } from '@/lib/highlights';
import type { LessonStats, ProgressSummary } from '@/lib/progress';
import { DURATION_PROFILES, type SessionPlan } from '@/lib/sessionPlan';

interface Props {
  lessons: Lesson[];
  selectedLessonId: string;
  onSelectLesson: (id: string) => void;
  lessonStats: Record<string, LessonStats>;
  duration: SessionDuration;
  onDurationChange: (duration: SessionDuration) => void;
  /** aperçu du contenu de la prochaine session */
  preview: SessionPlan;
  summary: ProgressSummary;
  storageOk: boolean;
  onResetProgress: () => void;
  onStart: () => void;
  onOpenGlossary: () => void;
}

const DURATIONS: SessionDuration[] = [15, 20, 30];

const PHASE_INFO = {
  listen: { t: 'Son & Orthographe', d: 'Écoute et repérage visuel des sons' },
  assembly: { t: 'Assemblage oral', d: 'Construire une réponse naturelle' },
  speak: { t: 'Pratique à voix haute', d: 'Enregistrer, comparer au modèle, s\'auto-évaluer' },
  recap: { t: 'Récapitulatif', d: 'Maîtrisées · à revoir, prochaines révisions' },
} as const;

export function HomeScreen({
  lessons,
  selectedLessonId,
  onSelectLesson,
  lessonStats,
  duration,
  onDurationChange,
  preview,
  summary,
  storageOk,
  onResetProgress,
  onStart,
  onOpenGlossary,
}: Props) {
  const lesson = lessons.find((l) => l.id === selectedLessonId) ?? lessons[0];
  const profile = DURATION_PROFILES[duration];
  const count = (k: 'review' | 'new' | 'consolidation') => preview.phrases.filter((p) => p.kind === k).length;

  const handleReset = () => {
    if (window.confirm('Effacer toute ta progression (phrases maîtrisées, à revoir et historique des sessions) ? Cette action est définitive.')) {
      onResetProgress();
    }
  };

  return (
    <div className="min-h-screen bg-ink-50">
      {/* Header band */}
      <header className="relative overflow-hidden bg-gradient-to-b from-ink-900 to-ink-800 text-ink-50 px-5 pt-12 pb-10 rounded-b-[2rem]">
        <div className="absolute inset-0 opacity-[0.06]" aria-hidden>
          <div className="absolute -top-8 -right-10 w-48 h-48 rounded-full bg-sand-400 blur-3xl" />
          <div className="absolute top-20 -left-12 w-40 h-40 rounded-full bg-terra-500 blur-3xl" />
        </div>

        <div className="relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-sand-400/15 ring-1 ring-sand-400/30 flex items-center justify-center">
                <Headphones className="w-5 h-5 text-sand-300" />
              </div>
              <div>
                <p className="font-display text-lg leading-none tracking-tight">Wax Wolof</p>
                <p className="text-[11px] text-ink-400 tracking-widest uppercase mt-0.5">15 par jour</p>
              </div>
            </div>
            <button
              onClick={onOpenGlossary}
              className="flex items-center gap-1.5 text-sm text-ink-200 hover:text-ink-50 transition-colors tap-highlight-none"
            >
              <BookOpen className="w-4 h-4" />
              Glossaire
            </button>
          </div>

          <div className="mt-9">
            <p className="text-ink-400 text-sm">
              Aujourd'hui · {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
            <p className="text-[11px] text-sand-300 uppercase tracking-widest mt-4">Leçon {lesson.order}</p>
            <h1 className="font-display text-[2rem] leading-[1.1] tracking-tight mt-1">{lesson.title}</h1>
            <p className="text-ink-300 text-[15px] leading-relaxed mt-3 max-w-sm">{lesson.summary}</p>
          </div>
        </div>
      </header>

      <main className="px-5 -mt-6 relative space-y-5 pb-32">
        {!storageOk && (
          <div className="bg-terra-50 ring-1 ring-terra-200 text-terra-800 rounded-2xl p-4 flex items-start gap-2.5 text-sm">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <p>Le stockage local est indisponible (navigation privée ?) : ta progression ne sera pas conservée après fermeture.</p>
          </div>
        )}

        {/* Lesson picker */}
        <section className="bg-white rounded-3xl shadow-soft p-5 animate-fadeIn">
          <div className="flex items-center gap-2 mb-3">
            <Layers className="w-4 h-4 text-terra-600" />
            <h2 className="text-sm font-semibold text-ink-800">Thème de la session</h2>
          </div>
          <div className="space-y-2">
            {lessons.map((l) => {
              const selected = l.id === lesson.id;
              const s = lessonStats[l.id];
              const pct = s ? Math.round((s.mastered / s.total) * 100) : 0;
              return (
                <button
                  key={l.id}
                  onClick={() => onSelectLesson(l.id)}
                  aria-pressed={selected}
                  className={`w-full flex items-center gap-3 rounded-2xl p-3 text-left transition-all tap-highlight-none ${
                    selected ? 'bg-ink-900 text-ink-50 shadow-lift' : 'bg-ink-50 text-ink-700 hover:bg-ink-100'
                  }`}
                >
                  <span
                    className={`flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center text-sm font-semibold ${
                      selected ? 'bg-sand-400/20 text-sand-300' : 'bg-white text-ink-500'
                    }`}
                  >
                    {l.order}
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className={`block text-sm font-semibold ${selected ? 'text-ink-50' : 'text-ink-900'}`}>{l.title}</span>
                    {s && (
                      <span className={`block text-xs mt-0.5 ${selected ? 'text-ink-300' : 'text-ink-400'}`}>
                        {s.mastered}/{s.total} maîtrisées
                        {s.review > 0 ? ` · ${s.review} à revoir` : ''}
                        {s.fresh > 0 ? ` · ${s.fresh} nouvelle${s.fresh > 1 ? 's' : ''}` : ''}
                      </span>
                    )}
                    <span className={`block h-1 rounded-full mt-2 overflow-hidden ${selected ? 'bg-ink-700' : 'bg-ink-200'}`}>
                      <span className="block h-full bg-leaf-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </span>
                  </span>
                  {selected && <CheckCircle2 className="w-4 h-4 text-sand-300 flex-shrink-0" />}
                </button>
              );
            })}
          </div>
        </section>

        {/* Duration selector */}
        <section className="bg-white rounded-3xl shadow-soft p-5 animate-fadeIn">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-sand-600" />
            <h2 className="text-sm font-semibold text-ink-800">Durée de la session du jour</h2>
          </div>
          <div className="grid grid-cols-3 gap-2.5">
            {DURATIONS.map((d) => {
              const selected = duration === d;
              const p = DURATION_PROFILES[d];
              return (
                <button
                  key={d}
                  onClick={() => onDurationChange(d)}
                  aria-pressed={selected}
                  className={`relative rounded-2xl p-3.5 text-left transition-all duration-200 tap-highlight-none ${
                    selected ? 'bg-ink-900 text-ink-50 shadow-lift scale-[1.02]' : 'bg-ink-50 text-ink-700 hover:bg-ink-100'
                  }`}
                >
                  <span className={`block font-display text-xl leading-none ${selected ? 'text-ink-50' : 'text-ink-900'}`}>{d} min</span>
                  <span className={`block text-[11px] mt-1.5 ${selected ? 'text-ink-300' : 'text-ink-400'}`}>{p.label}</span>
                  {selected && <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-sand-400" />}
                </button>
              );
            })}
          </div>

          {/* Content of the next session */}
          <div className="mt-4 rounded-2xl bg-sand-50 ring-1 ring-sand-100 p-3.5">
            <p className="text-xs font-semibold text-ink-800">Au programme</p>
            <p className="text-sm text-ink-700 mt-1">
              {[
                count('review') > 0 && `${count('review')} révision${count('review') > 1 ? 's' : ''} due${count('review') > 1 ? 's' : ''}`,
                count('new') > 0 && `${count('new')} nouvelle${count('new') > 1 ? 's' : ''} phrase${count('new') > 1 ? 's' : ''}`,
                count('consolidation') > 0 && `${count('consolidation')} en consolidation`,
              ]
                .filter(Boolean)
                .join(' · ')}
              {preview.includeAssembly ? ' · assemblage oral' : ''}
            </p>
            {preview.assemblyDeferred && (
              <p className="text-xs text-ink-500 mt-1.5 leading-relaxed">
                Assemblage oral reporté : il sera proposé dès que toutes ses phrases auront été écoutées.
              </p>
            )}
            <p className="text-xs text-ink-500 mt-1.5 leading-relaxed">{profile.pace}</p>
          </div>
        </section>

        {/* Regularity */}
        <section className="bg-white rounded-3xl shadow-soft p-5 animate-fadeIn" style={{ animationDelay: '60ms' }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-ink-500" />
              <h2 className="text-sm font-semibold text-ink-800">Régularité cette semaine</h2>
            </div>
            <div className={`flex items-center gap-1.5 ${summary.streak > 0 ? 'text-terra-600' : 'text-ink-300'}`}>
              <Flame className="w-4 h-4" />
              <span className="text-sm font-semibold">
                {summary.streak} jour{summary.streak > 1 ? 's' : ''}
              </span>
            </div>
          </div>

          <div className="flex justify-between gap-1.5">
            {summary.week.map((d) => (
              <div key={d.date} className="flex-1 flex flex-col items-center gap-2">
                <div
                  className={`w-full aspect-square rounded-xl flex items-center justify-center transition-colors ${
                    d.done
                      ? 'bg-leaf-500 text-white'
                      : d.isToday
                        ? 'bg-white text-ink-500 ring-2 ring-inset ring-sand-400'
                        : 'bg-ink-50 text-ink-300 ring-1 ring-inset ring-ink-100'
                  }`}
                >
                  {d.done ? <CheckCircle2 className="w-4 h-4" /> : <span className="text-[11px]">{d.label}</span>}
                </div>
                <span className={`text-[10px] ${d.isToday ? 'text-ink-700 font-semibold' : 'text-ink-400'}`}>{d.label}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-ink-400 mt-4">
            {summary.daysThisWeek === 0
              ? 'Aucune session cette semaine pour l\'instant. Vise la continuité, pas la perfection.'
              : `${summary.daysThisWeek} jour${summary.daysThisWeek > 1 ? 's' : ''} pratiqué${summary.daysThisWeek > 1 ? 's' : ''} sur 7 cette semaine. Vise la continuité, pas la perfection.`}
          </p>
        </section>

        {/* Mastery indicators */}
        <section className="grid grid-cols-2 gap-3 animate-fadeIn" style={{ animationDelay: '120ms' }}>
          <div className="bg-white rounded-3xl shadow-soft p-4">
            <div className="flex items-center gap-2 mb-2">
              <Mic className="w-4 h-4 text-leaf-600" />
              <span className="text-[11px] font-medium text-ink-500 uppercase tracking-wide">Maîtrisées</span>
            </div>
            <p className="font-display text-3xl text-ink-900 leading-none">{summary.mastered}</p>
            <p className="text-xs text-ink-400 mt-1.5">phrases dites avec aisance</p>
          </div>
          <div className="bg-white rounded-3xl shadow-soft p-4">
            <div className="flex items-center gap-2 mb-2">
              <RotateCcw className="w-4 h-4 text-terra-600" />
              <span className="text-[11px] font-medium text-ink-500 uppercase tracking-wide">À revoir</span>
            </div>
            <p className="font-display text-3xl text-ink-900 leading-none">{summary.review}</p>
            <p className="text-xs text-ink-400 mt-1.5">
              {summary.dueToday > 0
                ? `${summary.dueToday} révision${summary.dueToday > 1 ? 's' : ''} due${summary.dueToday > 1 ? 's' : ''} aujourd'hui`
                : 'aucune révision due aujourd\'hui'}
            </p>
          </div>
        </section>

        {/* Phase preview */}
        <section className="bg-ink-900 text-ink-100 rounded-3xl p-5 animate-fadeIn" style={{ animationDelay: '180ms' }}>
          <p className="text-[11px] uppercase tracking-widest text-ink-400 mb-3">
            Le déroulé en {preview.phases.length} phases · {duration} min
          </p>
          <ul className="space-y-3">
            {preview.phases.map((p, i) => (
              <li key={p} className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-lg bg-sand-400/15 ring-1 ring-sand-400/25 flex items-center justify-center text-sand-300 text-xs font-semibold">
                  {i + 1}
                </span>
                <div>
                  <p className="text-sm font-medium text-ink-50">{PHASE_INFO[p].t}</p>
                  <p className="text-xs text-ink-400 mt-0.5">{PHASE_INFO[p].d}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        {summary.totalSessions > 0 || summary.mastered + summary.review > 0 ? (
          <div className="text-center">
            <button onClick={handleReset} className="text-xs text-ink-400 underline underline-offset-2 hover:text-terra-600 tap-highlight-none">
              Réinitialiser ma progression
            </button>
          </div>
        ) : null}
      </main>

      {/* Sticky start button */}
      <div className="fixed bottom-0 inset-x-0 bg-gradient-to-t from-ink-50 via-ink-50/95 to-transparent pt-6 pb-[max(1rem,env(safe-area-inset-bottom))] px-5">
        <button
          onClick={onStart}
          className="w-full bg-terra-600 hover:bg-terra-700 active:scale-[0.98] text-white rounded-2xl py-4 px-5 flex items-center justify-center gap-2.5 shadow-lift transition-all tap-highlight-none"
        >
          <span className="font-semibold text-[15px]">Démarrer la session · {duration} min</span>
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
