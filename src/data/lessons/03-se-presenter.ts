import { audioFor, DRAFT, type Lesson } from '@/data/lessons/types';

const ID = '03-se-presenter';

const sePresenter: Lesson = {
  id: ID,
  order: 3,
  phrasePrefix: 'presenter',
  published: true,
  title: 'Se présenter',
  summary: 'Dire son nom et où l\'on habite, parler de son niveau et demander qu\'on parle lentement.',
  assembly: {
    situation: 'Un nouveau collègue te pose quelques questions',
    situationDetail: 'Il te demande ton nom, où tu habites et si tu comprends le wolof. Il parle vite : réponds, puis demande-lui de ralentir.',
    prompt: 'Remets tes réponses dans l\'ordre de ses questions.',
    steps: ['presenter-02', 'presenter-04', 'presenter-06', 'presenter-07'],
  },
  phrases: [
    {
      id: 'presenter-01',
      wolof: 'Naka nga tudd ?',
      french: 'Comment t\'appelles-tu ?',
      situation: 'Demander le prénom de quelqu\'un après les salutations.',
      pronunciationNote:
        '« tudd » : « tou » puis un « d » double qu\'on tient un instant avant de le relâcher. « nga » : « n » et « g » d\'un seul geste.',
      ...audioFor(ID, 'presenter-01'),
      review: DRAFT,
    },
    {
      id: 'presenter-02',
      wolof: 'Maa ngi tudd Awa.',
      french: 'Je m\'appelle Awa.',
      situation: 'Se présenter. Remplace « Awa » par ton prénom.',
      pronunciationNote:
        '« Maa » est long et « tudd » finit sur un « d » tenu : marque une petite pause avant le prénom.',
      ...audioFor(ID, 'presenter-02'),
      review: DRAFT,
    },
    {
      id: 'presenter-03',
      wolof: 'Fan nga dëkk ?',
      french: 'Où habites-tu ?',
      situation: 'Demander le quartier ou la ville où vit quelqu\'un.',
      pronunciationNote:
        '« dëkk » : « ë » central et bref, puis un « k » double tenu. Ne prononce pas « dèk ».',
      ...audioFor(ID, 'presenter-03'),
      review: DRAFT,
    },
    {
      id: 'presenter-04',
      wolof: 'Dakar laa dëkk.',
      french: 'J\'habite à Dakar.',
      literal: 'C\'est à Dakar que j\'habite.',
      situation: 'Répondre à « Fan nga dëkk ? ». Le lieu se place en tête de phrase.',
      pronunciationNote:
        '« laa » est long : c\'est lui qui met le lieu en valeur. Accentue légèrement « Dakar ».',
      ...audioFor(ID, 'presenter-04'),
      review: DRAFT,
    },
    {
      id: 'presenter-05',
      wolof: 'Dégg nga wolof ?',
      french: 'Tu comprends le wolof ?',
      situation: 'Question que l\'on te posera souvent, ou que tu peux poser pour vérifier qu\'on se comprend.',
      pronunciationNote:
        '« dégg » : « é » fermé et bref comme dans « été », suivi d\'un « g » double tenu. À ne pas confondre avec le « ë » central.',
      ...audioFor(ID, 'presenter-05'),
      review: DRAFT,
    },
    {
      id: 'presenter-06',
      wolof: 'Tuuti rekk.',
      french: 'Un peu seulement.',
      situation: 'Répondre honnêtement sur ton niveau de wolof.',
      pronunciationNote:
        '« tuuti » : « uu » long (« touu-ti »). « rekk » : « k » double tenu. Le rythme est long-bref, puis bref-tenu.',
      ...audioFor(ID, 'presenter-06'),
      review: DRAFT,
    },
    {
      id: 'presenter-07',
      wolof: 'Ndax mën nga wax ndànk ?',
      french: 'Peux-tu parler lentement ?',
      situation: 'Demander à quelqu\'un de ralentir quand il parle trop vite pour toi.',
      pronunciationNote:
        '« nd » en début de mot : « n » et « d » d\'un seul geste, sans voyelle devant. « wax » : « x » raclé au fond de la gorge. « ndànk » : « à » bref devant « nk ».',
      ...audioFor(ID, 'presenter-07'),
      review: DRAFT,
    },
    {
      id: 'presenter-08',
      wolof: 'Waaw.',
      french: 'Oui.',
      situation: 'Répondre par l\'affirmative.',
      pronunciationNote: 'Un seul « aa » long encadré par deux « w » : « waaou », sans couper le son.',
      ...audioFor(ID, 'presenter-08'),
      review: DRAFT,
    },
    {
      id: 'presenter-09',
      wolof: 'Déedéet.',
      french: 'Non.',
      situation: 'Répondre par la négative.',
      pronunciationNote:
        'Deux « é » fermés et longs, écrits « ée » : « déé-déét ». Garde la bouche peu ouverte, comme dans « été ».',
      ...audioFor(ID, 'presenter-09'),
      review: DRAFT,
    },
  ],
};

export default sePresenter;
