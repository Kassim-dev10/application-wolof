/**
 * Auto-tests du validateur, exécutés par `npm run check:wolof`.
 * Chaque cas fixe un comportement attendu : si une règle change, ces tests
 * le signalent avant que les leçons ne soient vérifiées.
 */
import { validateWolof, type IssueCode } from '@/lib/wolofOrthography';

interface Fixture {
  text: string;
  /** le texte doit-il être valide (aucune erreur) ? */
  valid: boolean;
  /** codes qui doivent apparaître parmi les problèmes signalés */
  issues?: IssueCode[];
  /** extraits qui doivent être repérés comme sons remarquables */
  features?: string[];
  exceptions?: string[];
}

export const fixtures: Fixture[] = [
  // Phrases correctes
  { text: 'Salaamaalekum.', valid: true, features: ['aa', 'aa'] },
  { text: 'Maa ngi fi rekk.', valid: true, features: ['aa', 'ng', 'kk'] },
  { text: 'Jërëjëf.', valid: true },
  { text: 'Dégg nga wolof ?', valid: true, features: ['gg', 'ng'] },
  { text: 'Ñaata la ?', valid: true, features: ['Ñ', 'aa'] },
  { text: 'góor', valid: true, features: ['óo'] },
  { text: 'Déedéet.', valid: true, features: ['ée', 'ée'] },
  { text: 'jaaxle', valid: true, features: ['aa', 'x'] },
  { text: 'Ndax mën nga wax ndànk ?', valid: true, features: ['Nd', 'x', 'ng', 'x', 'nd', 'nk'] },
  { text: 'Wàññi ma tuuti.', valid: true, features: ['ññ', 'uu'] },

  // Caractères interdits
  { text: 'caffè', valid: false, issues: ['forbidden-diacritic', 'unusual-geminate'] },
  { text: 'nôtre', valid: false, issues: ['forbidden-diacritic'] },
  { text: 'zéro', valid: false, issues: ['letter-outside-alphabet'] },
  { text: 'Mohamed', valid: true, exceptions: ['Mohamed'] },
  { text: 'naa 2', valid: true, issues: ['digit'] },

  // Longueurs
  { text: 'bëët', valid: false, issues: ['invalid-long-vowel'] },
  { text: 'góór', valid: false, issues: ['invalid-long-vowel'] },
  { text: 'goór', valid: false, issues: ['invalid-long-vowel'] },
  { text: 'jàà', valid: false, issues: ['invalid-long-vowel'] },
  { text: 'baaax', valid: false, issues: ['triple-letter'] },
  { text: 'kkër', valid: false, issues: ['geminate-word-initial'] },
  { text: 'naakk', valid: true, issues: ['long-vowel-before-cluster'] },
  { text: 'jàm', valid: true, issues: ['grave-a-context'] },

  // Graphies françaises
  { text: 'touba', valid: true, issues: ['french-digraph'] },
  { text: 'gnaata', valid: true, issues: ['french-digraph'] },

  // Normalisation
  { text: 'Dégg', valid: true, issues: ['not-nfc'], features: ['gg'] },
];

export interface FixtureFailure {
  text: string;
  problem: string;
}

export function runFixtures(): { passed: number; failures: FixtureFailure[] } {
  const failures: FixtureFailure[] = [];
  for (const f of fixtures) {
    const r = validateWolof(f.text, { exceptions: f.exceptions });
    const codes = r.issues.map((x) => x.code);
    const problems: string[] = [];
    if (r.valid !== f.valid) {
      problems.push(`valide attendu = ${f.valid}, obtenu = ${r.valid} (${codes.join(', ') || 'aucun problème'})`);
    }
    for (const code of f.issues ?? []) {
      if (!codes.includes(code)) problems.push(`problème « ${code} » non détecté (obtenu : ${codes.join(', ') || 'aucun'})`);
    }
    if (f.features) {
      const got = r.features.map((x) => x.text);
      if (got.join('|') !== f.features.join('|')) {
        problems.push(`sons repérés attendus [${f.features.join(', ')}], obtenus [${got.join(', ')}]`);
      }
    }
    if (problems.length) failures.push({ text: f.text, problem: problems.join(' ; ') });
  }
  return { passed: fixtures.length - failures.length, failures };
}
