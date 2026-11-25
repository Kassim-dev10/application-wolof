import { audioFor, DRAFT, type Lesson } from '@/data/lessons/types';

const ID = '06-repas-boissons';

/**
 * Repas & boissons : dire sa faim ou sa soif, apprécier le plat, remercier.
 * Phrases fournies par l'auteur du projet, reprises telles quelles et encore
 * en brouillon (relecture native à faire). Identifiants passés en ASCII, car
 * l'identifiant sert de nom de fichier audio :
 * « 06-bëgg-atoo » → « 06-begg-atoo », « 06-yàlla-na-sax » → « 06-yalla-na-sax ».
 */
const repasBoissons: Lesson = {
  id: ID,
  order: 6,
  phrasePrefix: '06',
  published: true,
  title: 'Repas & boissons',
  summary: 'Dire qu\'on a faim ou soif, apprécier le plat, demander de l\'eau et remercier après le repas.',
  phrases: [
    {
      id: '06-xiif-naa',
      wolof: 'Xiif naa.',
      french: 'J\'ai faim.',
      situation: 'Dire à ton hôte ou à la famille que tu as faim, avant le repas de midi.',
      pronunciationNote: '« Xiif » : « x » raclé au fond de la gorge, puis « ii » long (« xii-f »). « naa » long porte le « je ».',
      ...audioFor(ID, '06-xiif-naa'),
      review: DRAFT,
    },
    {
      id: '06-mar-naa',
      wolof: 'Mar naa.',
      french: 'J\'ai soif.',
      situation: 'Signaler que tu as soif, par exemple en arrivant chez quelqu\'un par forte chaleur.',
      pronunciationNote: '« Mar » : « a » bref et « r » roulé d\'un battement. « naa » : « aa » long, bien tenu.',
      ...audioFor(ID, '06-mar-naa'),
      review: DRAFT,
    },
    {
      id: '06-neex-na-lool',
      wolof: 'Neex na lool.',
      french: 'C\'est très bon / délicieux.',
      situation: 'Complimenter la cuisinière pendant le repas autour du bol commun.',
      pronunciationNote: '« Neex » : « ee » long et ouvert, puis « x » raclé (« nèè-x »). « lool » : « oo » long, « loo-l ».',
      ...audioFor(ID, '06-neex-na-lool'),
      review: DRAFT,
    },
    {
      id: '06-suur-naa',
      wolof: 'Suur naa.',
      french: 'Je suis rassasié / J\'ai assez mangé.',
      situation: 'Refuser poliment qu\'on te resserve, quand on insiste pour que tu manges encore.',
      pronunciationNote: '« Suur » : « s » sourd, « uu » long (« souu-r »), « r » roulé. Ne confonds pas avec « sur » bref.',
      ...audioFor(ID, '06-suur-naa'),
      review: DRAFT,
    },
    {
      id: '06-may-ma-ndox',
      wolof: 'May ma ndox.',
      french: 'Donne-moi de l\'eau.',
      situation: 'Demander de l\'eau à table ou à la personne qui sert les boissons.',
      pronunciationNote: '« ndox » : « n » et « d » d\'un seul geste, sans voyelle devant, puis « x » raclé (« ndo-x »).',
      ...audioFor(ID, '06-may-ma-ndox'),
      review: DRAFT,
    },
    {
      id: '06-begg-atoo',
      wolof: 'Bëggatoo ?',
      french: 'Tu n\'en veux plus / Tu ne veux pas goûter ?',
      situation: 'Proposer encore à manger à un invité qui s\'est arrêté de manger.',
      pronunciationNote: '« bëgg » : « ë » bref puis « g » double tenu ; « atoo » : « oo » long en fin de mot. Voix montante.',
      ...audioFor(ID, '06-begg-atoo'),
      review: {
        status: 'draft',
        note: 'À confirmer : le suffixe « -aat » (encore, de nouveau) a un « aa » long, d\'où peut-être « Bëggaatoo ? ». Et « tu ne veux pas goûter » ne correspond pas à « -aat » : garder « tu n\'en veux plus ? » seul ?',
      },
    },
    {
      id: '06-yalla-na-sax',
      wolof: 'Yàlla na sax.',
      french: 'Que cela dure / Qu\'il en soit toujours ainsi.',
      literal: 'Que Dieu fasse que cela dure.',
      situation: 'Formule de remerciement et de bénédiction après un repas, adressée à ceux qui l\'ont préparé.',
      pronunciationNote: '« Yàlla » : « à » bref devant le « l » double qu\'on tient (« yàl-la »). « sax » : « x » raclé.',
      ...audioFor(ID, '06-yalla-na-sax'),
      review: DRAFT,
    },
  ],
};

export default repasBoissons;
