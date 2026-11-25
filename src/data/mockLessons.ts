// Mock lesson data for Wax Wolof 15.
// All wolof phrases are everyday Senegalese Wolof. Audio is simulated (no real files).

export type VowelLength = 'long' | 'short';
export type SpecialMark = 'long-vowel' | 'geminate' | 'implosive' | 'nasal' | 'ejective';

export interface PhonemeHighlight {
  /** start index in the wolof string */
  start: number;
  /** end index (exclusive) */
  end: number;
  mark: SpecialMark;
}

export interface PhraseItem {
  id: string;
  wolof: string;
  french: string;
  /** phonetic approximation in French-ish spelling */
  phonetic: string;
  highlights: PhonemeHighlight[];
  /** short note on a notable sound */
  note?: string;
  context: string;
}

export interface AssemblyStep {
  id: string;
  wolof: string;
  french: string;
  /** whether this chunk is the natural "answer" to keep */
  isAnswer?: boolean;
}

export interface AssemblyTask {
  id: string;
  situation: string;
  situationDetail: string;
  prompt: string;
  /** correct ordered answer chunk ids */
  answerOrder: string[];
  chunks: AssemblyStep[];
  fullWolof: string;
  fullFrench: string;
}

export interface SpeakingTask {
  id: string;
  wolof: string;
  french: string;
  phonetic: string;
  context: string;
  tip: string;
}

export interface DaySession {
  dayLabel: string;
  theme: string;
  themeDetail: string;
  listening: PhraseItem[];
  assembly: AssemblyTask;
  speaking: SpeakingTask[];
}

export interface SoundCard {
  id: string;
  grapheme: string;
  name: string;
  sound: string;
  exampleWolof: string;
  exampleFrench: string;
  description: string;
  category: 'voyelle' | 'consonne' | 'longueur' | 'geMinee';
}

// ---- Day 1: Salutations & prise de contact ----

const listening1: PhraseItem[] = [
  {
    id: 'l1-1',
    wolof: 'Na nga def ?',
    french: 'Comment vas-tu ?',
    phonetic: 'Na nga def',
    highlights: [
      { start: 3, end: 5, mark: 'long-vowel' },
    ],
    note: 'Le « a » de « nga » est une voyelle longue : on le tient légèrement.',
    context: 'Saluer une personne de près.',
  },
  {
    id: 'l1-2',
    wolof: 'Ma ngi fi rekk.',
    french: 'Je suis là, tout simplement.',
    phonetic: 'Ma ngi fi rekk',
    highlights: [
      { start: 9, end: 11, mark: 'geminate' },
    ],
    note: 'Le double « k » de « rekk » est géminé : on marque les deux consonnes.',
    context: 'Réponse modeste à « Comment vas-tu ? »',
  },
  {
    id: 'l1-3',
    wolof: 'Ñu ngi ci jàmm ?',
    french: 'Est-on dans la paix ?',
    phonetic: 'Ñu ngi ci jàmm',
    highlights: [
      { start: 0, end: 1, mark: 'nasal' },
      { start: 12, end: 16, mark: 'geminate' },
    ],
    note: 'Le « ñ » est une consonne nasale palatale, comme le « gn » français mais plus appuyé.',
    context: 'Saluer un groupe.',
  },
];

const assembly1: AssemblyTask = {
  id: 'a1',
  situation: 'Tu arrives sur un marché de Dakar',
  situationDetail: 'Tu croises une vendeuse que tu connais. Salue-la, demande comment elle va, puis prends congé.',
  prompt: 'Compose la séquence naturelle de salutation.',
  chunks: [
    { id: 'a1-1', wolof: 'Salaam aleekum', french: 'Que la paix soit sur toi' },
    { id: 'a1-2', wolof: 'Na nga def ?', french: 'Comment vas-tu ?', isAnswer: true },
    { id: 'a1-3', wolof: 'Jëf jëf', french: 'Merci beaucoup' },
    { id: 'a1-4', wolof: 'Ba benen yoon', french: 'À une prochaine fois' },
  ],
  answerOrder: ['a1-1', 'a1-2', 'a1-3', 'a1-4'],
  fullWolof: 'Salaam aleekum. Na nga def ? Jëf jëf, ba benen yoon.',
  fullFrench: 'Que la paix soit sur toi. Comment vas-tu ? Merci beaucoup, à une prochaine fois.',
};

