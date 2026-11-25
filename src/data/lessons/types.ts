/**
 * Modèle des leçons de wolof sénégalais.
 *
 * Audio : chaque phrase a un emplacement pour la version normale et la
 * version lente, servies depuis `public/` :
 *   public/audio/<lessonId>/<phraseId>.mp3
 *   public/audio/<lessonId>/<phraseId>-slow.mp3
 * Tant que les fichiers n'existent pas, l'app garde la lecture simulée.
 */

export type ReviewStatus =
  /** rédigée, pas encore relue par un locuteur natif */
  | 'draft'
  /** relue et validée par un locuteur natif */
  | 'reviewed';

export interface OrthographyException {
  /** mot exempté des contrôles de structure (emprunt, nom propre) */
  word: string;
  /** pourquoi ce mot est accepté tel quel */
  reason: string;
}

export interface LessonPhrase {
  /** identifiant unique, aussi utilisé pour le nom des fichiers audio */
  id: string;
  /** phrase en orthographe officielle du wolof */
  wolof: string;
  /** traduction française naturelle */
  french: string;
  /** traduction mot à mot, quand elle éclaire la structure */
  literal?: string;
  /** quand et à qui on dit cette phrase */
  situation: string;
  /** conseil de prononciation concret (sons, longueurs, rythme) */
  pronunciationNote: string;
  audioUrl: string;
  slowAudioUrl: string;
  orthographyExceptions?: OrthographyException[];
  /**
   * Doublon voulu : identifiant d'une phrase existante au texte wolof
   * identique (ex. « marche-01 »). Le contrôle accepte alors la répétition ;
   * tout doublon non déclaré reste signalé. La progression reste propre à
   * chaque identifiant.
   */
  duplicateOf?: string;
  review: {
    status: ReviewStatus;
    /** point précis à faire confirmer par le relecteur */
    note?: string;
  };
}

/**
 * Exercice d'assemblage oral : remettre dans l'ordre naturel des phrases de
 * la leçon. Les étapes référencent des identifiants de phrases, pour que tout
 * le wolof affiché passe par le validateur.
 */
export interface AssemblyTask {
  situation: string;
  situationDetail: string;
  prompt: string;
  /** identifiants de phrases de la leçon, dans l'ordre attendu */
  steps: string[];
}

export interface Lesson {
  /**
   * Identifiant « NN-slug » (ex. « 04-transports ») : nom du fichier
   * (src/data/lessons/NN-slug.ts) et du dossier audio. Ne pas le renommer.
   */
  id: string;
  /** ordre de progression : égal au numéro NN de l'identifiant, unique */
  order: number;
  /**
   * Préfixe des identifiants de phrases (« transports » → « transports-01 »),
   * unique entre les leçons. Ne pas le changer une fois des phrases publiées.
   */
  phrasePrefix: string;
  /**
   * false : thème en préparation, absent de l'app mais déjà vérifié
   * (orthographe, identifiants). Passer à true quand il compte au moins
   * 6 phrases (de quoi remplir une session de 30 min).
   */
  published: boolean;
  title: string;
  summary: string;
  phrases: LessonPhrase[];
  assembly?: AssemblyTask;
}

export const AUDIO_BASE = '/audio';

/** Chemins audio attendus pour une phrase. */
export function audioFor(lessonId: string, phraseId: string): Pick<LessonPhrase, 'audioUrl' | 'slowAudioUrl'> {
  return {
    audioUrl: `${AUDIO_BASE}/${lessonId}/${phraseId}.mp3`,
    slowAudioUrl: `${AUDIO_BASE}/${lessonId}/${phraseId}-slow.mp3`,
  };
}

/** Statut par défaut : tout ce qui n'a pas été relu par un locuteur reste en brouillon. */
export const DRAFT = { status: 'draft' } as const;
