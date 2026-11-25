/**
 * Auto-tests des contrôles du registre (identifiants, unicité, doublons,
 * identifiants figés), exécutés par `npm run check:wolof`.
 * Les leçons sont synthétiques : les phrases sont reprises des leçons réelles.
 */
import { audioFor, DRAFT, type Lesson, type LessonPhrase } from '@/data/lessons/types';
import {
  checkIdLock,
  checkLessons,
  retireIds,
  updateIdLock,
  type CheckFinding,
  type IdLock,
  type LessonSourceInput,
} from '@/lib/lessonChecks';

const TEXTS = ['Waaw.', 'Jërëjëf.', 'Ba suba.', 'Amul solo.', 'Dafa seer.', 'Tuuti rekk.', 'Jàmm rekk.', 'Déedéet.'];
const NOTE = 'Note de prononciation suffisamment détaillée pour le test automatique.';

function phrase(lessonId: string, id: string, wolof: string): LessonPhrase {
  return { id, wolof, french: `Traduction de ${id}`, situation: 'Situation de test.', pronunciationNote: NOTE, ...audioFor(lessonId, id), review: DRAFT };
}

function lesson(id: string, prefix: string, count: number, opts: Partial<Lesson> = {}, offset = 0): Lesson {
  const order = Number(id.slice(0, 2));
  return {
    id,
    order,
    phrasePrefix: prefix,
    published: true,
    title: `Leçon ${id}`,
    summary: 'Résumé de test.',
    phrases: Array.from({ length: count }, (_, i) =>
      phrase(id, `${prefix}-${String(i + 1).padStart(2, '0')}`, TEXTS[(i + offset) % TEXTS.length]),
    ),
    ...opts,
  };
}

const src = (...ls: Lesson[]): LessonSourceInput[] => ls.map((l) => ({ file: `${l.id}.ts`, lesson: l }));
const errors = (f: CheckFinding[]) => f.filter((x) => x.severity === 'error');
const has = (f: CheckFinding[], severity: CheckFinding['severity'], fragment: string) =>
  f.some((x) => x.severity === severity && x.message.includes(fragment));

