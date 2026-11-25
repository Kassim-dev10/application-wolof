/**
 * Auto-tests de la logique de révision et de composition des sessions,
 * exécutés par `npm run check:wolof`.
 */
import { lessons } from '@/data/lessons';
import {
  addDays,
  applyResult,
  computeStreak,
  createInitialProgress,
  recordSession,
  sanitizeProgress,
  weekRegularity,
  type ProgressState,
  type SessionRecord,
} from '@/lib/progress';
import { buildSessionPlan } from '@/lib/sessionPlan';

export interface ProgressFixtureFailure {
  name: string;
  problem: string;
}

const TODAY = '2026-11-24'; // un mardi

function session(date: string): SessionRecord {
  return { id: date, date, completedAt: `${date}T10:00:00.000Z`, lessonId: lessons[0].id, duration: 15, practiced: 1, mastered: 1, review: 0 };
}

const cases: { name: string; run: () => string | null }[] = [
  {
    name: 'À revoir → révision le lendemain',
    run: () => {
      const s = applyResult(createInitialProgress(), 'x', 'review', TODAY);
      return s.phrases.x.nextReviewOn === '2026-11-25' ? null : `obtenu ${s.phrases.x.nextReviewOn}`;
    },
  },
  {
    name: 'Maîtrisée : 3, puis 7, puis 21 jours',
    run: () => {
      let s = applyResult(createInitialProgress(), 'x', 'mastered', TODAY);
      const a = s.phrases.x.nextReviewOn;
      s = applyResult(s, 'x', 'mastered', a);
      const b = s.phrases.x.nextReviewOn;
      s = applyResult(s, 'x', 'mastered', b);
      const c = s.phrases.x.nextReviewOn;
      s = applyResult(s, 'x', 'mastered', c);
      const d = s.phrases.x.nextReviewOn;
      const ok = a === addDays(TODAY, 3) && b === addDays(a, 7) && c === addDays(b, 21) && d === addDays(c, 21);
      return ok ? null : `obtenu ${a}, ${b}, ${c}, ${d}`;
    },
  },
  {
    name: 'À revoir remet la série de maîtrise à zéro',
    run: () => {
      let s = applyResult(createInitialProgress(), 'x', 'mastered', TODAY);
      s = applyResult(s, 'x', 'review', addDays(TODAY, 3));
      s = applyResult(s, 'x', 'mastered', addDays(TODAY, 4));
      return s.phrases.x.nextReviewOn === addDays(TODAY, 7) && s.phrases.x.attempts === 3 ? null : JSON.stringify(s.phrases.x);
    },
  },
  {
    name: 'Deux « Maîtrisée » le même jour n\'accélèrent pas la révision',
    run: () => {
      let s = applyResult(createInitialProgress(), 'x', 'mastered', TODAY);
      s = applyResult(s, 'x', 'mastered', TODAY);
      return s.phrases.x.nextReviewOn === addDays(TODAY, 3) ? null : `obtenu ${s.phrases.x.nextReviewOn}`;
    },
  },
  {
    name: 'Série de jours consécutifs (hier compte si rien aujourd\'hui)',
    run: () => {
      const sessions = ['2026-11-21', '2026-11-22', '2026-11-23'].map(session);
      const a = computeStreak(sessions, TODAY);
      const b = computeStreak([...sessions, session(TODAY)], TODAY);
      const c = computeStreak([session('2026-11-20')], TODAY);
      return a === 3 && b === 4 && c === 0 ? null : `obtenu ${a}, ${b}, ${c}`;
    },
  },
  {
    name: 'Semaine du lundi au dimanche',
    run: () => {
      const w = weekRegularity([session('2026-11-23')], TODAY);
      const ok = w[0].date === '2026-11-23' && w[0].done && w[1].isToday && w[6].date === '2026-11-29' && w[6].isFuture;
      return ok ? null : JSON.stringify(w.map((d) => d.date));
    },
  },
  {
    name: 'Données stockées corrompues : entrées invalides ignorées',
    run: () => {
      const s = sanitizeProgress({
        preferredDuration: 45,
        phrases: { ok: { status: 'review', attempts: 2, masteredStreak: 0, lastPracticedOn: TODAY, nextReviewOn: '2026-11-25' }, bad: { status: 'oui' } },
        sessions: [session(TODAY), { id: 1 }],
      });
      const ok = s.preferredDuration === 15 && Object.keys(s.phrases).join() === 'ok' && s.sessions.length === 1;
      const garbage = sanitizeProgress('n\'importe quoi');
      return ok && garbage.sessions.length === 0 ? null : JSON.stringify(s);
    },
  },
  {
    name: 'Plan vierge : volume selon la durée',
    run: () => {
      const p = createInitialProgress();
      const [p15, p20, p30] = ([15, 20, 30] as const).map((d) => buildSessionPlan(lessons[0], lessons, d, p, TODAY));
      const ok =
        p15.phrases.length === 3 &&
        !p15.includeAssembly &&
        !p15.assemblyDeferred &&
        p15.phases.join() === 'listen,speak,recap' &&
        p20.phrases.length === 4 &&
        p30.phrases.length === 6 &&
        p30.profile.secondPass &&
        p15.phrases.every((x) => x.kind === 'new');
      return ok ? null : `15 → ${p15.phrases.length}, 20 → ${p20.phrases.length}, 30 → ${p30.phrases.length}`;
    },
  },
  {
    name: 'Assemblage : jamais sur une phrase pas encore rencontrée',
    run: () => {
      const lesson = lessons.find((l) => (l.assembly?.steps.length ?? 0) > 0)!;
      const steps = lesson.assembly!.steps;
      const p = createInitialProgress();
      for (const d of [15, 20, 30] as const) {
        const plan = buildSessionPlan(lesson, lessons, d, p, TODAY);
        if (plan.includeAssembly) {
          const presented = new Set(plan.phrases.map((x) => x.phrase.id));
          const missing = steps.filter((id) => !presented.has(id) && !p.phrases[id]);
          if (missing.length) return `${d} min : assemblage avec des phrases jamais vues (${missing.join(', ')})`;
          if (!plan.phases.includes('assembly')) return `${d} min : phase d'assemblage absente`;
        } else if (plan.phases.includes('assembly')) {
          return `${d} min : phase d'assemblage présente alors qu'elle est reportée`;
        }
      }
      return null;
    },
  },
  {
    name: 'Assemblage : ses phrases inédites passent en premier, puis il est proposé',
    run: () => {
      const lesson = lessons.find((l) => (l.assembly?.steps.length ?? 0) > 4) ?? lessons[0];
      const steps = lesson.assembly!.steps;
      // 30 min : assez de place pour présenter toutes les phrases de l'assemblage dès la première fois
      const p30 = buildSessionPlan(lesson, lessons, 30, createInitialProgress(), TODAY);
      const all30 = steps.every((id) => p30.phrases.some((x) => x.phrase.id === id));
      // 20 min : 4 places pour 5 phrases → assemblage reporté, mais 4 de ses phrases présentées
      const p20 = buildSessionPlan(lesson, lessons, 20, createInitialProgress(), TODAY);
      const firstFour = p20.phrases.filter((x) => steps.includes(x.phrase.id)).length === Math.min(4, steps.length);
      // Séance suivante (ces phrases vues) → la dernière est présentée et l'assemblage proposé
      let seen = createInitialProgress();
      for (const x of p20.phrases) seen = applyResult(seen, x.phrase.id, 'mastered', TODAY);
      const next = buildSessionPlan(lesson, lessons, 20, seen, TODAY);
      const ok =
        p30.includeAssembly &&
        all30 &&
        (steps.length <= 4 ? p20.includeAssembly : p20.assemblyDeferred && !p20.includeAssembly) &&
        firstFour &&
        next.includeAssembly;
      return ok
        ? null
        : `30 min : ${p30.includeAssembly}/${all30} ; 20 min : inclus=${p20.includeAssembly} reporté=${p20.assemblyDeferred} ; suivante : ${next.includeAssembly}`;
    },
  },
  {
    name: 'Révisions dues en premier, y compris d\'une autre leçon',
    run: () => {
      const other = lessons[1].phrases[0].id;
      let p: ProgressState = applyResult(createInitialProgress(), other, 'review', addDays(TODAY, -1));
      p = applyResult(p, lessons[0].phrases[0].id, 'mastered', TODAY); // pas encore due
      const plan = buildSessionPlan(lessons[0], lessons, 15, p, TODAY);
      const first = plan.phrases[0];
      const ok =
        first.kind === 'review' &&
        first.phrase.id === other &&
        plan.phrases.filter((x) => x.kind === 'new').length === 3 &&
        !plan.phrases.some((x) => x.phrase.id === lessons[0].phrases[0].id);
      return ok ? null : plan.phrases.map((x) => `${x.kind}:${x.phrase.id}`).join(', ');
    },
  },
  {
    name: 'Leçon entièrement vue : consolidation',
    run: () => {
      let p = createInitialProgress();
      for (const ph of lessons[0].phrases) p = applyResult(p, ph.id, 'mastered', TODAY);
      p = recordSession(p, session(TODAY));
      const plan = buildSessionPlan(lessons[0], lessons, 20, p, TODAY);
      const ok = plan.phrases.length === 4 && plan.phrases.every((x) => x.kind === 'consolidation');
      return ok ? null : plan.phrases.map((x) => x.kind).join(', ');
    },
  },
];

export function runProgressFixtures(): { passed: number; failures: ProgressFixtureFailure[] } {
  const failures: ProgressFixtureFailure[] = [];
  for (const c of cases) {
    let problem: string | null;
    try {
      problem = c.run();
    } catch (err) {
      problem = `exception : ${err instanceof Error ? err.message : String(err)}`;
    }
    if (problem) failures.push({ name: c.name, problem });
  }
  return { passed: cases.length - failures.length, failures };
}
