/**
 * Contrôles des données de leçons, utilisés par `npm run check:wolof` (et donc
 * par le build). Ne modifie jamais les données : renvoie une liste de constats.
 */
import { validateWolof, analyzeWolof, type IssueCode, type SoundFeatureKind } from '@/lib/wolofOrthography';
import { audioFor, type Lesson } from '@/data/lessons/types';
import type { DaySession, SoundCard, SpecialMark } from '@/data/mockLessons';
import type { SoundCard as NewSoundCard } from '@/data/soundCards';

export type CheckSeverity = 'error' | 'warning';

export interface CheckFinding {
  severity: CheckSeverity;
  /** où se trouve le problème, ex. « 01-salutations / salutations-03 · wolof » */
  where: string;
  code: IssueCode | 'structure' | 'identifier' | 'duplicate' | 'id-lock' | 'audio-path' | 'highlight-mismatch';
  message: string;
  suggestion?: string;
  /** texte concerné et position du problème, pour l'affichage avec repère */
  text?: string;
  start?: number;
  end?: number;
}

/** Entrée du registre : le fichier et la leçon qu'il exporte par défaut (null si absente). */
export interface LessonSourceInput {
  file: string;
  lesson: Lesson | null;
}

const MIN_NOTE_LENGTH = 40;
/** Phrases minimum d'une leçon publiée : de quoi remplir une session de 30 min. */
export const MIN_PUBLISHED_PHRASES = 6;
/** Étapes maximum d'un assemblage : ce qu'une session de 30 min peut présenter en une fois. */
export const MAX_ASSEMBLY_STEPS = 6;

const LESSON_ID_RE = /^(\d{2})-([a-z0-9]+(?:-[a-z0-9]+)*)$/;
const PREFIX_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function checkWolofField(where: string, text: string, exceptions: string[] | undefined, out: CheckFinding[]) {
  const report = validateWolof(text, { exceptions });
  for (const issue of report.issues) {
    out.push({
      severity: issue.severity,
      where,
      code: issue.code,
      message: issue.message,
      suggestion: issue.suggestion,
      text: report.normalized,
      start: issue.start,
      end: issue.end,
    });
  }
}

