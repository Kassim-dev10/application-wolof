import { audioFor, DRAFT, type Lesson } from '@/data/lessons/types';

const ID = '04-transports';

/**
 * Transports : taxi, car rapide, clando.
 * Phrases fournies par l'auteur du projet, reprises telles quelles et encore
 * en brouillon (relecture native à faire). Identifiants descriptifs en ASCII :
 * « 04-ñaata-la » et « 04-jërëjëf-ba-beneen » sont devenus « 04-naata-la » et
 * « 04-jerejef-ba-beneen », car l'identifiant sert de nom de fichier audio.
 * Pas encore figés dans phrase-ids.lock.json.
 */
const transports: Lesson = {
  id: ID,
  order: 4,
  phrasePrefix: '04',
  published: true,
  title: 'Transports',
  summary: 'Demander où va un taxi ou un car rapide, indiquer sa destination, négocier la course et descendre au bon endroit.',
  phrases: [
    {
      id: '04-fo-jem',
      wolof: 'Fo jëm ?',
      french: 'Tu vas où ?',
      situation: 'Au bord de la route, demander à un chauffeur de taxi ou de clando quelle est sa direction.',
      pronunciationNote: '« jëm » : « j » comme « dj », « ë » bref et central (« djëm »). La voix monte légèrement à la fin de la question.',
      ...audioFor(ID, '04-fo-jem'),
      review: { status: 'draft', note: 'Graphie à confirmer : « Fo jëm ? » ou « Foo jëm ? » (forme contractée de « fan nga », souvent écrite avec un « oo » long).' },
    },
    {
      id: '04-ma-ngi-dem',
      wolof: 'Maa ngi dem...',
      french: 'Je suis en train d\'aller à…',
      situation: 'Annoncer sa destination au chauffeur, en complétant par le lieu (quartier, marché, gare).',
      pronunciationNote: '« Maa » est long, « ngi » se dit d\'un seul geste « ngi ». « dem » : « e » ouvert, comme « è ».',
      ...audioFor(ID, '04-ma-ngi-dem'),
      review: {
        status: 'draft',
        note: 'Phrase à compléter : les points de suspension ne peuvent pas être enregistrés. Choisir une destination réelle pour l\'audio (et la relecture).',
      },
    },
    {
      id: '04-ana-yoon',
      wolof: 'Ana yoonu... ?',
      french: 'Par où passe-t-on pour aller à… ? / Où est le chemin de… ?',
      situation: 'Demander son chemin à un passant ou à un apprenti de car rapide, en complétant par le lieu cherché.',
      pronunciationNote: '« yoonu » : « oo » long et ouvert, puis « nou » : « yoo-nou ». « Ana » : deux « a » brefs.',
      ...audioFor(ID, '04-ana-yoon'),
      review: {
        status: 'draft',
        note: 'Phrase à compléter : points de suspension à remplacer par un lieu réel pour l\'audio.',
      },
    },
    {
      id: '04-naata-la',
      wolof: 'Ñaata la ?',
      french: 'C\'est combien ?',
      situation: 'Demander le prix de la course avant de monter dans le taxi.',
      pronunciationNote: '« Ñaa » : le « gn » d\'« agneau » suivi d\'un « aa » long (« gnaa-ta la »).',
      ...audioFor(ID, '04-naata-la'),
      duplicateOf: 'marche-01',
      review: DRAFT,
    },
    {
      id: '04-taxawal-fi',
      wolof: 'Taxawal fi.',
      french: 'Arrête-toi ici.',
      situation: 'Demander au chauffeur de s\'arrêter pour descendre.',
      pronunciationNote: '« x » raclé au fond de la gorge, comme la « jota » espagnole : « ta-xa-wal fi ».',
      ...audioFor(ID, '04-taxawal-fi'),
      review: { status: 'draft', note: 'À confirmer : « taxawal » (faire arrêter) adressé au chauffeur, et « fi » ou « fii » pour « ici ».' },
    },
    {
      id: '04-xaaral-tuuti',
      wolof: 'Xaaral tuuti.',
      french: 'Attends un petit peu.',
      situation: 'Demander au chauffeur d\'attendre pendant que tu cherches ta monnaie ou que quelqu\'un te rejoint.',
      pronunciationNote: '« Xaa » : « x » raclé puis « aa » long. « tuuti » : « uu » long, « touu-ti ».',
      ...audioFor(ID, '04-xaaral-tuuti'),
      review: DRAFT,
    },
    {
      id: '04-jerejef-ba-beneen',
      wolof: 'Jërëjëf, ba beneen yoon.',
      french: 'Merci, à la prochaine fois.',
      situation: 'Remercier le chauffeur en descendant et prendre congé.',
      pronunciationNote: 'Trois « ë » brefs dans « djë-rë-djëf ». « beneen » : second « e » long (« be-nèèn »), « yoon » : « oo » long.',
      ...audioFor(ID, '04-jerejef-ba-beneen'),
      review: { status: 'draft', note: 'Même question que salutations-11 : « beneen » (voyelle longue) ou « benen ».' },
    },
  ],
};

export default transports;
