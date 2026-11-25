import { useState, useRef, useCallback, useEffect } from 'react';

interface RecordingState {
  /** autorisation micro demandée, en attente de réponse */
  isRequesting: boolean;
  isRecording: boolean;
  hasRecording: boolean;
  isPlaying: boolean;
  /** micro indisponible : enregistrement et réécoute simulés (muets) */
  isSimulated: boolean;
  /** 0..1 : temps écoulé (enregistrement) ou position de lecture (réécoute) */
  progress: number;
}

const INITIAL: RecordingState = {
  isRequesting: false,
  isRecording: false,
  hasRecording: false,
  isPlaying: false,
  isSimulated: false,
  progress: 0,
};

/** Durée d'un enregistrement simulé. */
const SIMULATED_MS = 2500;
/** Arrêt automatique d'un enregistrement réel oublié. */
export const MAX_RECORDING_MS = 15000;

function pickMimeType(): string | undefined {
  if (typeof MediaRecorder === 'undefined' || typeof MediaRecorder.isTypeSupported !== 'function') return undefined;
  return ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg;codecs=opus'].find((t) =>
    MediaRecorder.isTypeSupported(t),
  );
}

/**
 * Enregistrement micro (MediaRecorder) et réécoute.
 * Sans micro (refus, appareil absent, navigateur non compatible), le
 * parcours reste utilisable grâce à une simulation chronométrée.
 */
