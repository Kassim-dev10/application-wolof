/**
 * Registre des leçons.
 *
 * Chaque fichier `NN-slug.ts` de ce dossier est chargé automatiquement et
 * doit exporter sa leçon par défaut (`export default lesson`). Pour créer un
 * thème : `npm run new:lesson -- 04 transports "Transports"`.
 */
import type { Lesson } from '@/data/lessons/types';

export * from '@/data/lessons/types';

export interface LessonSource {
  /** nom du fichier, ex. « 04-transports.ts » */
  file: string;
  /** null si le fichier n'exporte pas de leçon valide par défaut */
  lesson: Lesson | null;
}

const modules = import.meta.glob<{ default?: unknown }>('./[0-9][0-9]-*.ts', { eager: true });

function isLesson(v: unknown): v is Lesson {
  return !!v && typeof v === 'object' && typeof (v as Lesson).id === 'string' && Array.isArray((v as Lesson).phrases);
}

export const lessonSources: LessonSource[] = Object.entries(modules)
  .map(([path, mod]) => ({ file: path.replace(/^\.\//, ''), lesson: isLesson(mod.default) ? mod.default : null }))
  .sort((a, b) => a.file.localeCompare(b.file));

/** Toutes les leçons, y compris celles en préparation (pour les vérifications). */
export const allLessons: Lesson[] = lessonSources
  .flatMap((s) => (s.lesson ? [s.lesson] : []))
  .sort((a, b) => a.order - b.order);

/** Leçons visibles dans l'app, dans l'ordre de progression. */
export const lessons: Lesson[] = allLessons.filter((l) => l.published);
