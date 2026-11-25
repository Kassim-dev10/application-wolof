interface Props {
  progress: number; // 0..1
  active?: boolean;
  bars?: number;
  className?: string;
}

/**
 * A minimal waveform-style progress indicator. When active, bars animate
 * subtly; otherwise they render as a static progress fill.
 */
export function WaveProgress({ progress, active = false, bars = 28, className = '' }: Props) {
  const filled = Math.round(progress * bars);
  return (
    <div className={`flex items-center gap-[3px] h-8 ${className}`}>
      {Array.from({ length: bars }).map((_, i) => {
        const isFilled = i < filled;
        const h = 30 + ((i * 37) % 70);
        return (
          <div
            key={i}
            className={`flex-1 rounded-full transition-colors duration-150 ${
              isFilled ? 'bg-terra-500' : 'bg-ink-200'
            } ${active ? 'animate-wave' : ''}`}
            style={{ height: `${h}%`, animationDelay: `${i * 60}ms` }}
          />
        );
      })}
    </div>
  );
}
