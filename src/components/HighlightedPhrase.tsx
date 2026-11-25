import { useMemo, type ReactNode } from 'react';
import { markStyle } from '@/lib/highlights';
import { analyzeWolof } from '@/lib/wolofOrthography';

interface Props {
  text: string;
  className?: string;
}

/**
 * Affiche une phrase wolof en surlignant les sons repérés automatiquement
 * par le validateur (voyelles longues, géminées, prénasales, ñ, x, q).
 */
export function HighlightedPhrase({ text, className = '' }: Props) {
  const nodes = useMemo(() => {
    const normalized = text.normalize('NFC');
    const features = analyzeWolof(normalized);
    const out: ReactNode[] = [];
    let cursor = 0;
    features.forEach((f, i) => {
      if (f.start < cursor) return; // sécurité : jamais de chevauchement
      if (f.start > cursor) out.push(<span key={`t-${i}`}>{normalized.slice(cursor, f.start)}</span>);
      out.push(
        <mark key={`m-${i}`} className={markStyle[f.kind].className} title={markStyle[f.kind].label}>
          {normalized.slice(f.start, f.end)}
        </mark>,
      );
      cursor = f.end;
    });
    if (cursor < normalized.length) out.push(<span key="t-end">{normalized.slice(cursor)}</span>);
    return out;
  }, [text]);

  return <span className={className}>{nodes}</span>;
}
