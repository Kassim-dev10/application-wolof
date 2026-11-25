import { useState } from 'react';
import { ArrowLeft, Lightbulb, Loader2, Square, Volume2, VolumeX } from 'lucide-react';
import { glossaryAudioUrl, soundCards, SOUND_CATEGORY_LABELS, type SoundCategory } from '@/data/soundCards';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import { useAudioAvailability } from '@/hooks/useAudioAvailability';
import { getAudioAvailability } from '@/lib/audio';
import { markStyle, MARK_ORDER } from '@/lib/highlights';
import { analyzeWolof } from '@/lib/wolofOrthography';
import { lessons } from '@/data/lessons';
import { WaveProgress } from '@/components/WaveProgress';
import { HighlightedPhrase } from '@/components/HighlightedPhrase';

interface Props {
  /** présent quand l'écran est ouvert depuis une session en cours */
  onBack?: () => void;
  backLabel?: string;
}

const CATEGORIES: { key: SoundCategory | 'all'; label: string }[] = [
  { key: 'all', label: 'Tous' },
  { key: 'voyelle', label: 'Voyelles' },
  { key: 'longueur', label: 'Longueur' },
  { key: 'consonne', label: 'Consonnes' },
  { key: 'geminee', label: 'Géminées' },
  { key: 'prenasale', label: 'Prénasales' },
];

const CATEGORY_COLOR: Record<SoundCategory, string> = {
  voyelle: 'bg-sky-100 text-sky-800',
  consonne: 'bg-terra-100 text-terra-800',
  longueur: 'bg-ochre-100 text-ochre-800',
  geminee: 'bg-emerald-100 text-emerald-800',
  prenasale: 'bg-ink-100 text-ink-700',
};

/**
 * Exemple de chaque repère visuel, pris dans les données existantes (exemples du glossaire,
 * puis phrases des leçons) : aucun wolof n'est rédigé ici.
 */
const MARK_EXAMPLES = MARK_ORDER.map((kind) => {
  const pool = [...soundCards.map((c) => c.exampleWolof), ...lessons.flatMap((l) => l.phrases.map((p) => p.wolof))];
  return { kind, example: pool.find((text) => analyzeWolof(text).some((f) => f.kind === kind)) };
}).filter((m): m is { kind: (typeof MARK_ORDER)[number]; example: string } => !!m.example);

