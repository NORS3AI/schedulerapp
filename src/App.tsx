import { useEffect } from 'react';
import { useSchedulerStore } from './store/useSchedulerStore';
import { Header } from './components/Layout/Header';
import { SplitPane } from './components/Layout/SplitPane';
import { WelcomeModal } from './components/Setup/WelcomeModal';
import { SessionList } from './components/SessionList/SessionList';
import { SessionDetailPopup } from './components/SessionList/SessionDetailPopup';
import { SchedulerGrid } from './components/Scheduler/SchedulerGrid';
import { DndContext, DragEndEvent, DragStartEvent, DragOverlay } from '@dnd-kit/core';
import { SessionCard } from './components/SessionList/SessionCard';

function App() {
  const {
    setupComplete,
    settings,
    sessions,
    draggedSessionId,
    setDraggedSessionId,
    updateSession,
    selectedSessionId,
  } = useSchedulerStore();

  // Apply theme
  useEffect(() => {
    const root = document.documentElement;
    const theme = settings.theme;

    if (theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    // Apply font size
    root.classList.remove(
      'font-size-smallest',
      'font-size-smaller',
      'font-size-small',
      'font-size-medium',
      'font-size-large',
      'font-size-larger',
      'font-size-huge'
    );
    root.classList.add(`font-size-${settings.fontSize}`);
  }, [settings.theme, settings.fontSize]);

  const handleDragStart = (event: DragStartEvent) => {
    setDraggedSessionId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setDraggedSessionId(null);

    if (over && active.id !== over.id) {
      const dropData = over.data.current as { day: string; timeSlot: string; roomId: string } | undefined;

      if (dropData) {
        updateSession(active.id as string, {
          day: dropData.day,
          timeSlot: dropData.timeSlot,
          roomId: dropData.roomId,
        });
      }
    }
  };

  const draggedSession = draggedSessionId
    ? sessions.find((s) => s.id === draggedSessionId)
    : null;

  return (
    <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
        {!setupComplete && <WelcomeModal />}

        <Header />

        <main className="h-[calc(100vh-64px)]">
          <SplitPane
            left={<SessionList />}
            right={<SchedulerGrid />}
          />
        </main>

        <DragOverlay>
          {draggedSession && (
            <SessionCard session={draggedSession} isDragging />
          )}
        </DragOverlay>

        {selectedSessionId && <SessionDetailPopup />}
      </div>
    </DndContext>
  );
}

export default App;
