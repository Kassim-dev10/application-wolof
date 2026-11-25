/**
 * Validateur strict de l'orthographe officielle du wolof sénégalais
 * (alphabet du décret 2005-992 / CLAD).
 *
 * Principe : on SIGNALE, on ne corrige jamais. Chaque problème donne sa
 * position, sa gravité et, quand c'est possible, une piste de correction.
 * Les erreurs violent une règle d'écriture ; les avertissements signalent
 * une ambiguïté à faire trancher par un humain (emprunt, nom propre, faute de
 * frappe probable…).
 *
 * Alphabet : a b c d e f g i j k l m n ñ ŋ o p q r s t u w x y
 * Accents autorisés : à, é, ë, ó (et leurs majuscules) — aucun autre.
 * Voyelles longues : aa, ee, ii, oo, uu, ée, óo. « à » et « ë » sont toujours brefs.
 */

export type IssueSeverity = 'error' | 'warning';

export type IssueCode =
  | 'forbidden-diacritic'
  | 'forbidden-char'
  | 'letter-outside-alphabet'
  | 'digit'
  | 'not-nfc'
  | 'spacing'
  | 'triple-letter'
  | 'invalid-long-vowel'
  | 'geminate-word-initial'
  | 'unusual-geminate'
  | 'vowel-sequence'
  | 'french-digraph'
  | 'long-vowel-before-cluster'
  | 'grave-a-context';

export interface OrthographyIssue {
  code: IssueCode;
  severity: IssueSeverity;
  /** index de début dans le texte normalisé (NFC) */
  start: number;
  /** index de fin (exclu) */
  end: number;
  /** extrait concerné */
  text: string;
  message: string;
  suggestion?: string;
}

export type SoundFeatureKind =
  | 'long-vowel'
  | 'geminate'
  | 'prenasal'
  | 'nasal'
  | 'uvular'
  | 'velar-fricative';

export interface SoundFeature {
  kind: SoundFeatureKind;
  start: number;
  end: number;
  text: string;
}

export interface OrthographyReport {
  input: string;
  /** texte normalisé en NFC : toutes les positions s'y rapportent */
  normalized: string;
  /** vrai s'il n'y a aucune erreur (les avertissements n'invalident pas) */
  valid: boolean;
  issues: OrthographyIssue[];
  features: SoundFeature[];
}

export interface ValidateOptions {
  /**
   * Mots exemptés des contrôles de structure (emprunts, noms propres).
   * Les accents interdits restent toujours des erreurs.
   */
  exceptions?: string[];
}

export const SOUND_FEATURE_LABELS: Record<SoundFeatureKind, string> = {
  'long-vowel': 'voyelle longue',
  geminate: 'consonne géminée',
  prenasal: 'consonne prénasalisée',
  nasal: 'nasale (ñ, ŋ)',
  uvular: 'uvulaire (q)',
  'velar-fricative': 'fricative vélaire (x)',
};

const VOWELS = new Set(['a', 'à', 'e', 'é', 'ë', 'i', 'o', 'ó', 'u']);
const CONSONANTS = new Set([...'bcdfgjklmnpqrstwxy', 'ñ', 'ŋ']);

/** Lettres latines absentes de l'alphabet officiel. */
const OUTSIDE_ALPHABET: Record<string, string> = {
  h: 'absente de l\'alphabet wolof (souvent muette, ou « x » selon le mot)',
  v: 'absente de l\'alphabet wolof (souvent « w » ou « f » selon le mot)',
  z: 'absente de l\'alphabet wolof (souvent « s » selon le mot)',
};

/** Consonnes qui se redoublent normalement en wolof. */
const ALLOWED_GEMINATES = new Set(['b', 'c', 'd', 'g', 'j', 'k', 'l', 'm', 'n', 'ñ', 'ŋ', 'p', 't', 'w', 'y']);

