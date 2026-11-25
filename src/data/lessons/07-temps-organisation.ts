import { audioFor, DRAFT, type Lesson } from '@/data/lessons/types';

const ID = '07-temps-organisation';

/**
 * Temps & organisation : situer un moment, dire qu'on est prêt, faire patienter.
 * Phrases fournies par l'auteur du projet, reprises telles quelles et encore
 * en brouillon (relecture native à faire). Identifiant « 07-leegi-mu-ñëw »
 * devenu « 07-leegi-mu-new » (ASCII), car l'identifiant sert de nom de fichier audio.
 */
const tempsOrganisation: Lesson = {
  id: ID,
  order: 7,
  phrasePrefix: '07',
  published: true,
  title: 'Temps & organisation',
  summary: 'Dire quand quelque chose a lieu, annoncer qu\'on est prêt, faire patienter et se donner rendez-vous.',
  phrases: [
    {
      id: '07-tay-la',
      wolof: 'Tay la.',
      french: 'C\'est aujourd\'hui.',
      situation: 'Confirmer la date d\'un rendez-vous, d\'une fête ou d\'une livraison quand on te demande « c\'est quand ? ».',
      pronunciationNote: '« Tay » rime avec « ail » : un seul souffle, sans couper entre « a » et « y ». « la » bref.',
      ...audioFor(ID, '07-tay-la'),
      review: { status: 'draft', note: 'Graphie à confirmer : l\'orthographe officielle écrit généralement « tey » (aujourd\'hui) plutôt que « tay ».' },
    },
    {
      id: '07-suba-la',
      wolof: 'Suba la.',
      french: 'C\'est demain.',
      situation: 'Répondre que le rendez-vous, le marché ou le départ est prévu pour le lendemain.',
      pronunciationNote: '« Suba » : « sou-ba », deux syllabes brèves ; le « s » reste sourd, jamais « z ».',
      ...audioFor(ID, '07-suba-la'),
      review: DRAFT,
    },
    {
      id: '07-leegi-mu-new',
      wolof: 'Leegi mu ñëw.',
      french: 'Il ou elle arrive tout de suite / bientôt.',
      situation: 'Rassurer quelqu\'un qui attend une personne en retard, au téléphone ou devant la maison.',
      pronunciationNote: '« Leegi » : « ee » long et ouvert (« lèè-gi »). « ñëw » : « gn » d\'« agneau » puis « ë » bref (« gnëw »).',
      ...audioFor(ID, '07-leegi-mu-new'),
      review: {
        status: 'draft',
        note: 'Tournure à confirmer : « Leegi mu ñëw » ou une forme plus courante comme « Mu ngi ñëw leegi » / « Leegi lay ñëw ».',
      },
    },
    {
      id: '07-pare-naa',
      wolof: 'Pare naa.',
      french: 'Je suis prêt / C\'est prêt.',
      situation: 'Annoncer que tu es prêt à partir, ou que le repas ou la commande est prête.',
      pronunciationNote: '« Pare » : « pa-rè », « r » roulé d\'un battement, « e » ouvert. « naa » long porte le « je ».',
      ...audioFor(ID, '07-pare-naa'),
      review: {
        status: 'draft',
        note: '« Pare naa » signifie « je suis prêt » ; pour « c\'est prêt », on attendrait plutôt « Pare na ». Choisir une seule traduction.',
      },
    },
    {
      id: '07-xaral-ma-pare',
      wolof: 'Xaral ma pare.',
      french: 'Attends que je sois prêt.',
      situation: 'Demander à quelqu\'un de patienter pendant que tu finis de te préparer avant de sortir.',
      pronunciationNote: '« x » raclé au fond de la gorge, comme la « jota » espagnole. « pare » : « pa-rè », « r » roulé.',
      ...audioFor(ID, '07-xaral-ma-pare'),
      review: {
        status: 'draft',
        note: 'Probable faute de longueur : « attendre » s\'écrit « xaar », d\'où « Xaaral » (comme 04-xaaral-tuuti). « Xaral » avec un « a » bref est à vérifier.',
      },
    },
    {
      id: '07-amul-solo',
      wolof: 'Amul solo.',
      french: 'Ce n\'est pas grave / Pas de souci.',
      situation: 'Rassurer quelqu\'un qui s\'excuse d\'un retard ou d\'un changement d\'horaire.',
      pronunciationNote: '« amul » : « a-moul », ne laisse pas tomber le « -ul » de la négation. « solo » : deux « o » brefs.',
      ...audioFor(ID, '07-amul-solo'),
      duplicateOf: 'marche-07',
      review: DRAFT,
    },
    {
      id: '07-ci-kanam',
      wolof: 'Ci kanam.',
      french: 'À plus tard / La suite au prochain rendez-vous.',
      situation: 'Prendre congé en fin de rencontre quand on prévoit de se revoir sans fixer de date.',
      pronunciationNote: '« Ci » : « tchi », le « c » wolof proche de « tch ». « kanam » : « ka-nam », deux « a » brefs.',
      ...audioFor(ID, '07-ci-kanam'),
      review: {
        status: 'draft',
        note: 'Formule à confirmer : pour « à plus tard », on entend surtout « Ba ci kanam » ; « Ci kanam » seul signifie plutôt « devant / à l\'avenir ».',
      },
    },
  ],
};

export default tempsOrganisation;
