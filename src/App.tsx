import { useEffect, useState, useCallback } from 'react';
import { useSchedulerStore } from './store/useSchedulerStore';
import { Header } from './components/Layout/Header';
import { SplitPane } from './components/Layout/SplitPane';
import { WelcomeModal } from './components/Setup/WelcomeModal';
import { SessionList } from './components/SessionList/SessionList';
import { SessionDetailPopup } from './components/SessionList/SessionDetailPopup';
import { SchedulerGrid } from './components/Scheduler/SchedulerGrid';
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  TouchSensor,
  MouseSensor,
  useSensor,
  useSensors
} from '@dnd-kit/core';
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
    csvHeaders,
    reParseAvailability,
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

  // Configure sensors for touch and mouse support (iPad, desktop)
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 5, // 5px movement required before drag starts
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 150, // 150ms press before drag starts (prevents scroll interference)
        tolerance: 5, // 5px movement tolerance
      },
    })
  );

  // V1.1.4b: Re-parse availability on load if sessions exist with originalData
  // This ensures all weekday availability columns are properly parsed
  useEffect(() => {
    if (sessions.length > 0 && csvHeaders.length > 0) {
      // Check if there are weekday columns that might not have been parsed
      const weekdayPattern = /^(monday|tuesday|wednesday|thursday|friday|saturday|sunday),?\s*(january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2}/i;
      const hasWeekdayColumns = csvHeaders.some(h => weekdayPattern.test(h));

      if (hasWeekdayColumns) {
        // Check if any session might need re-parsing (has originalData but might be missing weekday availability)
        const needsReparse = sessions.some(s =>
          s.originalData &&
          (!s.parsedAvailability?.displayItems || s.parsedAvailability.displayItems.length === 0)
        );

        if (needsReparse) {
          reParseAvailability();
        }
      }
    }
  }, [sessions, csvHeaders, reParseAvailability]); // Re-run when sessions or headers change

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
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
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

        <DragOverlay
          adjustScale={false}
          dropAnimation={{
            duration: 200,
            easing: 'ease',
          }}
        >
          {draggedSession && (
            <div style={{
              width: '280px',
              touchAction: 'none',
              transform: 'translate(-50%, -50%)',
              cursor: 'grabbing',
            }}>
              <SessionCard session={draggedSession} isDragging />
            </div>
          )}
        </DragOverlay>

        {selectedSessionId && <SessionDetailPopup />}
        {showShortcuts && <ShortcutsModal onClose={() => setShowShortcuts(false)} />}
      </div>
    </DndContext>
  );
}

export default App;
