import { SOUND_FEATURE_LABELS, type SoundFeatureKind } from '@/lib/wolofOrthography';

/** Style visuel de chaque son repéré automatiquement par le validateur. */
export const markStyle: Record<SoundFeatureKind, { label: string; className: string }> = {
  'long-vowel': {
    label: 'Voyelle longue',
    className: 'bg-sand-200 text-sand-900 ring-1 ring-sand-400 rounded-[3px] px-0.5',
  },
  geminate: {
    label: 'Consonne géminée',
    className: 'bg-terra-200 text-terra-900 ring-1 ring-terra-400 rounded-[3px] px-0.5',
  },
  prenasal: {
    label: 'Prénasale',
    className: 'bg-leaf-200 text-leaf-900 ring-1 ring-leaf-400 rounded-[3px] px-0.5',
  },
  nasal: {
    label: 'Nasale ñ',
    className: 'bg-sky-200 text-sky-900 ring-1 ring-sky-400 rounded-[3px] px-0.5',
  },
  uvular: {
    label: 'Uvulaire q',
    className: 'bg-ink-200 text-ink-900 ring-1 ring-ink-400 rounded-[3px] px-0.5',
  },
  'velar-fricative': {
    label: 'Raclée x',
    className: 'bg-ink-200 text-ink-900 ring-1 ring-ink-400 rounded-[3px] px-0.5',
  },
};

/** Ordre d'affichage des légendes. */
export const MARK_ORDER: SoundFeatureKind[] = ['long-vowel', 'geminate', 'prenasal', 'nasal', 'velar-fricative', 'uvular'];

export { SOUND_FEATURE_LABELS };

export type SessionDuration = 15 | 20 | 30;
