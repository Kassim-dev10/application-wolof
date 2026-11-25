/**
 * Composition d'une session selon la durée choisie et la progression :
 * révisions dues d'abord (toutes leçons confondues), puis nouvelles phrases
 * de la leçon choisie, complétées par de la consolidation si la leçon est
 * déjà entièrement vue.
 */
import type { Lesson, LessonPhrase } from '@/data/lessons';
import type { SessionDuration } from '@/lib/highlights';
import { isDue, type PhraseProgress, type ProgressState } from '@/lib/progress';

export interface DurationProfile {
  duration: SessionDuration;
  label: string;
  /** phrases de la leçon choisie (nouvelles, ou consolidation) */
  lessonPhrases: number;
  /** révisions dues au maximum */
  reviewPhrases: number;
  includeAssembly: boolean;
  /** les phrases jugées « À revoir » repassent une seconde fois en fin de pratique */
  secondPass: boolean;
  /** écoutes conseillées par phrase en phase 1 */
  listenTarget: number;
  /** commencer chaque phrase par la lecture lente */
  slowFirst: boolean;
  /** rythme, en une phrase */
  pace: string;
}

export const DURATION_PROFILES: Record<SessionDuration, DurationProfile> = {
  15: {
    duration: 15,
    label: 'Essentiel',
    lessonPhrases: 3,
    reviewPhrases: 2,
    includeAssembly: false,
    secondPass: false,
    listenTarget: 1,
    slowFirst: false,
    pace: 'Rythme soutenu : une écoute par phrase, puis directement la pratique orale.',
  },
  20: {
    duration: 20,
    label: 'Équilibré',
    lessonPhrases: 4,
    reviewPhrases: 3,
    includeAssembly: true,
    secondPass: false,
    listenTarget: 2,
    slowFirst: false,
    pace: 'Deux écoutes par phrase, un assemblage oral, puis la pratique à voix haute.',
  },
  30: {
    duration: 30,
    label: 'Approfondi',
    lessonPhrases: 6,
    reviewPhrases: 6,
    includeAssembly: true,
    secondPass: true,
    listenTarget: 2,
    slowFirst: true,
    pace: 'Écoute lente puis normale, assemblage, et second passage oral sur les phrases à revoir.',
  },
};

export type PhaseKind = 'listen' | 'assembly' | 'speak' | 'recap';

export type PlannedKind = 'review' | 'new' | 'consolidation';

export interface PlannedPhrase {
  phrase: LessonPhrase;
  lessonId: string;
  lessonTitle: string;
  kind: PlannedKind;
}

export interface SessionPlan {
  id: string;
  lesson: Lesson;
  duration: SessionDuration;
  profile: DurationProfile;
  phrases: PlannedPhrase[];
  includeAssembly: boolean;
  /** assemblage prévu par la durée mais reporté : certaines de ses phrases n'ont pas encore été vues */
  assemblyDeferred: boolean;
  phases: PhaseKind[];
}

export function buildSessionPlan(
  lesson: Lesson,
  allLessons: Lesson[],
  duration: SessionDuration,
  progress: ProgressState,
  today: string,
): SessionPlan {
  const profile = DURATION_PROFILES[duration];

  // 1. Révisions dues : « À revoir » d'abord, puis les plus en retard
  const due = allLessons
    .flatMap((l) => l.phrases.map((phrase) => ({ phrase, lesson: l, p: progress.phrases[phrase.id] })))
    .filter((x): x is { phrase: LessonPhrase; lesson: Lesson; p: PhraseProgress } => !!x.p && isDue(x.p, today))
    .sort((a, b) => {
      if (a.p.status !== b.p.status) return a.p.status === 'review' ? -1 : 1;
      return a.p.nextReviewOn.localeCompare(b.p.nextReviewOn);
    })
    .slice(0, profile.reviewPhrases);

  const taken = new Set(due.map((x) => x.phrase.id));

  // 2. Nouvelles phrases de la leçon. Si l'assemblage est prévu, ses phrases
  //    encore jamais vues passent en premier : l'exercice ne doit porter que
  //    sur des phrases déjà rencontrées.
  const wantsAssembly = profile.includeAssembly && !!lesson.assembly;
  const assemblySteps = new Set(wantsAssembly ? lesson.assembly!.steps : []);
  const unseen = lesson.phrases.filter((p) => !progress.phrases[p.id] && !taken.has(p.id));
  const fresh = [...unseen.filter((p) => assemblySteps.has(p.id)), ...unseen.filter((p) => !assemblySteps.has(p.id))].slice(
    0,
    profile.lessonPhrases,
  );
  fresh.forEach((p) => taken.add(p.id));

  // 3. Consolidation : phrases déjà vues de la leçon, les moins récemment pratiquées
  const consolidation =
    fresh.length < profile.lessonPhrases
      ? lesson.phrases
          .filter((p) => !taken.has(p.id))
          .sort((a, b) =>
            (progress.phrases[a.id]?.lastPracticedOn ?? '').localeCompare(progress.phrases[b.id]?.lastPracticedOn ?? ''),
          )
          .slice(0, profile.lessonPhrases - fresh.length)
      : [];

  // Phrases de la leçon remises dans l'ordre de la leçon
  const lessonOrder = new Map(lesson.phrases.map((p, i) => [p.id, i]));
  const lessonPart: PlannedPhrase[] = [
    ...fresh.map((phrase) => ({ phrase, kind: 'new' as const })),
    ...consolidation.map((phrase) => ({ phrase, kind: 'consolidation' as const })),
  ]
    .sort((a, b) => (lessonOrder.get(a.phrase.id) ?? 0) - (lessonOrder.get(b.phrase.id) ?? 0))
    .map((x) => ({ ...x, lessonId: lesson.id, lessonTitle: lesson.title }));

  const reviewPart: PlannedPhrase[] = due.map((x) => ({
    phrase: x.phrase,
    lessonId: x.lesson.id,
    lessonTitle: x.lesson.title,
    kind: 'review',
  }));

  // Garde-fou : l'assemblage n'est proposé que si chacune de ses phrases est
  // présentée dans cette session ou a déjà été travaillée auparavant.
  const met = new Set([...taken, ...Object.keys(progress.phrases)]);
  const unmetSteps = wantsAssembly ? lesson.assembly!.steps.filter((id) => !met.has(id)) : [];
  const includeAssembly = wantsAssembly && unmetSteps.length === 0;

  return {
    id: `${today}-${lesson.id}-${duration}-${Date.now()}`,
    lesson,
    duration,
    profile,
    // Les révisions servent d'échauffement, puis on attaque la leçon
    phrases: [...reviewPart, ...lessonPart],
    includeAssembly,
    assemblyDeferred: wantsAssembly && !includeAssembly,
    phases: ['listen', ...(includeAssembly ? (['assembly'] as const) : []), 'speak', 'recap'],
  };
}

export const PLANNED_KIND_LABEL: Record<PlannedKind, string> = {
  review: 'Révision',
  new: 'Nouvelle',
  consolidation: 'Consolidation',
};
