import { Loader2, Snail, Square, Volume2, VolumeX } from 'lucide-react';
import type { LessonPhrase } from '@/data/lessons';
import { resolveReference } from '@/lib/audio';
import { playReference, refKey } from '@/lib/referencePlayback';
import type { useAudioPlayer } from '@/hooks/useAudioPlayer';
import { WaveProgress } from '@/components/WaveProgress';

type Player = ReturnType<typeof useAudioPlayer>;
type Mode = 'normal' | 'slow';

export function MissingAudioNote({ children }: { children?: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2.5 rounded-2xl bg-ochre-50 ring-1 ring-ochre-200 p-3.5 text-[13px] text-ink-600">
      <VolumeX className="w-4 h-4 flex-shrink-0 mt-0.5 text-ochre-600" />
      <p className="leading-relaxed">
        <span className="font-bold text-ink-800">Audio natif pas encore enregistré.</span>{' '}
        {children ?? 'Appuie-toi sur la note de prononciation plutôt que de deviner le son.'}
      </p>
    </div>
  );
}

interface Props {
  phrase: LessonPhrase;
  player: Player;
  /** met la lecture lente en premier */
  slowFirst?: boolean;
  disabled?: boolean;
  /** appelé quand une lecture démarre réellement */
  onPlay?: (mode: Mode) => void;
  /** version basse (boutons en ligne), pour laisser la place au micro */
  compact?: boolean;
}

/**
 * Deux gros boutons « Écouter » / « Lent », branchés sur les vrais fichiers de public/audio.
 * Un fichier absent est affiché comme tel : aucune voix n'est simulée.
 */
export function ListenButtons({ phrase, player, slowFirst = false, disabled = false, onPlay, compact = false }: Props) {
  const src = resolveReference(phrase);
  const activeMode: Mode | null =
    player.activeKey === refKey(phrase.id, 'normal') ? 'normal' : player.activeKey === refKey(phrase.id, 'slow') ? 'slow' : null;
  const blocked = player.error === 'blocked' && player.errorKey?.startsWith(`${phrase.id}:`);
  const noAudio = !src.checking && !src.normal && !src.slow;

  const toggle = (mode: Mode) => {
    if (activeMode === mode) {
      player.stop();
      return;
    }
    if (playReference(player, phrase, mode)) onPlay?.(mode);
  };

  const button = (mode: Mode) => {
    const available = mode === 'normal' ? !!src.normal : !!src.slow;
    const active = activeMode === mode;
    const label = mode === 'normal' ? 'Écouter' : 'Lent';
    const Icon = src.checking ? Loader2 : !available ? VolumeX : active ? (player.isLoading ? Loader2 : Square) : mode === 'slow' ? Snail : Volume2;
    const spin = src.checking || (active && player.isLoading);

    return (
      <button
        key={mode}
        onClick={() => toggle(mode)}
        disabled={disabled || !available}
        aria-pressed={active}
        aria-label={available ? `${label}${mode === 'slow' ? ' (lecture lente)' : ''}` : `${label} : audio natif manquant`}
        className={`group flex items-center justify-center transition-all ${compact ? 'flex-row gap-2.5 rounded-2xl h-14 px-3' : 'flex-col gap-2 rounded-3xl py-4 px-3'}  duration-150 tap-highlight-none select-none
          disabled:cursor-not-allowed active:translate-y-[3px] active:shadow-none disabled:active:translate-y-0 ${
            !available
              ? 'bg-ink-50 text-ink-300 border-2 border-dashed border-ink-200'
              : active
                ? 'bg-emerald-600 text-white shadow-press'
                : mode === 'normal'
                  ? 'bg-emerald-50 text-emerald-800 ring-2 ring-emerald-200 shadow-[0_4px_0_0_theme(colors.emerald.200)] hover:bg-emerald-100'
                  : 'bg-ochre-50 text-ochre-800 ring-2 ring-ochre-200 shadow-[0_4px_0_0_theme(colors.ochre.200)] hover:bg-ochre-100'
          } ${disabled && available ? 'opacity-50' : ''}`}
      >
        <span
          className={`${compact ? 'w-9 h-9' : 'w-12 h-12'} flex-shrink-0 rounded-full flex items-center justify-center ${
            !available ? 'bg-ink-100' : active ? 'bg-white/20' : mode === 'normal' ? 'bg-emerald-600 text-white' : 'bg-ochre-400 text-ink-900'
          }`}
        >
          <Icon className={`${compact ? 'w-5 h-5' : 'w-6 h-6'} ${spin ? 'animate-spin' : ''}`} fill={active && !player.isLoading ? 'currentColor' : 'none'} />
        </span>
        <span className="text-sm font-bold leading-none">{label}</span>
        {!compact && !src.checking && !available && <span className="text-[10px] font-semibold leading-none">audio manquant</span>}
      </button>
    );
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">{slowFirst ? [button('slow'), button('normal')] : [button('normal'), button('slow')]}</div>
      {activeMode && player.isPlaying && <WaveProgress progress={player.progress} active bars={36} className="h-6" />}
      {noAudio &&
        (compact ? (
          <p className="text-xs font-semibold text-ochre-700 text-center">Audio natif pas encore enregistré : suis la note de prononciation.</p>
        ) : (
          <MissingAudioNote />
        ))}
      {src.slow?.derived && (
        <p className="text-xs text-ink-500 text-center">Version lente pas encore enregistrée : l'audio normal est lu à 75 % de sa vitesse.</p>
      )}
      {!src.normal && src.slow && <p className="text-xs text-ink-500 text-center">Version normale pas encore enregistrée.</p>}
      {blocked && <p className="text-xs font-semibold text-terra-700 text-center">Lecture bloquée par le navigateur : touche à nouveau le bouton.</p>}
    </div>
  );
}