const speaking1: SpeakingTask[] = [
  {
    id: 's1-1',
    wolof: 'Na nga def ?',
    french: 'Comment vas-tu ?',
    phonetic: 'Na nga def',
    context: 'Saluer un proche.',
    tip: 'Étire légèrement le « a » de « nga ». Le ton monte sur « def ».',
  },
  {
    id: 's1-2',
    wolof: 'Maa ngi fi, ànd ak jàmm.',
    french: 'Je suis là, en paix.',
    phonetic: 'Maa ngi fi, ànd ak jàmm',
    context: 'Répondre à une salutation.',
    tip: 'Le double « a » de « Maa » est long. « jàmm » se termine sur un « m » tenu.',
  },
];

export const dayOne: DaySession = {
  dayLabel: 'Jour 1',
  theme: 'Salutations & prise de contact',
  themeDetail: 'Les formules du quotidien pour entrer en relation à Dakar.',
  listening: listening1,
  assembly: assembly1,
  speaking: speaking1,
};

// ---- Day 2: Commander au comptoir ----

const listening2: PhraseItem[] = [
  {
    id: 'l2-1',
    wolof: 'Laa ñu tollu ?',
    french: 'Ça fait combien ?',
    phonetic: 'Laa ñu tollu',
    highlights: [
      { start: 0, end: 3, mark: 'long-vowel' },
    ],
    note: 'Le double « aa » de « Laa » est une voyelle longue marquée.',
    context: 'Demander le prix.',
  },
  {
    id: 'l2-2',
    wolof: 'Jënd naa ko ca baax.',
    french: "Je l'ai acheté pas cher.",
    phonetic: 'Jënd naa ko ca baax',
    highlights: [
      { start: 7, end: 10, mark: 'long-vowel' },
    ],
    note: 'Le « aa » de « naa » est long. « baax » contient la consonne « x », un « r » grasseyé.',
    context: "Parler d'un bon prix.",
  },
];

const assembly2: AssemblyTask = {
  id: 'a2',
  situation: 'Tu commandes un café touba',
  situationDetail: "Au comptoir d'un café, salue, commande, demande le prix, remercie.",
  prompt: 'Compose ta commande naturelle.',
  chunks: [
    { id: 'a2-1', wolof: 'Salaam aleekum', french: 'Bonjour (paix sur toi)' },
    { id: 'a2-2', wolof: 'May ma benn caffè touba', french: 'Donne-moi un café touba', isAnswer: true },
    { id: 'a2-3', wolof: 'Laa ñu tollu ?', french: 'Ça fait combien ?', isAnswer: true },
    { id: 'a2-4', wolof: 'Jëre jëf', french: 'Merci' },
  ],
  answerOrder: ['a2-1', 'a2-2', 'a2-3', 'a2-4'],
  fullWolof: 'Salaam aleekum. May ma benn caffè touba. Laa ñu tollu ? Jëre jëf.',
  fullFrench: 'Bonjour. Donne-moi un café touba. Ça fait combien ? Merci.',
};

const speaking2: SpeakingTask[] = [
  {
    id: 's2-1',
    wolof: 'Laa ñu tollu ?',
    french: 'Ça fait combien ?',
    phonetic: 'Laa ñu tollu',
    context: 'Demander le prix.',
    tip: '« Laa » avec un long « aa ». « ñu » : le « ñ » est nasal, comme « gn ».',
  },
  {
    id: 's2-2',
    wolof: 'May ma caffè touba, jëf.',
    french: "Donne-moi un café touba, s'il te plaît.",
    phonetic: 'May ma caffè touba, jëf',
    context: 'Commander une boisson.',
    tip: '« caffè » se dit à la française. Le « j » de « jëf » est doux, comme le « dj ».',
  },
];

export const dayTwo: DaySession = {
  dayLabel: 'Jour 2',
  theme: 'Commander au comptoir',
  themeDetail: 'Salue, commande, demande le prix et remercie naturellement.',
  listening: listening2,
  assembly: assembly2,
  speaking: speaking2,
};

export const sessions: DaySession[] = [dayOne, dayTwo];

// ---- Glossaire des sons clés ----

