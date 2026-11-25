import { audioFor, DRAFT, type Lesson } from '@/data/lessons/types';

const ID = '02-au-marche';

const auMarche: Lesson = {
  id: ID,
  order: 2,
  phrasePrefix: 'marche',
  published: true,
  title: 'Au marché : demander et marchander',
  summary: 'Demander un prix, négocier poliment, commander et prendre congé du vendeur.',
  assembly: {
    situation: 'Tu achètes un tissu au marché Sandaga',
    situationDetail: 'Demande le prix, réagis au montant, négocie une petite baisse, puis conclus l\'achat.',
    prompt: 'Remets tes répliques dans l\'ordre naturel du marchandage.',
    steps: ['marche-01', 'marche-02', 'marche-03', 'marche-04'],
  },
  phrases: [
    {
      id: 'marche-01',
      wolof: 'Ñaata la ?',
      french: 'C\'est combien ?',
      situation: 'Demander le prix d\'un article au marché ou dans une boutique.',
      pronunciationNote:
        '« Ñaa » commence par le « gn » d\'« agneau » et le « aa » est long : « gnaa-ta la ». La question monte légèrement à la fin.',
      ...audioFor(ID, 'marche-01'),
      review: DRAFT,
    },
    {
      id: 'marche-02',
      wolof: 'Dafa seer.',
      french: 'C\'est cher.',
      situation: 'Réagir à un prix pour ouvrir la négociation.',
      pronunciationNote:
        '« seer » : le « e » est ouvert et long, « sèèr », et le « r » final est roulé. « Dafa » est bref, l\'insistance porte sur « seer ».',
      ...audioFor(ID, 'marche-02'),
      review: DRAFT,
    },
    {
      id: 'marche-03',
      wolof: 'Wàññi ma tuuti.',
      french: 'Baisse un peu le prix.',
      literal: 'Diminue-moi un peu.',
      situation: 'Demander une réduction au vendeur, sur un ton aimable.',
      pronunciationNote:
        '« wàññi » : « à » bref, puis un « ñ » double qu\'on tient (« wàgn-gni »). « tuuti » : « uu » long, « touu-ti ».',
      ...audioFor(ID, 'marche-03'),
      review: DRAFT,
    },
    {
      id: 'marche-04',
      wolof: 'Bëgg naa ko.',
      french: 'Je le prends.',
      literal: 'Je le veux.',
      situation: 'Conclure l\'achat une fois le prix accepté.',
      pronunciationNote:
        '« bëgg » : « ë » bref et central, puis un « g » double tenu. « naa » est long : c\'est lui qui porte le « je ».',
      ...audioFor(ID, 'marche-04'),
      review: DRAFT,
    },
    {
      id: 'marche-05',
      wolof: 'Jox ma benn.',
      french: 'Donne-m\'en un.',
      situation: 'Demander une unité d\'un article au vendeur.',
      pronunciationNote:
        'Le « x » se dit au fond de la gorge, comme la « jota » espagnole ou un « r » raclé. « benn » se termine sur un « n » double qu\'on tient.',
      ...audioFor(ID, 'marche-05'),
      review: DRAFT,
    },
    {
      id: 'marche-06',
      wolof: 'Dama bëgg kafe Tuubaa.',
      french: 'Je voudrais un café Touba.',
      situation: 'Commander un café Touba (café épicé au poivre de Guinée) dans une gargote ou auprès d\'un vendeur de rue.',
      pronunciationNote:
        '« Tuubaa » contient deux voyelles longues : « touu-baa ». « kafe » se dit « ka-fè », avec un « e » ouvert.',
      ...audioFor(ID, 'marche-06'),
      review: { status: 'draft', note: 'Confirmer la graphie de l\'emprunt « kafe » et du nom propre « Tuubaa ».' },
    },
    {
      id: 'marche-07',
      wolof: 'Amul solo.',
      french: 'Ce n\'est pas grave.',
      literal: 'Ça n\'a pas d\'importance.',
      situation: 'Rassurer quelqu\'un qui s\'excuse, ou accepter un petit contretemps (pas de monnaie, rupture de stock…).',
      pronunciationNote:
        '« amul » se dit « a-moul » : la terminaison « -ul » porte la négation, ne la laisse pas tomber. « solo » : deux « o » brefs.',
      ...audioFor(ID, 'marche-07'),
      review: DRAFT,
    },
    {
      id: 'marche-08',
      wolof: 'Dinaa dellusi.',
      french: 'Je reviendrai.',
      situation: 'Quitter le vendeur poliment sans acheter, ou promettre de revenir.',
      pronunciationNote:
        '« Dinaa » : « aa » long en fin de mot. « dellusi » : le « l » double se tient, « del-lou-si ».',
      ...audioFor(ID, 'marche-08'),
      review: DRAFT,
    },
  ],
};

export default auMarche;