/** Groupes nasale + consonne prononcés d'un seul geste. */
const PRENASALS = new Set(['mb', 'mp', 'nd', 'nt', 'nc', 'nj', 'ng', 'nk', 'nq']);

/** Suites de voyelles typiques de l'orthographe française. */
const FRENCH_VOWEL_DIGRAPHS: Record<string, string> = {
  ou: 'u',
  ai: 'e ou ay',
  au: 'o',
  oi: 'wa',
  eu: 'ë',
  ei: 'e ou ey',
};

const ALLOWED_PUNCTUATION = new Set([
  ' ', ' ', ' ', '.', ',', ';', ':', '!', '?', '-', '–', '—',
  "'", '’', '«', '»', '"', '“', '”', '(', ')', '…', '/',
]);

const isVowel = (c: string | undefined): c is string => c !== undefined && VOWELS.has(c);
/** h, v, z comptent comme consonnes pour l'analyse de structure. */
const isConsonant = (c: string | undefined): c is string =>
  c !== undefined && (CONSONANTS.has(c) || c in OUTSIDE_ALPHABET);

interface Collector {
  issues: OrthographyIssue[];
  features: SoundFeature[];
}

function checkCharacters(s: string, out: Collector) {
  for (const m of s.matchAll(/./gsu)) {
    const ch = m[0];
    const i = m.index ?? 0;
    const lower = ch.toLowerCase();
    if (VOWELS.has(lower) || CONSONANTS.has(lower) || lower in OUTSIDE_ALPHABET) continue;
    if (ALLOWED_PUNCTUATION.has(ch)) continue;

    if (/\p{L}/u.test(ch)) {
      const base = ch.normalize('NFD').replace(/\p{M}/gu, '');
      const isAccented = base !== ch && /^[a-z]$/i.test(base);
      out.issues.push({
        code: isAccented ? 'forbidden-diacritic' : 'forbidden-char',
        severity: 'error',
        start: i,
        end: i + ch.length,
        text: ch,
        message: isAccented
          ? `Accent interdit « ${ch} » : seuls à, é, ë et ó sont autorisés.`
          : `Lettre étrangère à l'alphabet wolof « ${ch} ».`,
        suggestion: isAccented ? suggestForAccent(base.toLowerCase()) : undefined,
      });
    } else if (/\d/u.test(ch)) {
      out.issues.push({
        code: 'digit',
        severity: 'warning',
        start: i,
        end: i + ch.length,
        text: ch,
        message: 'Chiffre dans une phrase : écrire le nombre en toutes lettres pour l\'entraînement oral.',
      });
    } else if (/\s/u.test(ch)) {
      out.issues.push({
        code: 'spacing',
        severity: 'warning',
        start: i,
        end: i + ch.length,
        text: ch,
        message: 'Espace spécial (tabulation, retour à la ligne) : utiliser une espace simple.',
      });
    } else {
      out.issues.push({
        code: 'forbidden-char',
        severity: 'error',
        start: i,
        end: i + ch.length,
        text: ch,
        message: `Caractère non autorisé « ${ch} ».`,
      });
    }
  }
}

function suggestForAccent(base: string): string | undefined {
  switch (base) {
    case 'e':
      return 'e (ouvert), é (fermé) ou ë (central)';
    case 'o':
      return 'o (ouvert) ou ó (fermé)';
    case 'a':
      return 'a ou à';
    case 'c':
      return 's';
    default:
      return base;
  }
}

function checkSpacing(s: string, out: Collector) {
  const lead = s.match(/^\s+/u);
  if (lead) {
    out.issues.push({ code: 'spacing', severity: 'warning', start: 0, end: lead[0].length, text: lead[0], message: 'Espace en début de phrase.' });
  }
  const trail = s.match(/\s+$/u);
  if (trail && trail.index !== undefined && trail.index > 0) {
    out.issues.push({ code: 'spacing', severity: 'warning', start: trail.index, end: s.length, text: trail[0], message: 'Espace en fin de phrase.' });
  }
  for (const m of s.matchAll(/ {2,}/g)) {
    const i = m.index ?? 0;
    out.issues.push({ code: 'spacing', severity: 'warning', start: i, end: i + m[0].length, text: m[0], message: 'Espaces multiples.' });
  }
}

