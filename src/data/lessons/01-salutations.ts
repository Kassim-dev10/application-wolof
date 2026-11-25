import { audioFor, DRAFT, type Lesson } from '@/data/lessons/types';

const ID = '01-salutations';

const salutations: Lesson = {
  id: ID,
  order: 1,
  phrasePrefix: 'salutations',
  published: true,
  title: 'Salutations & prise de contact',
  summary: 'Les formules du quotidien pour saluer, prendre des nouvelles et se quitter.',
  assembly: {
    situation: 'Tu croises une voisine dans ton quartier à Dakar',
    situationDetail: 'Salue-la, demande comment elle va, prends des nouvelles de sa famille, remercie-la puis quitte-la jusqu\'au lendemain.',
    prompt: 'Remets tes répliques dans l\'ordre naturel de la conversation.',
    steps: ['salutations-01', 'salutations-03', 'salutations-07', 'salutations-09', 'salutations-10'],
  },
  phrases: [
    {
      id: 'salutations-01',
      wolof: 'Salaamaalekum.',
      french: 'Bonjour.',
      literal: 'Que la paix soit sur vous.',
      situation: 'En arrivant quelque part ou en abordant quelqu\'un. C\'est celui qui arrive qui salue le premier.',
      pronunciationNote:
        'Deux voyelles longues : « sa-LAA-MAA-le-koum ». Tiens chaque « aa » environ deux fois plus longtemps qu\'un « a » simple. Le « u » final se dit « ou ».',
      ...audioFor(ID, 'salutations-01'),
      review: DRAFT,
    },
    {
      id: 'salutations-02',
      wolof: 'Maalekum salaam.',
      french: 'Bonjour (en réponse).',
      literal: 'Sur vous la paix.',
      situation: 'Réponse obligée à « Salaamaalekum ».',
      pronunciationNote:
        'Le mot commence par un « aa » long (« MAA-le-koum »). Dans « salaam », tiens le « aa » puis ferme bien les lèvres sur le « m » final.',
      ...audioFor(ID, 'salutations-02'),
      review: DRAFT,
    },
    {
      id: 'salutations-03',
      wolof: 'Na nga def ?',
      french: 'Comment vas-tu ?',
      situation: 'Prendre des nouvelles d\'une personne que l\'on tutoie, juste après la salutation.',
      pronunciationNote:
        '« nga » : le « n » et le « g » se disent d\'un seul geste, sans voyelle devant, comme la fin de « dingue » enchaînée sur « a ». Dans « def », le « e » est ouvert et bref, comme le « è » de « fête ».',
      ...audioFor(ID, 'salutations-03'),
      review: DRAFT,
    },
    {
      id: 'salutations-04',
      wolof: 'Maa ngi fi rekk.',
      french: 'Je vais bien.',
      literal: 'Je suis là, simplement.',
      situation: 'Réponse habituelle à « Na nga def ? ».',
      pronunciationNote:
        '« Maa » est long. Dans « rekk », le double « k » est géminé : marque une courte tenue, langue bloquée, avant de relâcher le « k ». « rek » avec un seul « k » sonnerait faux.',
      ...audioFor(ID, 'salutations-04'),
      review: DRAFT,
    },
    {
      id: 'salutations-05',
      wolof: 'Jàmm nga am ?',
      french: 'Tout va bien ?',
      literal: 'As-tu la paix ?',
      situation: 'Autre façon courante de prendre des nouvelles, à n\'importe quel moment de la journée.',
      pronunciationNote:
        '« j » se dit « dj » comme dans « Djibouti ». « à » est bref et ouvert, suivi d\'un « m » double qu\'on tient : « djàm-m ».',
      ...audioFor(ID, 'salutations-05'),
      review: DRAFT,
    },
    {
      id: 'salutations-06',
      wolof: 'Jàmm rekk.',
      french: 'Tout va bien.',
      literal: 'La paix seulement.',
      situation: 'Réponse à « Jàmm nga am ? ».',
      pronunciationNote:
        'Deux consonnes doubles à tenir : le « mm » de « jàmm » puis le « kk » de « rekk ». Ne les avale pas, c\'est ce qui donne le rythme de la phrase.',
      ...audioFor(ID, 'salutations-06'),
      review: DRAFT,
    },
    {
      id: 'salutations-07',
      wolof: 'Naka waa kër ga ?',
      french: 'Comment va la famille ?',
      literal: 'Comment (vont) les gens de la maison ?',
      situation: 'Question attendue après les premières salutations, surtout avec quelqu\'un que l\'on connaît.',
      pronunciationNote:
        '« waa » est long. Dans « kër », le « ë » est central et bref, proche du « e » de « le ». Le « r » est roulé, d\'un seul battement de langue.',
      ...audioFor(ID, 'salutations-07'),
      review: DRAFT,
    },
    {
      id: 'salutations-08',
      wolof: 'Ñu ngi fa.',
      french: 'Ils vont bien.',
      literal: 'Ils sont là(-bas).',
      situation: 'Réponse à « Naka waa kër ga ? ».',
      pronunciationNote:
        '« ñ » se dit comme le « gn » d\'« agneau », mais en début de mot : colle le dos de la langue au palais, puis enchaîne sur « ou ».',
      ...audioFor(ID, 'salutations-08'),
      review: DRAFT,
    },
    {
      id: 'salutations-09',
      wolof: 'Jërëjëf.',
      french: 'Merci.',
      situation: 'Pour remercier, en toute situation.',
      pronunciationNote:
        'Trois « ë » brefs et centraux, comme le « e » de « le » : « djë-rë-djëf ». Ne les transforme pas en « é ». Le « r » est roulé.',
      ...audioFor(ID, 'salutations-09'),
      review: DRAFT,
    },
    {
      id: 'salutations-10',
      wolof: 'Ba suba.',
      french: 'À demain.',
      situation: 'Pour se quitter quand on se revoit le lendemain.',
      pronunciationNote: 'Deux syllabes simples et brèves : « sou-ba ». Le « s » reste toujours sourd, même entre deux voyelles.',
      ...audioFor(ID, 'salutations-10'),
      review: DRAFT,
    },
    {
      id: 'salutations-11',
      wolof: 'Ba beneen yoon.',
      french: 'À une prochaine fois.',
      literal: 'Jusqu\'à une autre fois.',
      situation: 'Pour se quitter sans fixer de prochain rendez-vous.',
      pronunciationNote:
        'Dans « beneen », le premier « e » est bref et le second long : « be-nèèn ». « yoon » a un « o » ouvert long.',
      ...audioFor(ID, 'salutations-11'),
      review: { status: 'draft', note: 'Confirmer la graphie « beneen » (voyelle longue) plutôt que « benen ».' },
    },
  ],
};

export default salutations;
