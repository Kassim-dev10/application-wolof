/**
 * Progression de l'apprenant : statut de chaque phrase, révisions espacées
 * et historique des sessions. Fonctions pures, sans accès au stockage :
 * la persistance est gérée par `progressStore.ts`.
 *
 * Les dates sont des clés locales « AAAA-MM-JJ » : une révision « demain »
 * tombe le lendemain dans le fuseau de l'apprenant, quelle que soit l'heure.
 */
import type { Lesson } from '@/data/lessons';
import type { SessionDuration } from '@/lib/highlights';

/** Auto-évaluation d'une phrase pratiquée à voix haute. */
export type SpeakingResult = 'mastered' | 'review';

export interface PhraseProgress {
  status: SpeakingResult;
  /** nombre total d'auto-évaluations */
  attempts: number;
  /** nombre de jours distincts consécutifs où la phrase a été jugée maîtrisée */
  masteredStreak: number;
  lastPracticedOn: string;
  /** date à partir de laquelle la phrase revient en révision */
  nextReviewOn: string;
}

export interface SessionRecord {
  id: string;
  date: string;
  completedAt: string;
  lessonId: string;
  duration: SessionDuration;
  /** phrases évaluées à voix haute pendant la session */
  practiced: number;
  mastered: number;
  review: number;
}

export interface ProgressState {
  version: 1;
  preferredDuration: SessionDuration;
  lastLessonId: string | null;
  phrases: Record<string, PhraseProgress>;
  sessions: SessionRecord[];
}

/** « À revoir » : la phrase revient le lendemain. */
export const REVIEW_INTERVAL_DAYS = 1;
/** « Maîtrisée » : 3 jours, puis 7, puis 21 jours si elle reste maîtrisée. */
export const MASTERED_INTERVALS_DAYS = [3, 7, 21];
/** Historique conservé (au-delà, les plus anciennes sessions sont oubliées). */
export const MAX_SESSIONS = 400;

const DURATIONS: SessionDuration[] = [15, 20, 30];

// ───────────── Dates ─────────────

export function dateKey(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function parseDateKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(key: string, days: number): string {
  const d = parseDateKey(key);
  d.setDate(d.getDate() + days);
  return dateKey(d);
}

/** Nombre de jours entre deux clés (b − a). */
export function daysBetween(a: string, b: string): number {
  return Math.round((parseDateKey(b).getTime() - parseDateKey(a).getTime()) / 86_400_000);
}

const isDateKey = (v: unknown): v is string => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v);

// ───────────── État ─────────────

export function createInitialProgress(): ProgressState {
  return { version: 1, preferredDuration: 15, lastLessonId: null, phrases: {}, sessions: [] };
}

/** Enregistre une auto-évaluation et calcule la prochaine révision. */
export function applyResult(state: ProgressState, phraseId: string, result: SpeakingResult, today: string): ProgressState {
  const prev = state.phrases[phraseId];
  let streak: number;
  let interval: number;

  if (result === 'mastered') {
    if (prev?.status === 'mastered' && prev.lastPracticedOn === today) {
      streak = prev.masteredStreak; // déjà maîtrisée aujourd'hui : pas d'accélération artificielle
    } else {
      streak = (prev?.status === 'mastered' ? prev.masteredStreak : 0) + 1;
    }
    interval = MASTERED_INTERVALS_DAYS[Math.min(streak, MASTERED_INTERVALS_DAYS.length) - 1];
  } else {
    streak = 0;
    interval = REVIEW_INTERVAL_DAYS;
  }

  return {
    ...state,
    phrases: {
      ...state.phrases,
      [phraseId]: {
        status: result,
        attempts: (prev?.attempts ?? 0) + 1,
        masteredStreak: streak,
        lastPracticedOn: today,
        nextReviewOn: addDays(today, interval),
      },
    },
  };
}

export function isDue(p: PhraseProgress, today: string): boolean {
  return p.nextReviewOn <= today;
}

export function recordSession(state: ProgressState, record: SessionRecord): ProgressState {
  return { ...state, sessions: [...state.sessions, record].slice(-MAX_SESSIONS) };
}

// ───────────── Indicateurs ─────────────

/** Jours consécutifs avec au moins une session, jusqu'à aujourd'hui (ou hier si rien aujourd'hui). */
export function computeStreak(sessions: SessionRecord[], today: string): number {
  const days = new Set(sessions.map((s) => s.date));
  let cursor = days.has(today) ? today : addDays(today, -1);
  let n = 0;
  while (days.has(cursor)) {
    n++;
    cursor = addDays(cursor, -1);
  }
  return n;
}

export interface WeekDay {
  date: string;
  label: string;
  done: boolean;
  isToday: boolean;
  isFuture: boolean;
}

const WEEK_LABELS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