function analyzeWord(word: string, offset: number, out: Collector, reportIssues: boolean) {
  const w = word.toLowerCase();
  const n = w.length;
  const longVowelEnds: number[] = [];

  const feature = (kind: SoundFeatureKind, a: number, b: number) =>
    out.features.push({ kind, start: offset + a, end: offset + b, text: word.slice(a, b) });

  const issue = (
    code: IssueCode,
    severity: IssueSeverity,
    a: number,
    b: number,
    message: string,
    suggestion?: string,
  ) => {
    if (!reportIssues) return;
    out.issues.push({ code, severity, start: offset + a, end: offset + b, text: word.slice(a, b), message, suggestion });
  };

  // Lettres hors alphabet
  for (let i = 0; i < n; i++) {
    const reason = OUTSIDE_ALPHABET[w[i]];
    if (reason) {
      issue('letter-outside-alphabet', 'error', i, i + 1, `« ${word[i]} » : lettre ${reason}.`);
    }
  }

  // Trois lettres identiques ou plus
  for (let i = 0; i < n; ) {
    let j = i;
    while (j + 1 < n && w[j + 1] === w[i]) j++;
    if (j - i + 1 >= 3) {
      issue('triple-letter', 'error', i, j + 1, 'Trois lettres identiques de suite : une voyelle ou consonne n\'est jamais triplée.');
    }
    i = j + 1;
  }

  let i = 0;
  while (i < n) {
    const c = w[i];
    const d = w[i + 1] as string | undefined;
    const e = w[i + 2] as string | undefined;

    if (isVowel(c)) {
      if (d === c) {
        if (e === c) {
          i += 3; // déjà signalé comme lettre triplée
          continue;
        }
        if (c === 'é' || c === 'ó') {
          const fix = c === 'é' ? 'ée' : 'óo';
          issue('invalid-long-vowel', 'error', i, i + 2, `Voyelle longue fermée mal écrite : on écrit « ${fix} » (accent sur la première voyelle seulement).`, fix);
        } else if (c === 'ë') {
          issue('invalid-long-vowel', 'error', i, i + 2, '« ë » est toujours bref en wolof : « ëë » n\'existe pas.', 'ë, ou une autre voyelle longue selon le mot');
        } else if (c === 'à') {
          issue('invalid-long-vowel', 'error', i, i + 2, '« à » est toujours bref : le « a » long s\'écrit « aa ».', 'aa');
        } else {
          feature('long-vowel', i, i + 2);
          longVowelEnds.push(i + 2);
        }
        i += 2;
        continue;
      }

      if ((c === 'é' && d === 'e') || (c === 'ó' && d === 'o')) {
        feature('long-vowel', i, i + 2);
        longVowelEnds.push(i + 2);
        i += 2;
        continue;
      }

      if (isVowel(d)) {
        const pair = c + d;
        if (pair === 'eé' || pair === 'oó') {
          const fix = c === 'e' ? 'ée' : 'óo';
          issue('invalid-long-vowel', 'error', i, i + 2, `Voyelle longue fermée mal écrite : l'accent se met sur la première voyelle (« ${fix} »).`, fix);
        } else if (pair === 'aà' || pair === 'àa') {
          issue('invalid-long-vowel', 'error', i, i + 2, '« à » est toujours bref : le « a » long s\'écrit « aa ».', 'aa');
        } else if (FRENCH_VOWEL_DIGRAPHS[pair]) {
          issue('french-digraph', 'warning', i, i + 2, `« ${pair} » ressemble à une graphie française.`, FRENCH_VOWEL_DIGRAPHS[pair]);
        } else {
          issue('vowel-sequence', 'warning', i, i + 2, `Deux voyelles différentes se suivent (« ${pair} ») : rare en wolof. Manque-t-il une semi-voyelle « w » ou « y » ?`);
        }
        i += 1;
        continue;
      }

      if (c === 'à') {
        const ok = (isConsonant(d) && d === e) || PRENASALS.has(`${d}${e}`) || d === 'q';
        if (!ok) {
          issue('grave-a-context', 'warning', i, i + 1, '« à » s\'écrit normalement devant une consonne double ou un groupe nasal (jàmm, ànd, ndànk). Faut-il « a » ou « aa » ?');
        }
      }
      i += 1;
      continue;
    }

    if (isConsonant(c)) {
      if (d === c) {
        if (e === c) {
          i += 3;
          continue;
        }
        if (i === 0) {
          issue('geminate-word-initial', 'error', 0, 2, 'Un mot wolof ne commence jamais par une consonne double.');
        } else if (ALLOWED_GEMINATES.has(c)) {
          feature('geminate', i, i + 2);
        } else {
          issue('unusual-geminate', 'warning', i, i + 2, `« ${c}${c} » n'est pas une consonne double habituelle du wolof (emprunt ? faute de frappe ?).`);
        }
        i += 2;
        continue;
      }
      if (d !== undefined && PRENASALS.has(c + d)) {
        feature('prenasal', i, i + 2);
        i += 2;
        continue;
      }
      if (c === 'g' && d === 'n') {
        issue('french-digraph', 'warning', i, i + 2, '« gn » est la graphie française de ce son : en wolof on écrit « ñ ».', 'ñ');
      }
      if (c === 'ñ' || c === 'ŋ') feature('nasal', i, i + 1);
      else if (c === 'q') feature('uvular', i, i + 1);
      else if (c === 'x') feature('velar-fricative', i, i + 1);
      i += 1;
      continue;
    }

    i += 1;
  }

  // Voyelle longue suivie d'une géminée ou d'une prénasale
  for (const end of longVowelEnds) {
    const c1 = w[end] as string | undefined;
    const c2 = w[end + 1] as string | undefined;
    if (isConsonant(c1) && isConsonant(c2) && (c1 === c2 || PRENASALS.has(c1 + c2))) {
      issue(
        'long-vowel-before-cluster',
        'warning',
        end - 2,
        end + 2,
        'Voyelle longue devant une consonne double ou un groupe nasal : combinaison normalement impossible en wolof. Vérifier la longueur de la voyelle ou de la consonne.',
      );
    }
  }
}

