/**
 * Disponibilité des fichiers audio natifs servis depuis `public/audio/`.
 *
 * Un fichier est « disponible » seulement si le serveur répond avec un type
 * audio : en développement comme sur la plupart des hébergeurs, une URL
 * inconnue renvoie la page HTML de l'app (code 200), qu'il ne faut surtout
 * pas prendre pour un enregistrement.
 *
 * Aucune prononciation n'est jamais simulée : sans fichier, l'interface le
 * dit et renvoie vers la note de prononciation.
 */
import type { LessonPhrase } from '@/data/lessons';

export type AudioAvailability = 'checking' | 'available' | 'missing';

/** Vitesse utilisée quand seule la version normale existe. */
export const DERIVED_SLOW_RATE = 0.75;

const cache = new Map<string, AudioAvailability>();
const pending = new Map<string, Promise<AudioAvailability>>();
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((fn) => fn());
}

export function subscribeAudioAvailability(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function getAudioAvailability(url: string): AudioAvailability {
  return cache.get(url) ?? 'checking';
}

async function probe(url: string): Promise<boolean> {
  const isAudio = (r: Response) => r.ok && (r.headers.get('content-type') ?? '').toLowerCase().startsWith('audio/');
  try {
    const head = await fetch(url, { method: 'HEAD', cache: 'no-cache' });
    if (head.status !== 405 && head.status !== 501) return isAudio(head);
    // Serveur sans HEAD : on ne demande que le premier octet
    const get = await fetch(url, { headers: { Range: 'bytes=0-0' }, cache: 'no-cache' });
    return isAudio(get);
  } catch {
    return false;
  }
}

/** Vérifie (une seule fois par URL) qu'un fichier audio existe. */
export function checkAudio(url: string): Promise<AudioAvailability> {
  const known = cache.get(url);
  if (known && known !== 'checking') return Promise.resolve(known);
  let p = pending.get(url);
  if (!p) {
    p = probe(url).then((ok) => {
      const result: AudioAvailability = ok ? 'available' : 'missing';
      cache.set(url, result);
      pending.delete(url);
      notify();
      return result;
    });
    pending.set(url, p);
  }
  return p;
}

/** Signalé par le lecteur quand un fichier annoncé disponible ne se lit pas. */
export function markAudioMissing(url: string) {
  if (cache.get(url) !== 'missing') {
    cache.set(url, 'missing');
    notify();
  }
}

export interface ReferenceSources {
  /** au moins une des deux URL est encore en cours de vérification */
  checking: boolean;
  normal: string | null;
  slow: { url: string; playbackRate: number; /** version lente absente : audio normal ralenti */ derived: boolean } | null;
}

/** Sources audio réellement utilisables pour une phrase. */
export function resolveReference(phrase: Pick<LessonPhrase, 'audioUrl' | 'slowAudioUrl'>): ReferenceSources {
  const n = getAudioAvailability(phrase.audioUrl);
  const s = getAudioAvailability(phrase.slowAudioUrl);
  const normal = n === 'available' ? phrase.audioUrl : null;
  let slow: ReferenceSources['slow'] = null;
  if (s === 'available') slow = { url: phrase.slowAudioUrl, playbackRate: 1, derived: false };
  else if (s === 'missing' && normal) slow = { url: normal, playbackRate: DERIVED_SLOW_RATE, derived: true };
  return { checking: n === 'checking' || s === 'checking', normal, slow };
}
