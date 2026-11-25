import { audioFor, DRAFT, type Lesson } from '@/data/lessons/types';

const ID = '05-famille-maison';

/**
 * Famille & maison : arriver chez quelqu'un, prendre des nouvelles, s'installer, repartir.
 * Phrases fournies par l'auteur du projet, reprises telles quelles et encore
 * en brouillon (relecture native à faire). Identifiants passés en ASCII, car
 * l'identifiant sert de nom de fichier audio :
 * « 05-ñëw-naa » → « 05-new-naa », « 05-duma-yàgg » → « 05-duma-yagg »,
 * « 05-bëgg-naa-dem » → « 05-begg-naa-dem ».
 */
const familleMaison: Lesson = {
  id: ID,
  order: 5,
  phrasePrefix: '05',
  published: true,
  title: 'Famille & maison',
  summary: 'Arriver à la maison, prendre des nouvelles de la famille, s\'installer et annoncer son départ.',
  phrases: [
    {
      id: '05-new-naa',
      wolof: 'Ñëw naa.',
      french: 'Je suis arrivé / Je rentre.',
      situation: 'En franchissant la porte de la maison familiale, pour annoncer ton arrivée à ceux qui sont là.',
      pronunciationNote: '« Ñëw » : « gn » d\'« agneau » en début de mot, puis « ë » bref (« gnëw »). « naa » long porte le « je ».',
      ...audioFor(ID, '05-new-naa'),
      review: DRAFT,
    },
    {
      id: '05-ana-waa-ker',
      wolof: 'Ana waa kër gi ?',
      french: 'Comment vont les gens de la maison / la famille ?',
      situation: 'En arrivant chez des proches, demander des nouvelles de toute la maisonnée après les salutations.',
      pronunciationNote: '« waa » long. « kër » : « ë » bref et central, « r » roulé d\'un battement. « gi » : « g » toujours dur.',
      ...audioFor(ID, '05-ana-waa-ker'),
      review: {
        status: 'draft',
        note: 'Proche de salutations-07 « Naka waa kër ga ? ». Confirmer « Ana » (litt. « où sont… ? », aussi employé pour prendre des nouvelles) et « gi » (la maison où l\'on est) face à « ga » (celle dont on parle).',
      },
    },
    {
      id: '05-mu-ngi-biir',
      wolof: 'Mu ngi ci biir.',
      french: 'Il ou elle est à l\'intérieur.',
      situation: 'Répondre à un visiteur qui demande où est la personne qu\'il vient voir.',
      pronunciationNote: '« ngi » : « n » et « g » d\'un seul geste. « biir » : « ii » long, « bii-r », « r » roulé.',
      ...audioFor(ID, '05-mu-ngi-biir'),
      review: DRAFT,
    },
    {
      id: '05-duma-yagg',
      wolof: 'Duma yàgg.',
      french: 'Je ne vais pas tarder / Je ne reste pas longtemps.',
      situation: 'Prévenir ton hôte que ta visite sera courte, ou rassurer quelqu\'un qui t\'attend.',
      pronunciationNote: '« Duma » : « dou-ma ». « yàgg » : « à » bref et ouvert, puis « g » double tenu avant de relâcher.',
      ...audioFor(ID, '05-duma-yagg'),
      review: DRAFT,
    },
    {
      id: '05-toogal-ci-kanam',
      wolof: 'Toogal ci kanam.',
      french: 'Assieds-toi devant / par là.',
      situation: 'Inviter un visiteur à s\'asseoir en lui indiquant la place devant toi ou au salon.',
      pronunciationNote: '« Toogal » : « oo » long et ouvert, « too-gal ». « ci » se dit « tchi ». « kanam » : deux « a » brefs.',
      ...audioFor(ID, '05-toogal-ci-kanam'),
      review: DRAFT,
    },
    {
      id: '05-begg-naa-dem',
      wolof: 'Bëgg naa dem.',
      french: 'Je veux y aller / Je dois partir.',
      situation: 'Annoncer poliment à tes hôtes que tu souhaites prendre congé.',
      pronunciationNote: '« bëgg » : « ë » bref puis « g » double tenu. « naa » long. « dem » : « e » ouvert, comme « è ».',
      ...audioFor(ID, '05-begg-naa-dem'),
      review: {
        status: 'draft',
        note: '« Bëgg naa dem » veut dire « je veux partir ». « Je dois partir » se dirait plutôt « War naa dem ». Garder une seule traduction ?',
      },
    },
    {
      id: '05-ba-suba',
      wolof: 'Ba suba.',
      french: 'À demain.',
      situation: 'Quitter la famille le soir en sachant que tu reviens le lendemain.',
      pronunciationNote: 'Deux mots brefs : « ba sou-ba ». Le « s » reste sourd, jamais « z », même entre deux voyelles.',
      ...audioFor(ID, '05-ba-suba'),
      duplicateOf: 'salutations-10',
      review: DRAFT,
    },
  ],
};

export default familleMaison;
