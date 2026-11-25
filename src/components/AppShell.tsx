import { AudioLines, ChartNoAxesColumn, Route } from 'lucide-react';

export type Tab = 'parcours' | 'sons' | 'progres';

const TABS: { key: Tab; label: string; Icon: typeof Route }[] = [
  { key: 'parcours', label: 'Parcours', Icon: Route },
  { key: 'sons', label: 'Sons & Repères', Icon: AudioLines },
  { key: 'progres', label: 'Progrès', Icon: ChartNoAxesColumn },
];

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-press font-display font-bold text-base tracking-tight">
        JW
      </span>
      {!compact && (
        <span>
          <span className="block font-display text-xl font-bold leading-none tracking-tight text-ink-900">Jàng Wolof</span>
          <span className="hidden min-[400px]:block text-[10px] font-bold uppercase tracking-[0.18em] text-ochre-600 mt-1 whitespace-nowrap">un peu chaque jour</span>
        </span>
      )}
    </div>
  );
}

/** Navigation : barre fixe en bas sur mobile, barre latérale sur grand écran. */
export function AppShell({ tab, onTab, children }: { tab: Tab; onTab: (t: Tab) => void; children: React.ReactNode }) {
  return (
    <div className="min-h-screen lg:pl-72">
      {/* Barre latérale (ordinateur) */}
      <aside className="hidden lg:flex fixed inset-y-0 left-0 w-72 flex-col gap-8 px-6 py-8 bg-white/70 backdrop-blur border-r border-ochre-900/[0.06]">
        <Logo />
        <nav aria-label="Navigation principale" className="flex flex-col gap-1.5">
          {TABS.map(({ key, label, Icon }) => {
            const active = tab === key;
            return (
              <button
                key={key}
                onClick={() => onTab(key)}
                aria-current={active ? 'page' : undefined}
                className={`flex items-center gap-3 rounded-2xl px-4 py-3.5 text-[15px] font-bold transition-colors tap-highlight-none ${
                  active ? 'bg-emerald-50 text-emerald-800 ring-2 ring-emerald-200' : 'text-ink-500 hover:bg-cream-200 hover:text-ink-800'
                }`}
              >
                <Icon className="w-5 h-5" strokeWidth={active ? 2.5 : 2} />
                {label}
              </button>
            );
          })}
        </nav>
        <p className="mt-auto text-xs text-ink-400 leading-relaxed">
          Wolof du Sénégal, orthographe officielle. Les phrases en brouillon attendent encore une relecture native.
        </p>
      </aside>

      <div className="mx-auto w-full max-w-2xl px-4 sm:px-6 pt-5 lg:pt-10 pb-32 lg:pb-12">{children}</div>

      {/* Barre d'onglets (mobile) */}
      <nav
        aria-label="Navigation principale"
        className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-white/95 backdrop-blur border-t border-ochre-900/[0.06] shadow-nav pb-[env(safe-area-inset-bottom)]"
      >
        <div className="mx-auto max-w-2xl grid grid-cols-3">
          {TABS.map(({ key, label, Icon }) => {
            const active = tab === key;
            return (
              <button
                key={key}
                onClick={() => onTab(key)}
                aria-current={active ? 'page' : undefined}
                className={`flex flex-col items-center gap-1 pt-2.5 pb-2 text-[11px] font-bold transition-colors tap-highlight-none ${
                  active ? 'text-emerald-700' : 'text-ink-400 hover:text-ink-700'
                }`}
              >
                <span className={`px-5 py-1 rounded-full transition-colors ${active ? 'bg-emerald-100' : ''}`}>
                  <Icon className="w-[22px] h-[22px]" strokeWidth={active ? 2.5 : 2} />
                </span>
                {label}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