/** Semaine en cours, du lundi au dimanche. */
export function weekRegularity(sessions: SessionRecord[], today: string): WeekDay[] {
  const days = new Set(sessions.map((s) => s.date));
  const weekday = (parseDateKey(today).getDay() + 6) % 7; // lundi = 0
  const monday = addDays(today, -weekday);
  return WEEK_LABELS.map((label, i) => {
    const date = addDays(monday, i);
    return { date, label, done: days.has(date), isToday: date === today, isFuture: date > today };
  });
}

export interface ProgressSummary {
  mastered: number;
  review: number;
  /** phrases dont la révision est due aujourd'hui (ou en retard) */
  dueToday: number;
  streak: number;
  week: WeekDay[];
  daysThisWeek: number;
  totalSessions: number;
}

export function summarize(state: ProgressState, today: string): ProgressSummary {
  const entries = Object.values(state.phrases);
  const week = weekRegularity(state.sessions, today);
  return {
    mastered: entries.filter((p) => p.status === 'mastered').length,
    review: entries.filter((p) => p.status === 'review').length,
    dueToday: entries.filter((p) => isDue(p, today)).length,
    streak: computeStreak(state.sessions, today),
    week,
    daysThisWeek: week.filter((d) => d.done).length,
    totalSessions: state.sessions.length,
  };
}

export interface LessonStats {
  total: number;
  mastered: number;
  review: number;
  /** jamais pratiquées */
  fresh: number;
}

export function lessonStats(lesson: Lesson, state: ProgressState): LessonStats {
  let mastered = 0;
  let review = 0;
  for (const p of lesson.phrases) {
    const s = state.phrases[p.id]?.status;
    if (s === 'mastered') mastered++;
    else if (s === 'review') review++;
  }
  return { total: lesson.phrases.length, mastered, review, fresh: lesson.phrases.length - mastered - review };
}

/** Texte court pour la prochaine révision : « demain », « dans 3 jours »… */
export function describeNextReview(nextReviewOn: string, today: string): string {
  const n = daysBetween(today, nextReviewOn);
  if (n <= 0) return 'aujourd\'hui';
  if (n === 1) return 'demain';
  return `dans ${n} jours`;
}

// ───────────── Lecture défensive des données stockées ─────────────

/**
 * Reconstruit un état valide à partir de données inconnues (stockage
 * corrompu, ancienne version, édition manuelle). Les entrées invalides sont
 * ignorées une par une plutôt que de tout perdre.
 */
export function sanitizeProgress(data: unknown): ProgressState {
  const base = createInitialProgress();
  if (!data || typeof data !== 'object') return base;
  const d = data as Record<string, unknown>;

  const preferredDuration = DURATIONS.includes(d.preferredDuration as SessionDuration)
    ? (d.preferredDuration as SessionDuration)
    : base.preferredDuration;
  const lastLessonId = typeof d.lastLessonId === 'string' ? d.lastLessonId : null;

  const phrases: Record<string, PhraseProgress> = {};
  if (d.phrases && typeof d.phrases === 'object') {
    for (const [id, raw] of Object.entries(d.phrases as Record<string, unknown>)) {
      if (!raw || typeof raw !== 'object') continue;
      const p = raw as Record<string, unknown>;
      if (
        (p.status === 'mastered' || p.status === 'review') &&
        isDateKey(p.lastPracticedOn) &&
        isDateKey(p.nextReviewOn)
      ) {
        phrases[id] = {
          status: p.status,
          attempts: typeof p.attempts === 'number' && p.attempts > 0 ? Math.floor(p.attempts) : 1,
          masteredStreak: typeof p.masteredStreak === 'number' && p.masteredStreak >= 0 ? Math.floor(p.masteredStreak) : 0,
          lastPracticedOn: p.lastPracticedOn,
          nextReviewOn: p.nextReviewOn,
        };
      }
    }
  }

  const sessions: SessionRecord[] = [];
  if (Array.isArray(d.sessions)) {
    for (const raw of d.sessions) {
      if (!raw || typeof raw !== 'object') continue;
      const s = raw as Record<string, unknown>;
      if (
        typeof s.id === 'string' &&
        isDateKey(s.date) &&
        typeof s.completedAt === 'string' &&
        typeof s.lessonId === 'string' &&
        DURATIONS.includes(s.duration as SessionDuration)
      ) {
        const n = (v: unknown) => (typeof v === 'number' && v >= 0 ? Math.floor(v) : 0);
        sessions.push({
          id: s.id,
          date: s.date,
          completedAt: s.completedAt,
          lessonId: s.lessonId,
          duration: s.duration as SessionDuration,
          practiced: n(s.practiced),
          mastered: n(s.mastered),
          review: n(s.review),
        });
      }
    }
  }

  return { version: 1, preferredDuration, lastLessonId, phrases, sessions: sessions.slice(-MAX_SESSIONS) };
}
