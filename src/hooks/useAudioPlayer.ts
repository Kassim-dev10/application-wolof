import { useCallback, useEffect, useRef, useState } from 'react';
import { markAudioMissing } from '@/lib/audio';

export type PlaybackError = 'missing' | 'blocked';

interface PlayerState {
  /** identifiant de ce qui joue (ex. « salutations-01:slow ») */
  activeKey: string | null;
  isLoading: boolean;
  isPlaying: boolean;
  /** 0..1 */
  progress: number;
  /** dernier échec de lecture, et pour quelle clé */
  error: PlaybackError | null;
  errorKey: string | null;
}

const INITIAL: PlayerState = { activeKey: null, isLoading: false, isPlaying: false, progress: 0, error: null, errorKey: null };

export interface PlayOptions {
  playbackRate?: number;
  /** appelé à la fin de la lecture (`true`) ou en cas d'échec (`false`) — jamais après un `stop()` */
  onEnd?: (ok: boolean) => void;
}

/** Lecteur des fichiers audio natifs (public/audio). Un seul son à la fois. */
export function useAudioPlayer() {
  const [state, setState] = useState<PlayerState>(INITIAL);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const generationRef = useRef(0);
  const mountedRef = useRef(true);

  const safeSet = useCallback((update: PlayerState | ((s: PlayerState) => PlayerState)) => {
    if (mountedRef.current) setState(update);
  }, []);

  const release = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    const el = audioRef.current;
    if (el) {
      el.onended = null;
      el.onerror = null;
      el.pause();
      audioRef.current = null;
    }
  }, []);

  const play = useCallback(
    (key: string, url: string, options: PlayOptions = {}) => {
      release();
      const generation = ++generationRef.current;
      const rate = options.playbackRate ?? 1;
      let settled = false;

      const finish = (ok: boolean, error: PlaybackError | null = null) => {
        if (settled || generation !== generationRef.current) return;
        settled = true;
        release();
        safeSet({ ...INITIAL, error, errorKey: error ? key : null });
        options.onEnd?.(ok);
      };

      safeSet({ ...INITIAL, activeKey: key, isLoading: true });

      const el = new Audio();
      audioRef.current = el;
      el.preload = 'auto';
      el.defaultPlaybackRate = rate;
      el.playbackRate = rate;
      // Ralentir sans transformer la voix
      (el as HTMLAudioElement & { preservesPitch?: boolean }).preservesPitch = true;
      el.onended = () => finish(true);
      el.onerror = () => {
        markAudioMissing(url);
        finish(false, 'missing');
      };
      el.src = url;

      el.play()
        .then(() => {
          if (generation !== generationRef.current) return;
          el.playbackRate = rate;
          safeSet((s) => ({ ...s, isLoading: false, isPlaying: true }));
          const tick = () => {
            if (audioRef.current !== el) return;
            const d = el.duration;
            safeSet((s) => ({ ...s, progress: Number.isFinite(d) && d > 0 ? Math.min(el.currentTime / d, 1) : 0 }));
            rafRef.current = requestAnimationFrame(tick);
          };
          rafRef.current = requestAnimationFrame(tick);
        })
        .catch((err: unknown) => {
          const blocked = err instanceof DOMException && err.name === 'NotAllowedError';
          if (!blocked) markAudioMissing(url);
          finish(false, blocked ? 'blocked' : 'missing');
        });
    },
    [release, safeSet],
  );

  const stop = useCallback(() => {
    generationRef.current++;
    release();
    safeSet(INITIAL);
  }, [release, safeSet]);

  useEffect(() => {
    mountedRef.current = true;
    const generation = generationRef;
    return () => {
      mountedRef.current = false;
      generation.current++; // invalide les callbacks de fin en attente
      release();
    };
  }, [release]);

  return { ...state, play, stop };
}
