import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// En développement, revalide les leçons et le glossaire à chaque chargement :
// une faute d'orthographe introduite pendant l'édition apparaît dans la console.
if (import.meta.env.DEV) {
  Promise.all([import('@/lib/lessonChecks'), import('@/data/lessons'), import('@/data/soundCards')]).then(
    ([{ checkLessons, checkSoundCards }, { lessonSources }, { soundCards }]) => {
      const findings = [...checkLessons(lessonSources), ...checkSoundCards(soundCards)];
      for (const f of findings) {
        const log = f.severity === 'error' ? console.error : console.warn;
        log(`[wolof] ${f.where} : ${f.message}${f.suggestion ? ` (piste : ${f.suggestion})` : ''}`);
      }
    },
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