export function SoundsScreen({ onBack, backLabel = 'Retour' }: Props) {
  const [filter, setFilter] = useState<SoundCategory | 'all'>('all');
  const player = useAudioPlayer();
  useAudioAvailability(soundCards.map((c) => glossaryAudioUrl(c.id)));

  const cards = filter === 'all' ? soundCards : soundCards.filter((c) => c.category === filter);

  const handlePlay = (id: string) => {
    if (player.activeKey === id) player.stop();
    else player.play(id, glossaryAudioUrl(id));
  };

  return (
    <div className="space-y-5">
      <header className="animate-fadeIn">
        {onBack && (
          <button onClick={onBack} className="btn-soft py-2.5 px-4 text-sm mb-4">
            <ArrowLeft className="w-4 h-4" />
            {backLabel}
          </button>
        )}
        <p className="eyebrow">Prononciation</p>
        <h1 className="font-display text-3xl font-bold text-ink-900 mt-1">Sons &amp; Repères</h1>
        <p className="text-sm text-ink-500 mt-2 leading-relaxed">
          Chaque lettre wolof se prononce toujours de la même façon. Voyelles longues et consonnes doubles font partie du mot : ne les
          raccourcis pas.
        </p>
      </header>

      {/* Légende des surlignages */}
      <section className="card p-5 animate-fadeIn">
        <h2 className="flex items-center gap-2 text-sm font-bold text-ink-800">
          <Lightbulb className="w-4 h-4 text-ochre-500" />
          Repères visuels dans les phrases
        </h2>
        <p className="text-xs text-ink-500 mt-1 mb-4">Pendant les sessions, ces sons sont surlignés automatiquement.</p>
        <ul className="grid sm:grid-cols-2 gap-2.5">
          {MARK_EXAMPLES.map(({ kind, example }) => (
            <li key={kind} className="flex items-center justify-between gap-3 rounded-2xl bg-cream-100 px-3.5 py-2.5">
              <span className={`text-xs font-bold ${markStyle[kind].className}`}>{markStyle[kind].label}</span>
              <span className="font-display text-base text-ink-900 text-right">
                <HighlightedPhrase text={example} />
              </span>
            </li>
          ))}
        </ul>
      </section>

      {/* Filtres */}
      <div className="sticky top-0 z-10 -mx-4 sm:-mx-6 px-4 sm:px-6 py-2 bg-cream/90 backdrop-blur flex gap-2 overflow-x-auto scrollbar-none">
        {CATEGORIES.map((c) => (
          <button
            key={c.key}
            onClick={() => setFilter(c.key)}
            aria-pressed={filter === c.key}
            className={`flex-shrink-0 rounded-full px-4 py-2 text-sm font-bold transition-all tap-highlight-none ${
              filter === c.key ? 'bg-emerald-600 text-white shadow-press' : 'bg-white text-ink-600 ring-1 ring-ink-200 hover:bg-cream-200'
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      <div className="grid gap-3">
        {cards.map((card, i) => {
          const isActive = player.activeKey === card.id;
          const availability = getAudioAvailability(glossaryAudioUrl(card.id));
          return (
            <article key={card.id} className="card p-4 sm:p-5 animate-fadeIn" style={{ animationDelay: `${Math.min(i, 6) * 40}ms` }}>
              <div className="flex items-start gap-4">
                <span className="flex-shrink-0 w-16 h-16 rounded-2xl bg-emerald-50 ring-2 ring-emerald-100 text-emerald-900 flex items-center justify-center px-1.5">
                  <span className={`font-display font-bold leading-none text-center ${card.graphemes.length === 1 ? 'text-3xl' : 'text-lg'}`}>
                    {card.graphemes.length <= 2 ? card.graphemes.join(' ') : card.graphemes.slice(0, 2).join(' ') + '…'}
                  </span>
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-ink-900">{card.name}</h3>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold uppercase tracking-wide ${CATEGORY_COLOR[card.category]}`}>
                      {SOUND_CATEGORY_LABELS[card.category]}
                    </span>
                  </div>
                  <p className="text-sm text-ink-600 mt-1 leading-relaxed">{card.description}</p>
                  {card.graphemes.length > 2 && <p className="text-xs text-ink-400 mt-1.5 font-mono">{card.graphemes.join(' · ')}</p>}
                </div>
              </div>

              <div className="mt-4 flex items-center gap-3 rounded-2xl bg-cream-100 p-3">
                {availability === 'available' ? (
                  <button
                    onClick={() => handlePlay(card.id)}
                    aria-label={isActive ? 'Arrêter l\'exemple' : `Écouter l'exemple : ${card.exampleWolof}`}
                    className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center transition-all tap-highlight-none active:translate-y-[2px] ${
                      isActive ? 'bg-ochre-400 text-ink-900' : 'bg-emerald-600 text-white shadow-press active:shadow-none'
                    }`}
                  >
                    {isActive && player.isLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : isActive ? (
                      <Square className="w-5 h-5" fill="currentColor" />
                    ) : (
                      <Volume2 className="w-5 h-5" />
                    )}
                  </button>
                ) : (
                  <span
                    className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center bg-white border-2 border-dashed border-ink-200 text-ink-300"
                    title={availability === 'checking' ? 'Recherche de l\'audio natif…' : 'Audio natif pas encore enregistré'}
                  >
                    {availability === 'checking' ? <Loader2 className="w-5 h-5 animate-spin" /> : <VolumeX className="w-5 h-5" />}
                  </span>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-display text-xl text-ink-900 leading-snug">
                    <HighlightedPhrase text={card.exampleWolof} />
                  </p>
                  <p className="text-xs text-ink-500">{card.exampleFrench}</p>
                  {availability === 'missing' && <p className="text-[11px] font-semibold text-ochre-700 mt-0.5">Audio natif pas encore enregistré</p>}
                </div>
                {isActive && player.isPlaying && (
                  <div className="w-20 flex-shrink-0">
                    <WaveProgress progress={player.progress} active bars={10} className="h-6" />
                  </div>
                )}
              </div>

              <p className="mt-2.5 flex items-center gap-2 text-xs text-ink-500">
                <Volume2 className="w-3.5 h-3.5 text-ink-400" />
                {card.sound}
              </p>
            </article>
          );
        })}
      </div>
    </div>
  );
}