const cases: { name: string; run: () => boolean | string }[] = [
  { name: 'Leçon valide : aucune erreur', run: () => errors(checkLessons(src(lesson('01-test', 'test', 6)))).length === 0 },
  {
    name: 'Identifiant de phrase en double entre deux leçons',
    run: () => {
      const b = lesson('02-autre', 'autre', 6, {}, 2);
      b.phrases[0] = phrase('02-autre', 'test-01', 'Déedéet.');
      return has(checkLessons(src(lesson('01-test', 'test', 6), b)), 'error', 'déjà utilisé dans');
    },
  },
  {
    name: 'Identifiant de phrase hors préfixe',
    run: () => {
      const a = lesson('01-test', 'test', 6);
      a.phrases[0] = phrase('01-test', 'autre-01', 'Waaw.');
      return has(checkLessons(src(a)), 'error', 'format attendu « test-NN »');
    },
  },
  {
    name: 'Identifiant descriptif ASCII accepté, accents refusés avec proposition',
    run: () => {
      const a = lesson('04-test', '04', 6);
      a.phrases[0] = phrase('04-test', '04-fo-jem', 'Waaw.');
      a.phrases[1] = phrase('04-test', '04-ñaata-la', 'Jërëjëf.');
      const f = checkLessons(src(a));
      const okSlug = !f.some((x) => x.where.includes('04-fo-jem') && x.code === 'identifier');
      const bad = f.find((x) => x.where.includes('04-ñaata-la') && x.code === 'identifier');
      return (okSlug && bad?.severity === 'error' && bad.suggestion === '04-naata-la') || JSON.stringify(bad);
    },
  },
  {
    name: 'Ordre en double',
    run: () => has(checkLessons(src(lesson('01-test', 'test', 6), lesson('01-autre', 'autre', 6, {}, 2))), 'error', 'Ordre 1 déjà utilisé'),
  },
  {
    name: 'Préfixe en double',
    run: () => has(checkLessons(src(lesson('01-test', 'test', 6), lesson('02-autre', 'test', 0, { published: false }))), 'error', 'déjà utilisé par la leçon'),
  },
  {
    name: 'Nom de fichier différent de l\'identifiant',
    run: () => has(checkLessons([{ file: '01-mauvais.ts', lesson: lesson('01-test', 'test', 6) }]), 'error', 'devrait s\'appeler « 01-test.ts »'),
  },
  {
    name: 'Fichier sans export par défaut',
    run: () => has(checkLessons([...src(lesson('01-test', 'test', 6)), { file: '02-vide.ts', lesson: null }]), 'error', 'export default'),
  },
  {
    name: 'Leçon publiée trop courte : erreur ; non publiée : simple avertissement',
    run: () => {
      const pub = checkLessons(src(lesson('01-test', 'test', 6), lesson('02-court', 'court', 3, {}, 3)));
      const draft = checkLessons(src(lesson('01-test', 'test', 6), lesson('02-court', 'court', 0, { published: false })));
      return has(pub, 'error', 'il en faut au moins 6') && errors(draft).length === 0 && has(draft, 'warning', 'en préparation');
    },
  },
  {
    name: 'Assemblage : étape hors leçon (erreur), trop long (avertissement)',
    run: () => {
      const a = lesson('01-test', 'test', 8);
      const outside = checkLessons(src({ ...a, assembly: { situation: 's', situationDetail: 'd', prompt: 'p', steps: ['test-01', 'autre-01'] } }));
      const long = checkLessons(src({ ...a, assembly: { situation: 's', situationDetail: 'd', prompt: 'p', steps: a.phrases.slice(0, 7).map((p) => p.id) } }));
      return has(outside, 'error', 'aucune phrase de la leçon') && has(long, 'warning', 'au-delà de 6');
    },
  },
  {
    name: 'Même phrase wolof dans deux leçons : avertissement',
    run: () => has(checkLessons(src(lesson('01-test', 'test', 6), lesson('02-autre', 'autre', 6))), 'warning', 'Même phrase wolof'),
  },
  {
    name: 'Doublon déclaré (duplicateOf) : plus d\'avertissement',
    run: () => {
      const b = lesson('02-autre', 'autre', 6);
      b.phrases[0] = { ...b.phrases[0], duplicateOf: 'test-01' }; // « Waaw. » des deux côtés
      const f = checkLessons(src(lesson('01-test', 'test', 6), b));
      const warned = f.filter((x) => x.code === 'duplicate').map((x) => x.where);
      // autre-01 est déclaré ; les 5 autres doublons de la leçon restent signalés
      return (!warned.some((w) => w.endsWith('autre-01')) && warned.length === 5 && errors(f).length === 0) || warned.join(', ');
    },
  },
  {
    name: 'duplicateOf invalide : cible absente, texte différent, elle-même',
    run: () => {
      const a = lesson('01-test', 'test', 6);
      a.phrases[0] = { ...a.phrases[0], duplicateOf: 'test-99' };
      a.phrases[1] = { ...a.phrases[1], duplicateOf: 'test-03' };
      a.phrases[2] = { ...a.phrases[2], duplicateOf: 'test-03' };
      const f = checkLessons(src(a));
      return (
        (has(f, 'error', 'aucune phrase ne porte cet identifiant') &&
          has(f, 'error', 'les textes diffèrent') &&
          has(f, 'error', 'la phrase elle-même')) ||
        f.map((x) => x.message).join(' | ')
      );
    },
  },
  {
    name: 'Identifiants figés : supprimé, retiré réutilisé, nouveau, texte modifié',
    run: () => {
      const a = lesson('01-test', 'test', 6);
      const base = updateIdLock([a], { phrases: {}, retired: [] }).lock;
      const lock: IdLock = { ...base, retired: ['test-09'] };
      const changed = lesson('01-test', 'test', 6);
      changed.phrases.pop(); // test-06 disparaît
      changed.phrases[0] = { ...changed.phrases[0], wolof: 'Déedéet.' }; // texte de test-01 modifié
      changed.phrases.push(phrase('01-test', 'test-07', 'Waaw.')); // nouveau
      changed.phrases.push(phrase('01-test', 'test-09', 'Ba suba.')); // retiré réutilisé
      const f = checkIdLock([changed], lock);
      const ok =
        has(f, 'error', 'Identifiant figé introuvable') &&
        has(f, 'error', 'Identifiant retiré réutilisé') &&
        has(f, 'warning', 'Nouvel identifiant') &&
        has(f, 'warning', 'Texte modifié depuis le gel');
      return ok || f.map((x) => x.message).join(' | ');
    },
  },
  {
    name: 'Retrait explicite : refusé si encore utilisé, accepté sinon',
    run: () => {
      const a = lesson('01-test', 'test', 6);
      const lock = updateIdLock([a], { phrases: {}, retired: [] }).lock;
      const refused = retireIds([a], lock, ['test-01']).problems.length === 1;
      const shorter = { ...a, phrases: a.phrases.slice(1) };
      const r = retireIds([shorter], lock, ['test-01']);
      return refused && r.problems.length === 0 && r.lock.retired.includes('test-01') && checkIdLock([shorter], r.lock).length === 0;
    },
  },
];

export function runLessonCheckFixtures(): { passed: number; failures: { name: string; problem: string }[] } {
  const failures: { name: string; problem: string }[] = [];
  for (const c of cases) {
    try {
      const r = c.run();
      if (r !== true) failures.push({ name: c.name, problem: typeof r === 'string' ? r : 'règle non déclenchée' });
    } catch (e) {
      failures.push({ name: c.name, problem: `exception : ${e instanceof Error ? e.message : String(e)}` });
    }
  }
  return { passed: cases.length - failures.length, failures };
}
