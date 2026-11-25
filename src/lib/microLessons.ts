/**
 * Découpage automatique de chaque thème (chapitre) en micro-leçons progressives.
 *
 * - Jusqu'à 12 phrases : 2 leçons de découverte (« Découverte 1/2 » : première moitié,
 *   « Découverte 2/2 » : seconde moitié).
 * - Au-delà : des leçons de découverte par lots de 3 à 4 phrases, de tailles équilibrées.
 * - Puis « Atelier oral » (tout le thème : écoute normale/lente, micro, réécoute) et
 *   « Défi du chapitre » (le français s'affiche, on le dit en wolof à voix haute ;
 *   les phrases « À revoir » passent en premier).
 *
 * Les identifiants (« 01-salutations/d1 », « …/oral », « …/defi ») servent de clé de
 * sauvegarde : ils ne dépendent que de l'identifiant du thème et du rang du lot.
 */
import type { Lesson, LessonPhrase } from '@/data/lessons';

export type MicroKind = 'discover' | 'oral' | 'challenge';

export interface MicroLesson {
  id: string;
  lessonId: string;
  kind: MicroKind;
  /** rang dans le chapitre, à partir de 1 */
  index: number;
  title: string;
  subtitle: string;
  phrases: LessonPhrase[];
}

/**
 * Au-delà de ce nombre de phrases, la découverte passe en lots de 3 à 4.
 * 12 (moitiés de 6 au plus) : le thème 01 (11 phrases) garde ses 4 micro-leçons.
 */
export const HALVES_MAX_PHRASES = 12;
export const BATCH_MAX = 4;
/** Part de bonnes réponses pour valider le défi. */
export const CHALLENGE_PASS_RATIO = 0.8;

/** Tailles des lots de découverte, dans l'ordre des phrases. */
export function discoveryBatchSizes(n: number): number[] {
  if (n <= 0) return [];
  if (n === 1) return [1];
  if (n <= HALVES_MAX_PHRASES) {
    const first = Math.ceil(n / 2);
    return [first, n - first];
  }
  const batches = Math.ceil(n / BATCH_MAX);
  const base = Math.floor(n / batches);
  const extra = n % batches;
  return Array.from({ length: batches }, (_, i) => base + (i < extra ? 1 : 0));
}

export function buildMicroLessons(lesson: Lesson): MicroLesson[] {
  const sizes = discoveryBatchSizes(lesson.phrases.length);
  const out: MicroLesson[] = [];
  let start = 0;
  sizes.forEach((size, i) => {
    const phrases = lesson.phrases.slice(start, start + size);
    start += size;
    out.push({
      id: `${lesson.id}/d${i + 1}`,
      lessonId: lesson.id,
      kind: 'discover',
      index: out.length + 1,
      title: sizes.length > 1 ? `Découverte ${i + 1}/${sizes.length}` : 'Découverte',
      subtitle: `${phrases.length} phrase${phrases.length > 1 ? 's' : ''} à écouter et reconnaître`,
      phrases,
    });
  });
  out.push({
    id: `${lesson.id}/oral`,
    lessonId: lesson.id,
    kind: 'oral',
    index: out.length + 1,
    title: 'Atelier oral',
    subtitle: 'Écoute normale et lente, micro, réécoute',
    phrases: lesson.phrases,
  });
  out.push({
    id: `${lesson.id}/defi`,
    lessonId: lesson.id,
    kind: 'challenge',
    index: out.length + 1,
    title: 'Défi du chapitre',
    subtitle: 'Du français au wolof, à voix haute',
    phrases: lesson.phrases,
  });
  return out;
}