/** Valide un texte wolof et repère ses sons remarquables. */
export function validateWolof(input: string, options: ValidateOptions = {}): OrthographyReport {
  const normalized = input.normalize('NFC');
  const out: Collector = { issues: [], features: [] };
  const exceptions = new Set((options.exceptions ?? []).map((x) => x.normalize('NFC').toLowerCase()));

  if (normalized !== input) {
    out.issues.push({
      code: 'not-nfc',
      severity: 'warning',
      start: 0,
      end: normalized.length,
      text: normalized,
      message: 'Accents saisis en caractères décomposés (lettre + accent combinant) : le texte a été normalisé en NFC.',
    });
  }

  checkCharacters(normalized, out);
  checkSpacing(normalized, out);

  for (const m of normalized.matchAll(/\p{L}+/gu)) {
    const word = m[0];
    analyzeWord(word, m.index ?? 0, out, !exceptions.has(word.toLowerCase()));
  }

  out.issues.sort((a, b) => a.start - b.start || (a.severity === b.severity ? 0 : a.severity === 'error' ? -1 : 1));
  out.features.sort((a, b) => a.start - b.start);

  return {
    input,
    normalized,
    valid: !out.issues.some((x) => x.severity === 'error'),
    issues: out.issues,
    features: out.features,
  };
}

/** Repère uniquement les sons remarquables (pour le surlignage). */
export function analyzeWolof(input: string): SoundFeature[] {
  return validateWolof(input).features;
}
