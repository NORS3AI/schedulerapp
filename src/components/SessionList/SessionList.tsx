import { useMemo, useRef, useEffect } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { useSchedulerStore } from '../../store/useSchedulerStore';
import { SessionCard } from './SessionCard';
import { FilterBar } from './FilterBar';
import { detectConflicts, hasConflict } from '../../utils/conflictDetector';

interface SessionListProps {
  onSearchInputRef?: (ref: HTMLInputElement | null) => void;
}

export function SessionList({ onSearchInputRef }: SessionListProps) {
  const {
    sessions,
    eventConfig,
    searchQuery,
    settings,
    scheduledCollapsed,
    setScheduledCollapsed,
    draggedSessionId,
  } = useSchedulerStore();

  const listRef = useRef<HTMLDivElement>(null);
  const prevDraggedRef = useRef<string | null>(null);

  // Drop zone for unscheduling sessions
  const { isOver: isOverUnschedule, setNodeRef: setUnscheduleRef } = useDroppable({
    id: 'unschedule-zone',
    data: { action: 'unschedule' },
  });

  // Scroll to top after drag ends (session was dropped)
  useEffect(() => {
    if (prevDraggedRef.current && !draggedSessionId) {
      // Drag just ended
      if (listRef.current) {
        listRef.current.scrollTop = 0;
      }
    }
    prevDraggedRef.current = draggedSessionId;
  }, [draggedSessionId]);

  const conflicts = useMemo(() => {
    if (!settings.showConflicts) return [];
    return detectConflicts(sessions, eventConfig.rooms);
  }, [sessions, eventConfig.rooms, settings.showConflicts]);

  const filteredSessions = useMemo(() => {
    if (!searchQuery.trim()) return sessions;

    const query = searchQuery.toLowerCase();
    return sessions.filter(
      (s) =>
        s.presenterName.toLowerCase().includes(query) ||
        s.sessionTitle.toLowerCase().includes(query)
    );
  }, [sessions, searchQuery]);

  const unscheduledSessions = filteredSessions.filter(
    (s) => !s.day || !s.timeSlot || !s.roomId
  );
  const scheduledSessions = filteredSessions.filter(
    (s) => s.day && s.timeSlot && s.roomId
  );

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold mb-3">Sessions</h2>
        <FilterBar onInputRef={onSearchInputRef} />
      </div>

      <div ref={listRef} className="flex-1 overflow-y-auto p-4">
        {sessions.length === 0 ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <svg
              className="w-16 h-16 mx-auto mb-4 opacity-50"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              />
            </svg>
            <p className="mb-2">No sessions yet</p>
            <p className="text-sm">Import a CSV file to get started</p>
          </div>
        ) : filteredSessions.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            No sessions match your search
          </div>
        ) : (
          <>
            {/* Drop zone for unscheduling */}
            {draggedSessionId && (
              <div
                ref={setUnscheduleRef}
                className={`mb-4 p-4 border-2 border-dashed rounded-lg text-center transition-colors ${
                  isOverUnschedule
                    ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300'
                    : 'border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400'
                }`}
              >
                <svg className="w-6 h-6 mx-auto mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                <span className="text-sm font-medium">
                  {isOverUnschedule ? 'Release to unschedule' : 'Drop here to unschedule'}
                </span>
              </div>
            )}

            {unscheduledSessions.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                  Unscheduled ({unscheduledSessions.length})
                </h3>
                <div className="space-y-2">
                  {unscheduledSessions.map((session) => (
                    <SessionCard
                      key={session.id}
                      session={session}
                      hasConflict={hasConflict(session.id, conflicts)}
                    />
                  ))}
                </div>
              </div>
            )}

            {scheduledSessions.length > 0 && (
              <div>
                <button
                  onClick={() => setScheduledCollapsed(!scheduledCollapsed)}
                  className="w-full text-sm font-medium text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-2 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  <svg
                    className={`w-4 h-4 transition-transform ${scheduledCollapsed ? '' : 'rotate-90'}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  <span className="w-2 h-2 rounded-full bg-green-500"></span>
                  Scheduled ({scheduledSessions.length})
                  {scheduledCollapsed && (
                    <span className="text-xs text-gray-400 ml-2">(click to expand)</span>
                  )}
                </button>
                {!scheduledCollapsed && (
                  <div className="space-y-2">
                    {scheduledSessions.map((session) => (
                      <SessionCard
                        key={session.id}
                        session={session}
                        hasConflict={hasConflict(session.id, conflicts)}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
