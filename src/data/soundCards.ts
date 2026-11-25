/**
 * Glossaire des sons clés du wolof.
 *
 * Les exemples reprennent autant que possible des phrases des leçons. Chaque
 * exemple passe par le validateur (`npm run check:wolof`), qui vérifie aussi
 * qu'il contient bien la lettre ou le groupe présenté.
 */
import { AUDIO_BASE, type ReviewStatus } from '@/data/lessons/types';

/** Dossier audio du glossaire : public/audio/glossaire/<id de la fiche>.mp3 (exemple prononcé). */
export const GLOSSARY_AUDIO_DIR = 'glossaire';

export function glossaryAudioUrl(cardId: string): string {
  return `${AUDIO_BASE}/${GLOSSARY_AUDIO_DIR}/${cardId}.mp3`;
}

export type SoundCategory = 'voyelle' | 'longueur' | 'consonne' | 'geminee' | 'prenasale';

export interface SoundCard {
  id: string;
  /** lettres ou groupes présentés ; l'exemple doit en contenir au moins un */
  graphemes: string[];
  name: string;
  /** approximation du son pour un francophone */
  sound: string;
  exampleWolof: string;
  exampleFrench: string;
  description: string;
  category: SoundCategory;
  review: { status: ReviewStatus; note?: string };
}

export const SOUND_CATEGORY_LABELS: Record<SoundCategory, string> = {
  voyelle: 'Voyelle',
  longueur: 'Longueur',
  consonne: 'Consonne',
  geminee: 'Géminée',
  prenasale: 'Prénasale',
};

const DRAFT = { status: 'draft' } as const;

