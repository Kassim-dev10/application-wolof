import { useMemo, useState } from 'react';
import { HomeScreen } from '@/components/HomeScreen';
import { SessionScreen } from '@/components/SessionScreen';
import { GlossaryScreen } from '@/components/GlossaryScreen';
import { lessons } from '@/data/lessons';
import { useProgress } from '@/hooks/useProgress';
import { dateKey, lessonStats, summarize } from '@/lib/progress';
import { buildSessionPlan, type SessionPlan } from '@/lib/sessionPlan';

type View = 'home' | 'session' | 'glossary';

function App() {
  const { progress, storageOk, setPreferredDuration, setLastLesson, recordResult, completeSession, resetProgress } =
    useProgress();
  const [view, setView] = useState<View>('home');
  const [plan, setPlan] = useState<SessionPlan | null>(null);

  // Leçon proposée : la dernière choisie, sinon la première qui a encore des phrases nouvelles
  const [lessonId, setLessonId] = useState(() => {
    if (progress.lastLessonId && lessons.some((l) => l.id === progress.lastLessonId)) return progress.lastLessonId;
    return (lessons.find((l) => l.phrases.some((p) => !progress.phrases[p.id])) ?? lessons[0]).id;
  });
  const lesson = lessons.find((l) => l.id === lessonId) ?? lessons[0];
  const duration = progress.preferredDuration;

  const today = dateKey();
  const summary = useMemo(() => summarize(progress, today), [progress, today]);
  const stats = useMemo(() => Object.fromEntries(lessons.map((l) => [l.id, lessonStats(l, progress)])), [progress]);
  // Aperçu de ce que contiendra la session si on la lance maintenant
  const preview = useMemo(() => buildSessionPlan(lesson, lessons, duration, progress, today), [lesson, duration, progress, today]);

  const selectLesson = (id: string) => {
    setLessonId(id);
    setLastLesson(id);
  };

  const startSession = () => {
    // Le plan est figé au lancement : les évaluations pendant la session ne le recomposent pas
    setPlan(buildSessionPlan(lesson, lessons, duration, progress, dateKey()));
    setLastLesson(lesson.id);
    setView('session');
    window.scrollTo(0, 0);
  };

  const openGlossary = () => {
    setView('glossary');
    window.scrollTo(0, 0);
  };

  const exitSession = () => {
    setPlan(null);
    setView('home');
    window.scrollTo(0, 0);
  };

  return (
    <>
      {/* La session reste montée pendant la consultation du glossaire, pour ne pas perdre la progression. */}
      {plan && (
        <div hidden={view !== 'session'}>
          <SessionScreen
            key={plan.id}
            plan={plan}
            progress={progress}
            onResult={recordResult}
            onComplete={completeSession}
            onExit={exitSession}
            onOpenGlossary={openGlossary}
          />
        </div>
      )}

      {view === 'glossary' && (
        <GlossaryScreen backLabel={plan ? 'Session' : 'Accueil'} onBack={() => setView(plan ? 'session' : 'home')} />
      )}

      {view === 'home' && (
        <HomeScreen
          lessons={lessons}
          selectedLessonId={lesson.id}
          onSelectLesson={selectLesson}
          lessonStats={stats}
          duration={duration}
          onDurationChange={setPreferredDuration}
          preview={preview}
          summary={summary}
          storageOk={storageOk}
          onResetProgress={resetProgress}
          onStart={startSession}
          onOpenGlossary={openGlossary}
        />
      )}
    </>
  );
}

export default App;