/** Mélange déterministe (graine textuelle), pour un ordre stable d'un rendu à l'autre. */
export function seededShuffle<T>(items: T[], seed: string): T[] {
  let h = [...seed].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 2166136261);
  const rand = () => {
    h = (h + 0x6d2b79f5) >>> 0;
    let t = h;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * Ordre du défi : les phrases « À revoir » d'abord, puis les autres, chaque groupe mélangé.
 */
export function challengeOrder(
  phrases: LessonPhrase[],
  statusOf: (phraseId: string) => 'mastered' | 'review' | undefined,
  seed: string,
): LessonPhrase[] {
  const review = phrases.filter((p) => statusOf(p.id) === 'review');
  const others = phrases.filter((p) => statusOf(p.id) !== 'review');
  return [...seededShuffle(review, `${seed}:revoir`), ...seededShuffle(others, `${seed}:autres`)];
}

/**
 * Propositions d'un QCM : la bonne réponse et jusqu'à 2 leurres pris dans le même
 * chapitre (puis ailleurs si besoin), sans doublon de texte.
 */
export function quizOptions(answer: LessonPhrase, pool: LessonPhrase[], field: 'wolof' | 'french', seed: string): LessonPhrase[] {
  const seen = new Set([answer[field].trim().toLowerCase()]);
  const distractors: LessonPhrase[] = [];
  for (const p of seededShuffle(pool, `${seed}:${answer.id}`)) {
    const key = p[field].trim().toLowerCase();
    if (p.id === answer.id || seen.has(key)) continue;
    seen.add(key);
    distractors.push(p);
    if (distractors.length === 2) break;
  }
  return seededShuffle([answer, ...distractors], `${seed}:opts:${answer.id}`);
}

// ───────────── Progression par micro-leçon ─────────────

export interface MicroProgress {
  /** date (AAAA-MM-JJ) de la première validation */
  completedOn: string;
  /** dernière date de pratique */
  lastOn: string;
  attempts: number;
  /** meilleur score du défi, 0..1 */
  bestScore?: number;
}

export interface MicroProgressState {
  version: 1;
  lessons: Record<string, MicroProgress>;
  /** jours où au moins une micro-leçon a été terminée (pour la série de jours) */
  days: string[];
}

export type MicroStatus = 'done' | 'recommended' | 'todo';

export const createInitialMicroProgress = (): MicroProgressState => ({ version: 1, lessons: {}, days: [] });

const isDateKey = (v: unknown): v is string => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v);

/** Lecture défensive : les entrées invalides sont ignorées une à une. */
export function sanitizeMicroProgress(data: unknown): MicroProgressState {
  const base = createInitialMicroProgress();
  if (!data || typeof data !== 'object') return base;
  const d = data as Record<string, unknown>;
  if (d.lessons && typeof d.lessons === 'object') {
    for (const [id, raw] of Object.entries(d.lessons as Record<string, unknown>)) {
      if (!raw || typeof raw !== 'object') continue;
      const p = raw as Record<string, unknown>;
      if (!isDateKey(p.completedOn) || !isDateKey(p.lastOn)) continue;
      const attempts = typeof p.attempts === 'number' && p.attempts >= 1 ? Math.floor(p.attempts) : 1;
      const bestScore = typeof p.bestScore === 'number' && p.bestScore >= 0 && p.bestScore <= 1 ? p.bestScore : undefined;
      base.lessons[id] = { completedOn: p.completedOn, lastOn: p.lastOn, attempts, ...(bestScore !== undefined ? { bestScore } : {}) };
    }
  }
  if (Array.isArray(d.days)) base.days = [...new Set(d.days.filter(isDateKey))].sort().slice(-400);
  return base;
}

/**
 * Enregistre une tentative. `passed` à false (défi raté) garde la trace du score
 * sans valider la leçon.
 */
export function applyMicroAttempt(
  state: MicroProgressState,
  microId: string,
  today: string,
  passed: boolean,
  score?: number,
): MicroProgressState {
  const prev = state.lessons[microId];
  const bestScore = score === undefined ? prev?.bestScore : Math.max(score, prev?.bestScore ?? 0);
  const days = state.days.includes(today) ? state.days : [...state.days, today].slice(-400);
  if (!passed && !prev) {
    // Défi raté sans validation antérieure : seule la pratique du jour est comptée
    return { ...state, days };
  }
  return {
    ...state,
    days,
    lessons: {
      ...state.lessons,
      [microId]: {
        completedOn: prev?.completedOn ?? today,
        lastOn: today,
        attempts: (prev?.attempts ?? 0) + 1,
        ...(bestScore !== undefined ? { bestScore } : {}),
      },
    },
  };
}

/** Statut de chaque micro-leçon : la première non terminée (dans l'ordre du parcours) est recommandée. */
export function microStatuses(chapters: MicroLesson[][], state: MicroProgressState): Record<string, MicroStatus> {
  const out: Record<string, MicroStatus> = {};
  let recommended = false;
  for (const micro of chapters.flat()) {
    if (state.lessons[micro.id]) out[micro.id] = 'done';
    else if (!recommended) {
      out[micro.id] = 'recommended';
      recommended = true;
    } else out[micro.id] = 'todo';
  }
  return out;
}