export const soundCards: SoundCard[] = [
  // ── Voyelles ──
  {
    id: 'v-a',
    graphemes: ['a'],
    name: 'a',
    sound: 'a de « patte »',
    exampleWolof: 'Dafa seer.',
    exampleFrench: 'C\'est cher.',
    description: '« a » ouvert et bref, comme en français. Doublé (« aa »), il devient long.',
    category: 'voyelle',
    review: DRAFT,
  },
  {
    id: 'v-a-grave',
    graphemes: ['à'],
    name: 'à',
    sound: 'a bref',
    exampleWolof: 'Jàmm rekk.',
    exampleFrench: 'Tout va bien.',
    description:
      '« a » ouvert et bref. On ne l\'écrit que devant une consonne double ou un groupe nasal (jàmm, wàññi, ndànk). Il n\'a jamais de forme longue : on n\'écrit pas « àà ».',
    category: 'voyelle',
    review: DRAFT,
  },
  {
    id: 'v-e',
    graphemes: ['e'],
    name: 'e',
    sound: 'è de « fête »',
    exampleWolof: 'Na nga def ?',
    exampleFrench: 'Comment vas-tu ?',
    description: 'Sans accent, le « e » wolof est toujours ouvert, comme « è ». Il ne se tait jamais, même en fin de mot.',
    category: 'voyelle',
    review: DRAFT,
  },
  {
    id: 'v-e-acute',
    graphemes: ['é'],
    name: 'é',
    sound: 'é de « été »',
    exampleWolof: 'Dégg nga wolof ?',
    exampleFrench: 'Tu comprends le wolof ?',
    description: '« é » fermé, bouche peu ouverte, comme en français. À ne pas confondre avec le « e » ouvert ni avec le « ë » central.',
    category: 'voyelle',
    review: DRAFT,
  },
  {
    id: 'v-e-diaeresis',
    graphemes: ['ë'],
    name: 'ë',
    sound: 'e de « le »',
    exampleWolof: 'Jërëjëf.',
    exampleFrench: 'Merci.',
    description:
      'Voyelle centrale, lèvres détendues, proche du « e » de « le » mais toujours prononcée. Elle est toujours brève : « ëë » n\'existe pas.',
    category: 'voyelle',
    review: DRAFT,
  },
  {
    id: 'v-o',
    graphemes: ['o'],
    name: 'o',
    sound: 'o de « porte »',
    exampleWolof: 'Amul solo.',
    exampleFrench: 'Ce n\'est pas grave.',
    description: 'Sans accent, le « o » wolof est ouvert, comme dans « porte » ou « bol ».',
    category: 'voyelle',
    review: DRAFT,
  },
  {
    id: 'v-o-acute',
    graphemes: ['ó'],
    name: 'ó',
    sound: 'o de « mot »',
    exampleWolof: 'góor',
    exampleFrench: 'homme',
    description: '« o » fermé, lèvres arrondies et peu ouvertes, comme dans « mot » ou « eau ». Long, il s\'écrit « óo ».',
    category: 'voyelle',
    review: { status: 'draft', note: 'Confirmer l\'exemple « góor » (homme).' },
  },
  {
    id: 'v-u',
    graphemes: ['u'],
    name: 'u',
    sound: 'ou de « loup »',
    exampleWolof: 'Ba suba.',
    exampleFrench: 'À demain.',
    description: 'Le « u » wolof se prononce toujours « ou ». Le son « u » du français n\'existe pas en wolof.',
    category: 'voyelle',
    review: DRAFT,
  },

  // ── Longueur ──
  {
    id: 'l-long',
    graphemes: ['aa', 'ee', 'ii', 'oo', 'uu'],
    name: 'Voyelles longues',
    sound: 'voyelle tenue',
    exampleWolof: 'Salaamaalekum.',
    exampleFrench: 'Bonjour.',
    description:
      'Une voyelle doublée se tient environ deux fois plus longtemps. La longueur fait partie du mot et peut en changer le sens : ne la raccourcis pas.',
    category: 'longueur',
    review: DRAFT,
  },
  {
    id: 'l-long-closed',
    graphemes: ['ée', 'óo'],
    name: 'Voyelles longues fermées',
    sound: 'é ou o fermé tenu',
    exampleWolof: 'Déedéet.',
    exampleFrench: 'Non.',
    description:
      'Le « é » et le « ó » longs s\'écrivent avec l\'accent sur la première voyelle seulement : « ée », « óo ». « à » et « ë » n\'ont pas de forme longue.',
    category: 'longueur',
    review: DRAFT,
  },

  // ── Consonnes ──
  {
    id: 'c-c',
    graphemes: ['c'],
    name: 'c',
    sound: 'proche de « tch »',
    exampleWolof: 'ceeb',
    exampleFrench: 'riz',
    description:
      'Le « c » wolof ne se dit jamais « k » ni « s ». C\'est un son proche de « tch », plus doux, la langue contre le palais. Il se prononce ainsi devant toutes les voyelles.',
    category: 'consonne',
    review: DRAFT,
  },
  {
    id: 'c-j',
    graphemes: ['j'],
    name: 'j',
    sound: 'dj de « Djibouti »',
    exampleWolof: 'Jàmm nga am ?',
    exampleFrench: 'Tout va bien ?',
    description: 'Le « j » wolof se dit « dj », la langue contre le palais. Ce n\'est jamais le « j » français de « jour ».',
    category: 'consonne',
    review: DRAFT,
  },
  {
    id: 'c-g',
    graphemes: ['g'],
    name: 'g',
    sound: 'g de « gare »',
    exampleWolof: 'Bëgg naa ko.',
    exampleFrench: 'Je le prends.',
    description: 'Le « g » est toujours dur, comme dans « gare », même devant « e » ou « i ». Il ne se prononce jamais comme le « g » de « girafe ».',
    category: 'consonne',
    review: DRAFT,
  },
  {
    id: 'c-s',
    graphemes: ['s'],
    name: 's',
    sound: 's de « sac »',
    exampleWolof: 'Dinaa dellusi.',
    exampleFrench: 'Je reviendrai.',
    description: 'Le « s » est toujours sourd, même entre deux voyelles : « dellusi » se dit « del-lou-si », jamais « zi ».',
    category: 'consonne',
    review: DRAFT,
  },
  {
    id: 'c-r',
    graphemes: ['r'],
    name: 'r',
    sound: 'r roulé',
    exampleWolof: 'Naka waa kër ga ?',
    exampleFrench: 'Comment va la famille ?',
    description: 'Le « r » est roulé avec le bout de la langue, en un battement bref, comme en espagnol ou en italien. Ce n\'est pas le « r » de gorge du français.',
    category: 'consonne',
    review: DRAFT,
  },
  {
    id: 'c-x',
    graphemes: ['x'],
    name: 'x',
    sound: 'jota espagnole',
    exampleWolof: 'Jox ma benn.',
    exampleFrench: 'Donne-m\'en un.',
    description: 'Le « x » ne se dit jamais « ks ». C\'est un souffle raclé au fond de la bouche, comme la « jota » espagnole ou le « ch » allemand de « Bach ».',
    category: 'consonne',
    review: DRAFT,
  },
  {
    id: 'c-q',
    graphemes: ['q'],
    name: 'q',
    sound: 'k très profond',
    exampleWolof: 'dàq',
    exampleFrench: 'chasser',
    description: 'Un « k » articulé tout au fond de la gorge, plus loin et plus fort qu\'un « k » ordinaire. Il n\'est jamais suivi d\'un « u » muet comme en français.',
    category: 'consonne',
    review: { status: 'draft', note: 'Confirmer l\'exemple « dàq » (chasser).' },
  },
  {
    id: 'c-n-tilde',
    graphemes: ['ñ'],
    name: 'ñ',
    sound: 'gn de « agneau »',
    exampleWolof: 'Ñaata la ?',
    exampleFrench: 'C\'est combien ?',
    description: 'Le même son que « gn » en français, mais il peut aussi commencer un mot. On l\'écrit toujours « ñ », jamais « gn ».',
    category: 'consonne',
    review: DRAFT,
  },

  // ── Consonnes doubles ──
  {
    id: 'g-geminates',
    graphemes: ['bb', 'cc', 'dd', 'gg', 'jj', 'kk', 'll', 'mm', 'nn', 'ññ', 'pp', 'tt', 'ww', 'yy'],
    name: 'Consonnes géminées',
    sound: 'consonne tenue',
    exampleWolof: 'Fan nga dëkk ?',
    exampleFrench: 'Où habites-tu ?',
    description:
      'Une consonne doublée se tient un court instant avant d\'être relâchée. Elle fait partie du mot : l\'avaler peut le rendre méconnaissable. Un mot ne commence jamais par une consonne double.',
    category: 'geminee',
    review: DRAFT,
  },

  // ── Prénasales ──
  {
    id: 'p-prenasals',
    graphemes: ['mb', 'mp', 'nd', 'nt', 'nc', 'nj', 'ng', 'nk', 'nq'],
    name: 'Consonnes prénasalisées',
    sound: 'n + consonne d\'un seul geste',
    exampleWolof: 'Ndax mën nga wax ndànk ?',
    exampleFrench: 'Peux-tu parler lentement ?',
    description:
      'Le « m » ou le « n » et la consonne qui suit se disent d\'un seul geste, sans voyelle entre les deux. Ces groupes peuvent commencer un mot : « nd » dans « ndax », « ng » dans « nga ».',
    category: 'prenasale',
    review: DRAFT,
  },
];
