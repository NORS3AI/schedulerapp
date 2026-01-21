import { useEffect, useState, useCallback } from 'react';
import { useSchedulerStore } from './store/useSchedulerStore';
import { Header } from './components/Layout/Header';
import { SplitPane } from './components/Layout/SplitPane';
import { WelcomeModal } from './components/Setup/WelcomeModal';
import { SessionList } from './components/SessionList/SessionList';
import { SessionDetailPopup } from './components/SessionList/SessionDetailPopup';
import { SchedulerGrid } from './components/Scheduler/SchedulerGrid';
import { DndContext, DragEndEvent, DragStartEvent, DragOverlay } from '@dnd-kit/core';
import { SessionCard } from './components/SessionList/SessionCard';
import { ShortcutsModal } from './components/Help/ShortcutsModal';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';

function App() {
  const {
    setupComplete,
    settings,
    sessions,
    eventConfig,
    draggedSessionId,
    setDraggedSessionId,
    updateSession,
    selectedSessionId,
  } = useSchedulerStore();

  const [showShortcuts, setShowShortcuts] = useState(false);
  const [searchInputRef, setSearchInputRef] = useState<HTMLInputElement | null>(null);

  const handleShowHelp = useCallback(() => {
    setShowShortcuts(true);
  }, []);

  const handleShowSearch = useCallback(() => {
    if (searchInputRef) {
      searchInputRef.focus();
      searchInputRef.select();
    }
  }, [searchInputRef]);

  // Global keyboard shortcuts
  useKeyboardShortcuts({
    onShowHelp: handleShowHelp,
    onShowSearch: handleShowSearch,
  });

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

    if (over) {
      const dropData = over.data.current as { day?: string; timeSlot?: string; roomId?: string; action?: string } | undefined;

      if (dropData?.action === 'unschedule') {
        // Unschedule the session
        updateSession(active.id as string, {
          day: undefined,
          timeSlot: undefined,
          roomId: undefined,
        });
      } else if (dropData?.day && dropData?.timeSlot && dropData?.roomId) {
        // Schedule to a specific slot
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

        {/* Print-only header */}
        <div className="print-header hidden print:block">
          <h1>{eventConfig.name || 'Conference Schedule'}</h1>
          <p>Printed on {new Date().toLocaleDateString()}</p>
        </div>

        <main className="h-[calc(100vh-64px)]">
          <SplitPane
            left={<SessionList onSearchInputRef={setSearchInputRef} />}
            right={<SchedulerGrid />}
          />
        </main>

        <DragOverlay>
          {draggedSession && (
            <SessionCard session={draggedSession} isDragging />
          )}
        </DragOverlay>

        {selectedSessionId && <SessionDetailPopup />}
        {showShortcuts && <ShortcutsModal onClose={() => setShowShortcuts(false)} />}
      </div>
    </DndContext>
  );
}

export default App;