export const soundCards: SoundCard[] = [
  {
    id: 's-a',
    grapheme: 'a',
    name: 'a bref',
    sound: 'a ouvert, court',
    exampleWolof: 'def',
    exampleFrench: 'faire',
    description: '« a » ouvert comme dans le français « pâte », mais court et net.',
    category: 'voyelle',
  },
  {
    id: 's-aa',
    grapheme: 'aa',
    name: 'a long',
    sound: 'a ouvert, tenu',
    exampleWolof: 'Laa ñu tollu ?',
    exampleFrench: 'Ça fait combien ?',
    description: 'Le double « a » est une voyelle longue : on le tient une demi-seconde. Distinctif : « laa » ≠ « la ».',
    category: 'longueur',
  },
  {
    id: 's-e',
    grapheme: 'ë',
    name: 'ë muet/central',
    sound: 'e central, relâché',
    exampleWolof: 'bëët',
    exampleFrench: 'nuit',
    description: '« ë » est un son central, proche du « e » muet français mais plus présent. Souvent entre deux consonnes.',
    category: 'voyelle',
  },
  {
    id: 's-ee',
    grapheme: 'ëë',
    name: 'ë long',
    sound: 'e central, tenu',
    exampleWolof: 'bëët',
    exampleFrench: 'nuit',
    description: 'Le double « ëë » se tient, comme un soupir prolongé au centre de la bouche.',
    category: 'longueur',
  },
  {
    id: 's-o',
    grapheme: 'ó',
    name: 'o fermé',
    sound: 'o fermé, court',
    exampleWolof: 'tóóc',
    exampleFrench: 'têter',
    description: '« ó » fermé comme dans « mot ». Court et net en wolof.',
    category: 'voyelle',
  },
  {
    id: 's-eacute',
    grapheme: 'é',
    name: 'é fermé',
    sound: 'e fermé, court',
    exampleWolof: 'jëf',
    exampleFrench: 'merci',
    description: '« é » comme en français « été », court. Distinct du « ë » central.',
    category: 'voyelle',
  },
  {
    id: 's-c',
    grapheme: 'c',
    name: 'c (chuintant)',
    sound: 'tch',
    exampleWolof: 'caffè',
    exampleFrench: 'café',
    description: 'Le « c » wolof se prononce « tch » comme dans « tchat ». Devant « a/o/u » uniquement.',
    category: 'consonne',
  },
  {
    id: 's-j',
    grapheme: 'j',
    name: 'j (doué)',
    sound: 'dj',
    exampleWolof: 'jëf',
    exampleFrench: 'merci',
    description: 'Le « j » wolof est doux, comme « dj » dans « djembe ». Plus léger que le « j » français.',
    category: 'consonne',
  },
  {
    id: 's-n-tilde',
    grapheme: 'ñ',
    name: 'ñ (nasale palatale)',
    sound: 'gn',
    exampleWolof: 'Ñu ngi ci jàmm ?',
    exampleFrench: 'Est-on dans la paix ?',
    description: '« ñ » est une nasale palatale, proche du « gn » français de « agneau », mais plus appuyé et stable.',
    category: 'consonne',
  },
  {
    id: 's-ng',
    grapheme: 'ŋ',
    name: 'ŋ (nasale vélaire)',
    sound: 'ng',
    exampleWolof: 'ŋàkk',
    exampleFrench: 'manquer',
    description: '« ŋ » est la nasale vélaire, comme le « ng » de « parking » anglais, en début de syllabe.',
    category: 'consonne',
  },
  {
    id: 's-q',
    grapheme: 'q',
    name: 'q (uvulaire éjectif)',
    sound: 'q profond',
    exampleWolof: 'qàll',
    exampleFrench: 'ordonner',
    description: '« q » est une occlusive uvulaire, profonde dans la gorge, sans équivalent français. Proche du « q » arabe.',
    category: 'consonne',
  },
  {
    id: 's-x',
    grapheme: 'x',
    name: 'x (fricative vélaire)',
    sound: 'r grasseyé',
    exampleWolof: 'baax',
    exampleFrench: 'bien',
    description: '« x » est une fricative vélaire, comme le « j » espagnol ou le « r » grasseyé français de « Paris ».',
    category: 'consonne',
  },
  {
    id: 's-gem',
    grapheme: 'cc / kk / mm',
    name: 'consonnes géminées',
    sound: 'consonne double, tenue',
    exampleWolof: 'rekk, jàmm',
    exampleFrench: 'seulement, paix',
    description: 'Les consonnes géminées (doubles) se tiennent : on marque clairement les deux articulations. « rekk » ≠ « rek ».',
    category: 'geMinee',
  },
];

// ---- Indicateurs mockés (régularité + maîtrise orale) ----

export interface RegularityDay {
  day: number;
  label: string;
  done: boolean;
}

export const regularity: RegularityDay[] = [
  { day: 1, label: 'L', done: true },
  { day: 2, label: 'M', done: true },
  { day: 3, label: 'M', done: true },
  { day: 4, label: 'J', done: false },
  { day: 5, label: 'V', done: true },
  { day: 6, label: 'S', done: true },
  { day: 7, label: 'D', done: false },
];

export const masteryStats = {
  streakDays: 5,
  totalPhrasesMastered: 18,
  totalPhrasesToReview: 4,
  sessionsThisWeek: 5,
  sessionsThisWeekTarget: 7,
};
