import { useState } from 'react';
import { ArrowLeft, BookOpen, Loader2, Play, Square, Volume2, VolumeX } from 'lucide-react';
import { glossaryAudioUrl, soundCards, SOUND_CATEGORY_LABELS, type SoundCategory } from '@/data/soundCards';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import { useAudioAvailability } from '@/hooks/useAudioAvailability';
import { getAudioAvailability } from '@/lib/audio';
import { WaveProgress } from '@/components/WaveProgress';
import { HighlightedPhrase } from '@/components/HighlightedPhrase';

interface Props {
  onBack: () => void;
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
  voyelle: 'bg-sky-100 text-sky-700',
  consonne: 'bg-terra-100 text-terra-700',
  longueur: 'bg-sand-200 text-sand-800',
  geminee: 'bg-leaf-100 text-leaf-700',
  prenasale: 'bg-ink-100 text-ink-700',
};

export function GlossaryScreen({ onBack, backLabel = 'Retour' }: Props) {
  const [filter, setFilter] = useState<SoundCategory | 'all'>('all');
  const player = useAudioPlayer();
  useAudioAvailability(soundCards.map((c) => glossaryAudioUrl(c.id)));

  const cards = filter === 'all' ? soundCards : soundCards.filter((c) => c.category === filter);

  const handlePlay = (id: string) => {
    if (player.activeKey === id) player.stop();
    else player.play(id, glossaryAudioUrl(id));
  };

  return (
    <div className="min-h-screen bg-ink-50 flex flex-col">
      <header className="sticky top-0 z-20 bg-ink-50/90 backdrop-blur-md border-b border-ink-100">
        <div className="px-4 pt-4 pb-3 flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-ink-600 hover:text-ink-900 transition-colors tap-highlight-none"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm">{backLabel}</span>
          </button>
          <h1 className="font-display text-lg text-ink-900 ml-2">Glossaire &amp; sons clés</h1>
        </div>

        {/* Category filter */}
        <div className="px-4 pb-3 flex gap-2 overflow-x-auto scrollbar-none">
          {CATEGORIES.map((c) => (
            <button
              key={c.key}
              onClick={() => setFilter(c.key)}
              className={`flex-shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium transition-all tap-highlight-none ${
                filter === c.key
                  ? 'bg-ink-900 text-ink-50'
                  : 'bg-ink-100 text-ink-600 hover:bg-ink-200'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </header>

      <main className="flex-1 px-4 py-5 pb-8 space-y-3">
        <div className="flex items-start gap-3 bg-white rounded-2xl p-4 mb-2">
          <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-sand-100 flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-sand-700" />
          </div>
          <div>
            <h3 className="font-semibold text-ink-900 text-[15px]">Les sons du wolof</h3>
            <p className="text-sm text-ink-500 mt-0.5 leading-relaxed">
              Chaque lettre wolof se prononce toujours de la même façon. Les voyelles longues et les consonnes doubles font partie du mot : ne les raccourcis pas.
            </p>
          </div>
        </div>

        {cards.map((card, i) => {
          const isActive = player.activeKey === card.id;
          const availability = getAudioAvailability(glossaryAudioUrl(card.id));
          return (
            <article
              key={card.id}
              className="bg-white rounded-3xl shadow-soft p-5 animate-fadeIn"
              style={{ animationDelay: `${Math.min(i, 6) * 40}ms` }}
            >
              <div className="flex items-start gap-4">
                {/* Grapheme badge */}
                <div className="flex-shrink-0 w-16 h-16 rounded-2xl bg-ink-900 text-ink-50 flex items-center justify-center px-1.5">
                  <span
                    className={`font-display leading-none text-center ${
                      card.graphemes.length === 1 ? 'text-2xl' : 'text-base'
                    }`}
                  >
                    {card.graphemes.length <= 2 ? card.graphemes.join(' ') : card.graphemes.slice(0, 2).join(' ') + '…'}
                  </span>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-semibold text-ink-900">{card.name}</h4>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium uppercase tracking-wide ${CATEGORY_COLOR[card.category]}`}>
                      {SOUND_CATEGORY_LABELS[card.category]}
                    </span>
                  </div>
                  <p className="text-sm text-ink-600 mt-1 leading-relaxed">{card.description}</p>
                  {card.graphemes.length > 2 && (
                    <p className="text-xs text-ink-400 mt-1.5 font-mono">{card.graphemes.join(' · ')}</p>
                  )}
                </div>
              </div>

              {/* Example */}
              <div className="mt-4 flex items-center gap-3 bg-ink-50 rounded-2xl p-3">
                {availability === 'available' ? (
                  <button
                    onClick={() => handlePlay(card.id)}
                    aria-label={isActive ? 'Arrêter l\'exemple' : 'Écouter l\'exemple'}
                    className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all tap-highlight-none ${
                      isActive ? 'bg-terra-600 text-white' : 'bg-white text-ink-800 shadow-soft hover:shadow-lift'
                    }`}
                  >
                    {isActive && player.isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : isActive ? (
                      <Square className="w-4 h-4" fill="currentColor" />
                    ) : (
                      <Play className="w-4 h-4" />
                    )}
                  </button>
                ) : (
                  <span
                    className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center bg-ink-100 text-ink-300"
                    title={availability === 'checking' ? 'Recherche de l\'audio natif…' : 'Audio natif pas encore enregistré'}
                  >
                    {availability === 'checking' ? <Loader2 className="w-4 h-4 animate-spin" /> : <VolumeX className="w-4 h-4" />}
                  </span>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-display text-lg text-ink-900 leading-snug">
                    <HighlightedPhrase text={card.exampleWolof} />
                  </p>
                  <p className="text-xs text-ink-500">{card.exampleFrench}</p>
                  {availability === 'missing' && <p className="text-[11px] text-ink-400 mt-0.5">Audio natif pas encore enregistré</p>}
                </div>
                {isActive && player.isPlaying && (
                  <div className="flex-1 max-w-[80px]">
                    <WaveProgress progress={player.progress} active bars={10} className="h-6" />
                  </div>
                )}
              </div>

              <div className="mt-2.5 flex items-center gap-2 text-xs text-ink-400">
                <Volume2 className="w-3.5 h-3.5" />
                <span>{card.sound}</span>
              </div>
            </article>
          );
        })}
      </main>
    </div>
  );
}
