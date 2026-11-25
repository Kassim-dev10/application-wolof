import { Gauge, Loader2, Play, Square, VolumeX } from 'lucide-react';
import type { LessonPhrase } from '@/data/lessons';
import { resolveReference, type ReferenceSources } from '@/lib/audio';
import { playReference, refKey } from '@/lib/referencePlayback';
import type { useAudioPlayer } from '@/hooks/useAudioPlayer';
import { WaveProgress } from '@/components/WaveProgress';

type Player = ReturnType<typeof useAudioPlayer>;

export function MissingAudioNote({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-start gap-2 rounded-xl bg-ink-50 ring-1 ring-ink-100 p-3 text-xs text-ink-500">
      <VolumeX className="w-4 h-4 flex-shrink-0 mt-0.5 text-ink-400" />
      <p className="leading-relaxed">
        <span className="font-medium text-ink-700">Audio natif pas encore enregistré.</span>
        {compact ? '' : ' Appuie-toi sur la note de prononciation plutôt que de deviner le son.'}
      </p>
    </div>
  );
}

interface Props {
  phrase: LessonPhrase;
  player: Player;
  /** met la lecture lente en premier et en valeur */
  slowFirst?: boolean;
  disabled?: boolean;
  /** appelé quand une lecture démarre réellement */
  onPlay?: (mode: 'normal' | 'slow') => void;
}

/** Boutons « Lecture normale » / « Lecture lente » branchés sur les vrais fichiers. */
export function ReferenceAudio({ phrase, player, slowFirst = false, disabled = false, onPlay }: Props) {
  const src: ReferenceSources = resolveReference(phrase);
  const activeMode =
    player.activeKey === refKey(phrase.id, 'normal') ? 'normal' : player.activeKey === refKey(phrase.id, 'slow') ? 'slow' : null;
  const blocked = player.error === 'blocked' && player.errorKey?.startsWith(`${phrase.id}:`);

  if (src.checking) {
    return (
      <div className="flex items-center gap-2 text-xs text-ink-400 py-2">
        <Loader2 className="w-4 h-4 animate-spin" /> Recherche de l'audio natif…
      </div>
    );
  }

  if (!src.normal && !src.slow) return <MissingAudioNote />;

  const toggle = (mode: 'normal' | 'slow') => {
    if (activeMode === mode) {
      player.stop();
      return;
    }
    if (playReference(player, phrase, mode)) onPlay?.(mode);
  };

  const button = (mode: 'normal' | 'slow') => {
    const available = mode === 'normal' ? !!src.normal : !!src.slow;
    if (!available) return null;
    const active = activeMode === mode;
    const primary = slowFirst ? mode === 'slow' : mode === 'normal';
    const Icon = active ? (player.isLoading ? Loader2 : Square) : mode === 'slow' ? Gauge : Play;
    return (
      <button
        key={mode}
        onClick={() => toggle(mode)}
        disabled={disabled}
        className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all tap-highlight-none disabled:opacity-50 disabled:cursor-not-allowed ${
          active ? 'bg-terra-600 text-white' : primary ? 'bg-ink-900 text-ink-50 hover:bg-ink-800' : 'bg-ink-100 text-ink-700 hover:bg-ink-200'
        }`}
      >
        <Icon className={`w-4 h-4 ${active && player.isLoading ? 'animate-spin' : ''}`} fill={active && !player.isLoading ? 'currentColor' : 'none'} />
        {mode === 'normal' ? 'Lecture normale' : 'Lecture lente'}
      </button>
    );
  };

  return (
    <div className="space-y-2.5">
      {activeMode && player.isPlaying && <WaveProgress progress={player.progress} active bars={32} />}
      <div className="flex flex-wrap items-center gap-2.5">{slowFirst ? [button('slow'), button('normal')] : [button('normal'), button('slow')]}</div>
      {src.slow?.derived && (
        <p className="text-[11px] text-ink-400">Version lente pas encore enregistrée : l'audio normal est lu à 75 % de sa vitesse.</p>
      )}
      {!src.normal && src.slow && <p className="text-[11px] text-ink-400">Version normale pas encore enregistrée.</p>}
      {blocked && <p className="text-[11px] text-terra-700">Lecture bloquée par le navigateur : touche à nouveau le bouton.</p>}
    </div>
  );
}