export function useRecorder() {
  const [state, setState] = useState<RecordingState>(INITIAL);

  const mountedRef = useRef(true);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const urlRef = useRef<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const timeoutRef = useRef<number | undefined>(undefined);
  const recordStartRef = useRef(0);
  const recordedMsRef = useRef(0);
  const simulatingRef = useRef(false);
  /** invalide les opérations asynchrones lancées avant un reset */
  const generationRef = useRef(0);

  const safeSet = useCallback((update: (s: RecordingState) => RecordingState) => {
    if (mountedRef.current) setState(update);
  }, []);

  const clearRaf = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  const animate = useCallback(
    (spanMs: number, onDone: () => void) => {
      clearRaf();
      const start = performance.now();
      const tick = () => {
        const p = Math.min((performance.now() - start) / spanMs, 1);
        safeSet((s) => ({ ...s, progress: p }));
        if (p < 1) rafRef.current = requestAnimationFrame(tick);
        else {
          rafRef.current = null;
          onDone();
        }
      };
      rafRef.current = requestAnimationFrame(tick);
    },
    [clearRaf, safeSet],
  );

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const stopAudio = useCallback(() => {
    const el = audioRef.current;
    if (el) {
      el.onended = null;
      el.onerror = null;
      el.pause();
      audioRef.current = null;
    }
  }, []);

  const revokeUrl = useCallback(() => {
    if (urlRef.current) {
      URL.revokeObjectURL(urlRef.current);
      urlRef.current = null;
    }
  }, []);

  /** Arrête tout sans déclencher les callbacks de fin. */
  const teardown = useCallback(() => {
    generationRef.current++;
    clearRaf();
    window.clearTimeout(timeoutRef.current);
    const rec = recorderRef.current;
    if (rec) {
      rec.ondataavailable = null;
      rec.onstop = null;
      if (rec.state !== 'inactive') rec.stop();
      recorderRef.current = null;
    }
    stopStream();
    stopAudio();
    revokeUrl();
    simulatingRef.current = false;
  }, [clearRaf, revokeUrl, stopAudio, stopStream]);

  const finishSimulated = useCallback(() => {
    simulatingRef.current = false;
    recordedMsRef.current = SIMULATED_MS;
    safeSet((s) => ({ ...s, isRecording: false, hasRecording: true, progress: 0 }));
  }, [safeSet]);

  const startRecording = useCallback(async () => {
    teardown();
    const generation = generationRef.current;
    chunksRef.current = [];
    safeSet(() => ({ ...INITIAL, isRequesting: true }));

    let stream: MediaStream;
    try {
      if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
        throw new Error('Enregistrement non pris en charge');
      }
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      if (generation !== generationRef.current) return;
      simulatingRef.current = true;
      safeSet(() => ({ ...INITIAL, isRecording: true, isSimulated: true }));
      animate(SIMULATED_MS, finishSimulated);
      return;
    }

    // Annulé (reset, démontage) pendant la demande d'autorisation
    if (generation !== generationRef.current || !mountedRef.current) {
      stream.getTracks().forEach((t) => t.stop());
      return;
    }

    streamRef.current = stream;
    const mimeType = pickMimeType();
    let recorder: MediaRecorder;
    try {
      recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
    } catch {
      stopStream();
      simulatingRef.current = true;
      safeSet(() => ({ ...INITIAL, isRecording: true, isSimulated: true }));
      animate(SIMULATED_MS, finishSimulated);
      return;
    }
    recorderRef.current = recorder;

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };
    recorder.onstop = () => {
      window.clearTimeout(timeoutRef.current);
      clearRaf();
      stopStream();
      recordedMsRef.current = performance.now() - recordStartRef.current;
      const blob = new Blob(chunksRef.current, { type: recorder.mimeType || mimeType || 'audio/webm' });
      revokeUrl();
      urlRef.current = blob.size > 0 ? URL.createObjectURL(blob) : null;
      recorderRef.current = null;
      safeSet((s) => ({ ...s, isRecording: false, hasRecording: true, progress: 0, isSimulated: urlRef.current === null }));
    };

    recorder.start();
    recordStartRef.current = performance.now();
    timeoutRef.current = window.setTimeout(() => {
      if (recorder.state !== 'inactive') recorder.stop();
    }, MAX_RECORDING_MS);
    safeSet(() => ({ ...INITIAL, isRecording: true }));
    animate(MAX_RECORDING_MS, () => {});
  }, [animate, clearRaf, finishSimulated, revokeUrl, safeSet, stopStream, teardown]);

  const stopRecording = useCallback(() => {
    const recorder = recorderRef.current;
    if (recorder && recorder.state !== 'inactive') {
      recorder.stop();
    } else if (simulatingRef.current) {
      clearRaf();
      finishSimulated();
    }
  }, [clearRaf, finishSimulated]);

  /** Réécoute la dernière prise ; `onEnd` est appelé à la fin de la lecture. */
  const playRecording = useCallback(
    (onEnd?: () => void) => {
      clearRaf();
      stopAudio();
      const generation = generationRef.current;
      let finished = false;
      const done = () => {
        if (finished || generation !== generationRef.current) return;
        finished = true;
        clearRaf();
        audioRef.current = null;
        safeSet((s) => ({ ...s, isPlaying: false, progress: 0 }));
        onEnd?.();
      };

      safeSet((s) => ({ ...s, isPlaying: true, progress: 0 }));
      const url = urlRef.current;
      const spanMs = recordedMsRef.current || SIMULATED_MS;

      if (!url) {
        animate(spanMs, done);
        return;
      }

      const el = new Audio(url);
      audioRef.current = el;
      el.onended = done;
      el.onerror = done;
      el.play().catch(done);
      // La durée des fichiers webm produits par MediaRecorder est souvent inconnue (Infinity) :
      // on se rabat alors sur la durée mesurée pendant l'enregistrement.
      const start = performance.now();
      const tick = () => {
        if (audioRef.current !== el) return;
        const total = Number.isFinite(el.duration) && el.duration > 0 ? el.duration * 1000 : spanMs;
        const elapsed = el.currentTime > 0 ? el.currentTime * 1000 : performance.now() - start;
        safeSet((s) => ({ ...s, progress: Math.min(elapsed / total, 1) }));
        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
    },
    [animate, clearRaf, safeSet, stopAudio],
  );

  const stopPlayback = useCallback(() => {
    generationRef.current++;
    clearRaf();
    stopAudio();
    safeSet((s) => ({ ...s, isPlaying: false, progress: 0 }));
  }, [clearRaf, safeSet, stopAudio]);

  const reset = useCallback(() => {
    teardown();
    safeSet(() => INITIAL);
  }, [safeSet, teardown]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      teardown();
    };
  }, [teardown]);

  return { ...state, startRecording, stopRecording, playRecording, stopPlayback, reset };
}