/** Proposition d'identifiant ASCII : « 04-ñaata-la » → « 04-naata-la », « ŋ » → « ng ». */
export function asciiId(id: string): string {
  return id
    .toLowerCase()
    .replace(/ŋ/g, 'ng')
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/** Forme comparable d'une phrase : minuscules, sans ponctuation ni espaces superflus. */
export function normalizeForDuplicates(text: string): string {
  return text
    .normalize('NFC')
    .toLowerCase()
    .replace(/[^\p{L}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Vérifie le registre des leçons : nommage des fichiers et identifiants,
 * unicité (identifiants, ordre, préfixes), doublons de texte, champs
 * obligatoires, orthographe, chemins audio et exercice d'assemblage.
 */
export function checkLessons(sources: LessonSourceInput[]): CheckFinding[] {
  const out: CheckFinding[] = [];
  const err = (where: string, code: CheckFinding['code'], message: string, suggestion?: string) =>
    out.push({ severity: 'error', where, code, message, suggestion });
  const warn = (where: string, code: CheckFinding['code'], message: string, suggestion?: string) =>
    out.push({ severity: 'warning', where, code, message, suggestion });

  const lessonIds = new Map<string, string>();
  const orders = new Map<number, string>();
  const prefixes = new Map<string, string>();
  const phraseIds = new Map<string, string>();
  const allPhrases: { lessonId: string; id: string; wolof: string; duplicateOf?: string; norm: string }[] = [];

  for (const { file, lesson } of sources) {
    if (!lesson) {
      err(file, 'structure', 'Le fichier n\'exporte pas de leçon par défaut (attendu : « export default lesson; »).');
      continue;
    }
    const L = lesson.id;

    // Identifiant, fichier, ordre, préfixe
    const m = LESSON_ID_RE.exec(lesson.id);
    if (!m) {
      err(L, 'identifier', `Identifiant de leçon « ${lesson.id} » invalide : format attendu « NN-slug » (ex. « 04-transports »).`);
    } else {
      if (Number(m[1]) !== lesson.order) {
        err(L, 'identifier', `L'ordre (${lesson.order}) ne correspond pas au numéro de l'identifiant (${m[1]}).`, `order: ${Number(m[1])}`);
      }
    }
    if (file !== `${lesson.id}.ts`) {
      err(L, 'identifier', `Le fichier « ${file} » devrait s'appeler « ${lesson.id}.ts ».`);
    }
    if (lessonIds.has(lesson.id)) err(L, 'identifier', `Identifiant de leçon déjà utilisé par ${lessonIds.get(lesson.id)}.`);
    lessonIds.set(lesson.id, file);
    if (orders.has(lesson.order)) err(L, 'identifier', `Ordre ${lesson.order} déjà utilisé par la leçon ${orders.get(lesson.order)}.`);
    orders.set(lesson.order, L);

    if (!PREFIX_RE.test(lesson.phrasePrefix ?? '')) {
      err(L, 'identifier', `Préfixe de phrases « ${lesson.phrasePrefix} » invalide : minuscules, chiffres et tirets uniquement.`);
    } else if (prefixes.has(lesson.phrasePrefix)) {
      err(L, 'identifier', `Préfixe de phrases « ${lesson.phrasePrefix} » déjà utilisé par la leçon ${prefixes.get(lesson.phrasePrefix)}.`);
    }
    prefixes.set(lesson.phrasePrefix, L);

    // Contenu minimal
    if (!lesson.title.trim()) err(L, 'structure', 'Titre de leçon vide.');
    if (lesson.published) {
      if (!lesson.summary.trim()) err(L, 'structure', 'Résumé vide : obligatoire pour une leçon publiée.');
      if (lesson.phrases.length < MIN_PUBLISHED_PHRASES) {
        err(
          L,
          'structure',
          `Leçon publiée avec ${lesson.phrases.length} phrase(s) : il en faut au moins ${MIN_PUBLISHED_PHRASES}.`,
          'Compléter la leçon, ou la repasser en « published: false ».',
        );
      }
    } else if (lesson.phrases.length < MIN_PUBLISHED_PHRASES) {
      warn(L, 'structure', `Thème en préparation (non publié) : ${lesson.phrases.length}/${MIN_PUBLISHED_PHRASES} phrases.`);
    }

    // Phrases
    // « préfixe-NN » (salutations-01) ou « préfixe-slug » descriptif (04-fo-jem), en ASCII :
    // l'identifiant sert de nom de fichier audio, les lettres accentuées y sont fragiles (NFC/NFD, URL).
    const idPattern = PREFIX_RE.test(lesson.phrasePrefix ?? '')
      ? new RegExp(`^${lesson.phrasePrefix}-(?:\\d{2}|[a-z0-9]+(?:-[a-z0-9]+)*)$`)
      : null;
    for (const p of lesson.phrases) {
      const where = `${L} / ${p.id}`;

      if (idPattern && !idPattern.test(p.id)) {
        const ascii = asciiId(p.id);
        err(
          where,
          'identifier',
          `Identifiant de phrase « ${p.id} » : format attendu « ${lesson.phrasePrefix}-NN » ou « ${lesson.phrasePrefix}-mots-en-ascii » (minuscules sans accents, tirets).`,
          ascii !== p.id && idPattern.test(ascii) ? ascii : undefined,
        );
      }
      if (phraseIds.has(p.id)) err(where, 'identifier', `Identifiant de phrase déjà utilisé dans ${phraseIds.get(p.id)}.`);
      phraseIds.set(p.id, L);

      for (const field of ['wolof', 'french', 'situation', 'pronunciationNote'] as const) {
        if (!p[field] || !p[field].trim()) err(`${where} · ${field}`, 'structure', `Champ « ${field} » vide.`);
      }
      if (p.pronunciationNote && p.pronunciationNote.trim().length < MIN_NOTE_LENGTH) {
        warn(
          `${where} · pronunciationNote`,
          'structure',
          `Note de prononciation très courte (${p.pronunciationNote.trim().length} caractères) : est-elle assez concrète ?`,
        );
      }
      if (p.wolof.trim() && p.wolof.trim() === p.french.trim()) err(where, 'structure', 'La traduction française est identique au wolof.');

      // Doublons de texte wolof : vérifiés après avoir lu toutes les leçons
      allPhrases.push({ lessonId: L, id: p.id, wolof: p.wolof, duplicateOf: p.duplicateOf, norm: normalizeForDuplicates(p.wolof) });

      const expected = audioFor(lesson.id, p.id);
      if (p.audioUrl !== expected.audioUrl) {
        err(`${where} · audioUrl`, 'audio-path', `Chemin audio inattendu « ${p.audioUrl} ».`, expected.audioUrl);
      }
      if (p.slowAudioUrl !== expected.slowAudioUrl) {
        err(`${where} · slowAudioUrl`, 'audio-path', `Chemin audio lent inattendu « ${p.slowAudioUrl} ».`, expected.slowAudioUrl);
      }

      const exceptions = p.orthographyExceptions ?? [];
      for (const ex of exceptions) {
        if (!ex.reason.trim()) err(where, 'structure', `Exception « ${ex.word} » sans justification.`);
        const present: string[] = p.wolof.normalize('NFC').toLowerCase().match(/\p{L}+/gu) ?? [];
        if (!present.includes(ex.word.normalize('NFC').toLowerCase())) {
          warn(where, 'structure', `Exception « ${ex.word} » déclarée mais absente de la phrase.`);
        }
      }

      checkWolofField(`${where} · wolof`, p.wolof, exceptions.map((x) => x.word), out);
    }

    // Assemblage
    if (lesson.assembly) {
      const where = `${L} · assemblage`;
      const ids = new Set(lesson.phrases.map((p) => p.id));
      if (lesson.assembly.steps.length < 2) err(where, 'structure', 'L\'assemblage doit compter au moins deux étapes.');
      if (new Set(lesson.assembly.steps).size !== lesson.assembly.steps.length) {
        err(where, 'structure', 'Une même phrase apparaît deux fois dans l\'assemblage.');
      }
      for (const step of lesson.assembly.steps) {
        if (!ids.has(step)) err(where, 'structure', `Étape « ${step} » : aucune phrase de la leçon ne porte cet identifiant.`);
      }
      // L'app ne propose l'assemblage que lorsque toutes ses phrases ont été rencontrées :
      // au-delà de 6 étapes, aucune session (même 30 min) ne peut les présenter d'un coup.
      if (lesson.assembly.steps.length > MAX_ASSEMBLY_STEPS) {
        warn(
          where,
          'structure',
          `Assemblage de ${lesson.assembly.steps.length} étapes : au-delà de ${MAX_ASSEMBLY_STEPS}, il ne sera proposé qu'après plusieurs sessions.`,
          `Le limiter à ${MAX_ASSEMBLY_STEPS} phrases.`,
        );
      }
    }
  }

  // Doublons de texte wolof (toutes leçons, publiées ou non)
  const byId = new Map(allPhrases.map((x) => [x.id, x]));
  const firstByText = new Map<string, (typeof allPhrases)[number]>();
  for (const x of allPhrases) {
    const where = `${x.lessonId} / ${x.id}`;

    if (x.duplicateOf !== undefined) {
      const target = byId.get(x.duplicateOf);
      if (x.duplicateOf === x.id) {
        err(where, 'duplicate', '« duplicateOf » ne peut pas désigner la phrase elle-même.');
      } else if (!target) {
        err(where, 'duplicate', `« duplicateOf: '${x.duplicateOf}' » : aucune phrase ne porte cet identifiant.`);
      } else if (target.norm !== x.norm) {
        err(
          where,
          'duplicate',
          `« duplicateOf: '${x.duplicateOf}' » : les textes diffèrent (« ${x.wolof} » / « ${target.wolof} »). Ce n'est pas un doublon.`,
          'Retirer « duplicateOf ».',
        );
      }
    }

    if (!x.norm) continue;
    const first = firstByText.get(x.norm);
    if (!first) {
      firstByText.set(x.norm, x);
      continue;
    }
    const declared = x.duplicateOf !== undefined && byId.get(x.duplicateOf)?.norm === x.norm;
    if (!declared) {
      warn(
        where,
        'duplicate',
        `Même phrase wolof que ${first.lessonId} / ${first.id} (« ${x.wolof} »).`,
        `Retirer la phrase (la révision espacée fera revenir l'original), ou déclarer le doublon voulu : duplicateOf: '${first.id}'.`,
      );
    }
  }

  if (!sources.some((s) => s.lesson?.published)) {
    err('registre', 'structure', 'Aucune leçon publiée : l\'app n\'aurait rien à proposer.');
  }
  return out;
}

// ───────────── Identifiants figés (phrase-ids.lock.json) ─────────────

export interface IdLockEntry {
  lesson: string;
  /** texte wolof au moment du gel (repère pour l'audio et la relecture) */
  wolof: string;
}

export interface IdLock {
  phrases: Record<string, IdLockEntry>;
  /** identifiants abandonnés volontairement : jamais réutilisables */
  retired: string[];
}

/**
 * Les identifiants de phrases sont la clé de la progression des apprenants et
 * des fichiers audio : une fois figés, ils ne doivent ni disparaître ni changer
 * de sens.
 */
export function checkIdLock(lessons: Lesson[], lock: IdLock): CheckFinding[] {
  const out: CheckFinding[] = [];
  const current = new Map(lessons.flatMap((l) => l.phrases.map((p) => [p.id, { lesson: l.id, wolof: p.wolof }] as const)));
  const retired = new Set(lock.retired);

  for (const [id, entry] of Object.entries(lock.phrases)) {
    const now = current.get(id);
    if (!now) {
      out.push({
        severity: 'error',
        where: `${entry.lesson} / ${id}`,
        code: 'id-lock',
        message: `Identifiant figé introuvable (« ${entry.wolof} ») : renommé ou supprimé ? La progression des apprenants et l'audio en dépendent.`,
        suggestion: `Restaurer la phrase sous cet identifiant, ou la retirer explicitement : npm run check:wolof -- --retire=${id}`,
      });
      continue;
    }
    if (now.lesson !== entry.lesson) {
      out.push({
        severity: 'warning',
        where: `${now.lesson} / ${id}`,
        code: 'id-lock',
        message: `Phrase déplacée de ${entry.lesson} vers ${now.lesson} : son chemin audio a changé.`,
        suggestion: 'Déplacer aussi ses fichiers audio, puis : npm run check:wolof -- --update-ids',
      });
    }
    if (normalizeForDuplicates(now.wolof) !== normalizeForDuplicates(entry.wolof)) {
      out.push({
        severity: 'warning',
        where: `${now.lesson} / ${id}`,
        code: 'id-lock',
        message: `Texte modifié depuis le gel : « ${entry.wolof} » → « ${now.wolof} ». Vérifier que l'audio et la relecture correspondent encore.`,
        suggestion: 'Si la modification est voulue : npm run check:wolof -- --update-ids',
      });
    }
  }

  for (const [id, now] of current) {
    if (retired.has(id)) {
      out.push({
        severity: 'error',
        where: `${now.lesson} / ${id}`,
        code: 'id-lock',
        message: 'Identifiant retiré réutilisé : d\'anciennes progressions ou anciens audios s\'y rattacheraient par erreur.',
        suggestion: 'Choisir le prochain numéro libre.',
      });
    } else if (!lock.phrases[id]) {
      out.push({
        severity: 'warning',
        where: `${now.lesson} / ${id}`,
        code: 'id-lock',
        message: 'Nouvel identifiant pas encore figé.',
        suggestion: 'Une fois la phrase validée : npm run check:wolof -- --update-ids',
      });
    }
  }
  return out;
}

/** Ajoute les nouveaux identifiants et met à jour textes et leçons. Ne supprime jamais rien. */
export function updateIdLock(lessons: Lesson[], lock: IdLock): { lock: IdLock; added: string[]; updated: string[] } {
  const phrases = { ...lock.phrases };
  const added: string[] = [];
  const updated: string[] = [];
  const retired = new Set(lock.retired);
  for (const l of lessons) {
    for (const p of l.phrases) {
      if (retired.has(p.id)) continue;
      const prev = phrases[p.id];
      if (!prev) added.push(p.id);
      else if (prev.lesson !== l.id || prev.wolof !== p.wolof) updated.push(p.id);
      phrases[p.id] = { lesson: l.id, wolof: p.wolof };
    }
  }
  const sorted = Object.fromEntries(Object.entries(phrases).sort(([a], [b]) => a.localeCompare(b)));
  return { lock: { phrases: sorted, retired: [...lock.retired] }, added, updated };
}

/** Retire des identifiants figés qui ne sont plus utilisés. */
export function retireIds(lessons: Lesson[], lock: IdLock, ids: string[]): { lock: IdLock; problems: string[] } {
  const used = new Set(lessons.flatMap((l) => l.phrases.map((p) => p.id)));
  const phrases = { ...lock.phrases };
  const retired = new Set(lock.retired);
  const problems: string[] = [];
  for (const id of ids) {
    if (used.has(id)) problems.push(`« ${id} » est encore utilisé par une phrase : le supprimer d'abord des données.`);
    else if (!phrases[id] && !retired.has(id)) problems.push(`« ${id} » n'est pas un identifiant figé.`);
    else {
      delete phrases[id];
      retired.add(id);
    }
  }
  return { lock: { phrases, retired: [...retired].sort() }, problems };
}

/** Lit un registre d'identifiants inconnu (fichier absent ou abîmé → registre vide). */
export function parseIdLock(data: unknown): IdLock {
  const lock: IdLock = { phrases: {}, retired: [] };
  if (!data || typeof data !== 'object') return lock;
  const d = data as Record<string, unknown>;
  if (d.phrases && typeof d.phrases === 'object') {
    for (const [id, raw] of Object.entries(d.phrases as Record<string, unknown>)) {
      const e = raw as Record<string, unknown> | null;
      if (e && typeof e.lesson === 'string' && typeof e.wolof === 'string') lock.phrases[id] = { lesson: e.lesson, wolof: e.wolof };
    }
  }
  if (Array.isArray(d.retired)) lock.retired = d.retired.filter((x): x is string => typeof x === 'string');
  return lock;
}

// ───────────── Glossaire ─────────────

/** Vérifie le glossaire : orthographe des exemples et cohérence avec la lettre présentée. */
export function checkSoundCards(cards: NewSoundCard[]): CheckFinding[] {
  const out: CheckFinding[] = [];
  const ids = new Set<string>();
  for (const card of cards) {
    const where = `glossaire ${card.id}`;
    if (ids.has(card.id)) {
      out.push({ severity: 'error', where, code: 'structure', message: `Identifiant de fiche en double : « ${card.id} ».` });
    }
    ids.add(card.id);
    for (const field of ['name', 'sound', 'exampleWolof', 'exampleFrench', 'description'] as const) {
      if (!card[field].trim()) {
        out.push({ severity: 'error', where: `${where} · ${field}`, code: 'structure', message: `Champ « ${field} » vide.` });
      }
    }
    if (card.graphemes.length === 0) {
      out.push({ severity: 'error', where, code: 'structure', message: 'Aucune lettre présentée.' });
    }
    for (const g of card.graphemes) {
      // Un groupe isolé (« kk ») n'est pas un mot : on ne contrôle que les caractères.
      const bad = validateWolof(g).issues.find((x) =>
        ['forbidden-diacritic', 'forbidden-char', 'letter-outside-alphabet'].includes(x.code),
      );
      if (bad) {
        out.push({ severity: 'error', where: `${where} · graphemes`, code: 'structure', message: `Lettre présentée invalide « ${g} » : ${bad.message}` });
      }
    }
    const example = card.exampleWolof.normalize('NFC').toLowerCase();
    if (!card.graphemes.some((g) => example.includes(g.normalize('NFC').toLowerCase()))) {
      out.push({
        severity: 'error',
        where: `${where} · exampleWolof`,
        code: 'structure',
        message: `L'exemple « ${card.exampleWolof} » ne contient aucune des lettres présentées (${card.graphemes.join(', ')}).`,
      });
    }
    checkWolofField(`${where} · exampleWolof`, card.exampleWolof, undefined, out);
  }
  return out;
}

// ───────────── Audit des anciennes données ─────────────

const MARK_TO_FEATURES: Record<SpecialMark, SoundFeatureKind[]> = {
  'long-vowel': ['long-vowel'],
  geminate: ['geminate'],
  nasal: ['nasal', 'prenasal'],
  implosive: ['prenasal', 'geminate'],
  ejective: ['uvular', 'geminate'],
};

/**
 * Audit des anciennes données simulées (mockLessons.ts) : orthographe et
 * surlignages saisis à la main. Purement informatif.
 */
export function auditLegacyMock(sessions: DaySession[], soundCards: SoundCard[]): CheckFinding[] {
  const out: CheckFinding[] = [];

  for (const s of sessions) {
    const base = `mock ${s.dayLabel}`;
    for (const p of s.listening) {
      checkWolofField(`${base} · écoute ${p.id}`, p.wolof, undefined, out);
      const features = analyzeWolof(p.wolof);
      for (const h of p.highlights) {
        const allowed = MARK_TO_FEATURES[h.mark];
        const match = features.some((f) => allowed.includes(f.kind) && f.start >= h.start && f.end <= h.end);
        if (!match) {
          out.push({
            severity: 'warning',
            where: `${base} · écoute ${p.id}`,
            code: 'highlight-mismatch',
            message: `Surlignage manuel « ${p.wolof.slice(h.start, h.end)} » (${h.start}–${h.end}, ${h.mark}) : aucun son de ce type à cet endroit.`,
            text: p.wolof,
            start: h.start,
            end: h.end,
          });
        }
      }
    }
    for (const c of s.assembly.chunks) checkWolofField(`${base} · assemblage ${c.id}`, c.wolof, undefined, out);
    checkWolofField(`${base} · assemblage phrase complète`, s.assembly.fullWolof, undefined, out);
    for (const t of s.speaking) checkWolofField(`${base} · oral ${t.id}`, t.wolof, undefined, out);
  }

  for (const card of soundCards) {
    checkWolofField(`mock glossaire ${card.id} · exemple`, card.exampleWolof, undefined, out);
  }
  return out;
}
