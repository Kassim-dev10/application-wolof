import { CalendarDays, Check, CheckCircle2, Clock, Flame, RotateCcw, Trophy } from 'lucide-react';
import type { Lesson } from '@/data/lessons';
import { parseDateKey, type LessonStats, type ProgressSummary, type SessionRecord } from '@/lib/progress';
import type { MicroLesson, MicroStatus } from '@/lib/microLessons';

interface Props {
  lessons: Lesson[];
  chapters: MicroLesson[][];
  statuses: Record<string, MicroStatus>;
  lessonStats: Record<string, LessonStats>;
  summary: ProgressSummary;
  sessions: SessionRecord[];
  onResetProgress: () => void;
}

export function ProgressScreen({ lessons, chapters, statuses, lessonStats, summary, sessions, onResetProgress }: Props) {
  const microDone = (ci: number) => (chapters[ci] ?? []).filter((m) => statuses[m.id] === 'done').length;
  const allMicro = chapters.flat();
  const totalDone = allMicro.filter((m) => statuses[m.id] === 'done').length;
  const recent = [...sessions].slice(-6).reverse();
  const titleOf = (id: string) => lessons.find((l) => l.id === id)?.title ?? 'Thème retiré';
  const total = lessons.reduce((n, l) => n + l.phrases.length, 0);
  const mastered = lessons.reduce((n, l) => n + (lessonStats[l.id]?.mastered ?? 0), 0);
  const hasProgress = summary.totalSessions > 0 || summary.mastered + summary.review > 0 || totalDone > 0;

  const handleReset = () => {
    if (window.confirm('Effacer toute ta progression (phrases maîtrisées, à revoir, micro-leçons terminées et historique des sessions) ? Cette action est définitive.')) {
      onResetProgress();
    }
  };

  return (
    <div className="space-y-5">
      <header className="animate-fadeIn">
        <p className="eyebrow">Ton suivi</p>
        <h1 className="font-display text-3xl font-bold text-ink-900 mt-1">Progrès</h1>
      </header>

      {/* Série et semaine */}
      <section className="card p-5 animate-fadeIn">
        <div className="flex items-center gap-4">
          <span
            className={`w-16 h-16 rounded-3xl flex items-center justify-center ${
              summary.streak > 0 ? 'bg-ochre-100 text-ochre-600' : 'bg-ink-50 text-ink-300'
            }`}
          >
            <Flame className="w-9 h-9" fill={summary.streak > 0 ? 'currentColor' : 'none'} />
          </span>
          <div>
            <p className="font-display text-4xl font-bold text-ink-900 leading-none">{summary.streak}</p>
            <p className="text-sm font-semibold text-ink-500 mt-1">
              jour{summary.streak > 1 ? 's' : ''} d'affilée
            </p>
          </div>
        </div>

        <div className="mt-5">
          <p className="flex items-center gap-1.5 text-sm font-bold text-ink-800 mb-3">
            <CalendarDays className="w-4 h-4 text-ink-400" />
            Cette semaine
          </p>
          <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
            {summary.week.map((d) => (
              <div key={d.date} className="flex flex-col items-center gap-1.5">
                <span
                  className={`w-full aspect-square max-w-[3rem] rounded-2xl flex items-center justify-center ${
                    d.done
                      ? 'bg-emerald-500 text-white shadow-[0_3px_0_0_theme(colors.emerald.700)]'
                      : d.isToday
                        ? 'bg-white ring-2 ring-ochre-400 text-ochre-700'
                        : 'bg-cream-200 text-ink-300'
                  }`}
                >
                  {d.done ? <Check className="w-5 h-5" strokeWidth={3} /> : <span className="text-xs font-bold">{d.label}</span>}
                </span>
                <span className={`text-[10px] font-bold ${d.isToday ? 'text-ink-800' : 'text-ink-400'}`}>{d.label}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-ink-500 mt-4 leading-relaxed">
            {summary.daysThisWeek === 0
              ? 'Aucune session cette semaine pour l\'instant. Vise la continuité, pas la perfection.'
              : `${summary.daysThisWeek} jour${summary.daysThisWeek > 1 ? 's' : ''} pratiqué${summary.daysThisWeek > 1 ? 's' : ''} sur 7. Vise la continuité, pas la perfection.`}
          </p>
        </div>
      </section>

      {/* Chiffres clés */}
      <section className="grid grid-cols-3 gap-3 animate-fadeIn" style={{ animationDelay: '60ms' }}>
        <Stat icon={<CheckCircle2 className="w-5 h-5" />} tone="emerald" value={mastered} label="maîtrisées" sub={`sur ${total}`} />
        <Stat icon={<RotateCcw className="w-5 h-5" />} tone="ochre" value={summary.review} label="à revoir" sub={summary.dueToday > 0 ? `${summary.dueToday} dues auj.` : 'rien de dû'} />
        <Stat icon={<Trophy className="w-5 h-5" />} tone="ink" value={totalDone} label="leçons" sub={`sur ${allMicro.length} · ${summary.totalSessions} sessions`} />
      </section>

      {/* Par thème */}
      <section className="card p-5 animate-fadeIn" style={{ animationDelay: '120ms' }}>
        <h2 className="text-sm font-bold text-ink-800 mb-4">Par chapitre</h2>
        <ul className="space-y-4">
          {lessons.map((l, ci) => {
            const s = lessonStats[l.id];
            const t = s?.total ?? l.phrases.length;
            return (
              <li key={l.id}>
                <div className="flex items-baseline justify-between gap-2 mb-1.5">
                  <span className="text-sm font-semibold text-ink-800 truncate">
                    <span className="text-ink-400 tabular-nums mr-2">{String(l.order).padStart(2, '0')}</span>
                    {l.title}
                  </span>
                  <span className="text-xs font-bold text-ink-500 tabular-nums flex-shrink-0">
                    {microDone(ci)}/{chapters[ci]?.length ?? 0} leçons · {s?.mastered ?? 0}/{t}
                  </span>
                </div>
                <div className="h-2.5 rounded-full bg-cream-200 overflow-hidden flex">
                  <span className="h-full bg-emerald-500" style={{ width: `${t ? ((s?.mastered ?? 0) / t) * 100 : 0}%` }} />
                  <span className="h-full bg-ochre-300" style={{ width: `${t ? ((s?.review ?? 0) / t) * 100 : 0}%` }} />
                </div>
              </li>
            );
          })}
        </ul>
        <div className="flex items-center gap-4 mt-4 text-[11px] font-semibold text-ink-500">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Maîtrisées
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-ochre-300" /> À revoir
          </span>
        </div>
      </section>

      {/* Historique */}
      <section className="card p-5 animate-fadeIn" style={{ animationDelay: '180ms' }}>
        <h2 className="text-sm font-bold text-ink-800 mb-3">Dernières sessions</h2>
        {recent.length === 0 ? (
          <p className="text-sm text-ink-400">Aucune session terminée pour l'instant.</p>
        ) : (
          <ul className="divide-y divide-cream-200">
            {recent.map((s) => (
              <li key={s.id} className="py-3 flex items-center gap-3">
                <span className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center flex-shrink-0">
                  <Clock className="w-[18px] h-[18px]" />
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-ink-800 truncate">{titleOf(s.lessonId)}</p>
                  <p className="text-xs text-ink-500">
                    {parseDateKey(s.date).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })} · {s.duration} min
                  </p>
                </div>
                <span className="text-xs font-bold text-emerald-700 tabular-nums">{s.mastered}✓</span>
                <span className="text-xs font-bold text-ochre-700 tabular-nums">{s.review}↻</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {hasProgress && (
        <div className="text-center pt-2">
          <button onClick={handleReset} className="text-xs font-semibold text-ink-400 underline underline-offset-4 hover:text-terra-600 tap-highlight-none">
            Réinitialiser ma progression
          </button>
        </div>
      )}
    </div>
  );
}

const STAT_TONES = {
  emerald: 'bg-emerald-50 text-emerald-700',
  ochre: 'bg-ochre-50 text-ochre-700',
  ink: 'bg-ink-50 text-ink-600',
} as const;

function Stat({ icon, tone, value, label, sub }: { icon: React.ReactNode; tone: keyof typeof STAT_TONES; value: number; label: string; sub: string }) {
  return (
    <div className="card p-4">
      <span className={`w-9 h-9 rounded-xl flex items-center justify-center ${STAT_TONES[tone]}`}>{icon}</span>
      <p className="font-display text-3xl font-bold text-ink-900 leading-none mt-3">{value}</p>
      <p className="text-xs font-bold text-ink-700 mt-1">{label}</p>
      <p className="text-[11px] text-ink-400 mt-0.5">{sub}</p>
    </div>
  );
}
