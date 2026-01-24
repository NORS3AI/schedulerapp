import { useMemo, useRef, useEffect, useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { useSchedulerStore } from '../../store/useSchedulerStore';
import { SessionCard } from './SessionCard';
import { FilterBar } from './FilterBar';
import { detectConflicts, hasConflict } from '../../utils/conflictDetector';
import { autoSchedule } from '../../utils/autoScheduler';

type SortOption = 'default' | 'az' | 'za' | 'class-count' | 'availability';

interface SessionListProps {
  onSearchInputRef?: (ref: HTMLInputElement | null) => void;
}

export function SessionList({ onSearchInputRef }: SessionListProps) {
  const {
    sessions,
    setSessions,
    eventConfig,
    searchQuery,
    settings,
    scheduledCollapsed,
    setScheduledCollapsed,
    unscheduledCollapsed,
    setUnscheduledCollapsed,
    draggedSessionId,
    selectionMode,
    setSelectionMode,
    selectedSessionIds,
    selectAllUnscheduled,
    clearSelection,
  } = useSchedulerStore();

  const [sortOption, setSortOption] = useState<SortOption>('default');
  const [isAutoScheduling, setIsAutoScheduling] = useState(false);
  const [showDayMenu, setShowDayMenu] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const prevDraggedRef = useRef<string | null>(null);
  const dayMenuRef = useRef<HTMLDivElement>(null);

  // Close day menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dayMenuRef.current && !dayMenuRef.current.contains(e.target as Node)) {
        setShowDayMenu(false);
      }
    };
    if (showDayMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showDayMenu]);

  // Handle auto-schedule for selected sessions only
  const handleAutoScheduleSelected = (targetDays?: string[]) => {
    if (selectedSessionIds.size === 0) return;

    setIsAutoScheduling(true);
    setShowDayMenu(false);

    setTimeout(() => {
      // Get sessions to schedule (only selected unscheduled ones)
      const sessionsToSchedule = sessions.filter(
        (s) => selectedSessionIds.has(s.id) && (!s.day || !s.timeSlot || !s.roomId)
      );
      const alreadyScheduled = sessions.filter(
        (s) => !selectedSessionIds.has(s.id) || (s.day && s.timeSlot && s.roomId)
      );

      // Filter days if specific days are requested
      const daysToSchedule = targetDays
        ? eventConfig.days.filter(d => targetDays.includes(d.name))
        : eventConfig.days;

      // Run auto-schedule on selected sessions
      const result = autoSchedule(
        sessionsToSchedule,
        eventConfig.rooms,
        daysToSchedule,
        eventConfig.timeSlots
      );

      // Merge results back
      const newSessions = [...alreadyScheduled, ...result.scheduledSessions];
      setSessions(newSessions);

      setIsAutoScheduling(false);
      setSelectionMode(false);
      alert(result.message);
    }, 100);
  };

  // Select only filtered unscheduled sessions
  const handleSelectFiltered = () => {
    const filteredUnscheduledIds = filteredSessions
      .filter((s) => !s.day || !s.timeSlot || !s.roomId)
      .map((s) => s.id);

    // Update the store with only filtered session IDs
    filteredUnscheduledIds.forEach((id) => {
      if (!selectedSessionIds.has(id)) {
        useSchedulerStore.getState().toggleSessionSelection(id);
      }
    });
  };

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

  const unscheduledSessionsUnsorted = filteredSessions.filter(
    (s) => !s.day || !s.timeSlot || !s.roomId
  );

  // Sort unscheduled sessions based on sort option
  const unscheduledSessions = useMemo(() => {
    const sorted = [...unscheduledSessionsUnsorted];
    switch (sortOption) {
      case 'az':
        return sorted.sort((a, b) => a.presenterName.localeCompare(b.presenterName));
      case 'za':
        return sorted.sort((a, b) => b.presenterName.localeCompare(a.presenterName));
      case 'class-count': {
        // Count sessions per presenter
        const presenterCounts = new Map<string, number>();
        sessions.forEach((s) => {
          const name = s.presenterName;
          presenterCounts.set(name, (presenterCounts.get(name) || 0) + 1);
        });
        // Sort by count (descending), then by name
        return sorted.sort((a, b) => {
          const countA = presenterCounts.get(a.presenterName) || 0;
          const countB = presenterCounts.get(b.presenterName) || 0;
          if (countB !== countA) return countB - countA;
          return a.presenterName.localeCompare(b.presenterName);
        });
      }
      case 'availability': {
        // Sort by availability restrictions (most restricted first)
        return sorted.sort((a, b) => {
          const availA = a.unavailability?.length || 0;
          const availB = b.unavailability?.length || 0;
          if (availB !== availA) return availB - availA;
          return a.presenterName.localeCompare(b.presenterName);
        });
      }
      default:
        return sorted;
    }
  }, [unscheduledSessionsUnsorted, sortOption, sessions]);

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
                <div className="flex items-center justify-between mb-2">
                  <button
                    onClick={() => setUnscheduledCollapsed(!unscheduledCollapsed)}
                    className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-2 hover:text-gray-700 dark:hover:text-gray-300"
                  >
                    <svg
                      className={`w-4 h-4 transition-transform ${unscheduledCollapsed ? '' : 'rotate-90'}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                    Unscheduled ({unscheduledSessions.length})
                    {unscheduledCollapsed && (
                      <span className="text-xs text-gray-400 ml-2">(click to expand)</span>
                    )}
                  </button>
                  {!unscheduledCollapsed && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectionMode(!selectionMode)}
                        className={`text-xs px-2 py-1 rounded border transition-colors ${
                          selectionMode
                            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                            : 'border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300'
                        }`}
                        title={selectionMode ? 'Exit selection mode' : 'Select sessions to auto-schedule'}
                      >
                        {selectionMode ? 'Cancel' : 'Select'}
                      </button>
                      <select
                        value={sortOption}
                        onChange={(e) => setSortOption(e.target.value as SortOption)}
                        className="text-xs px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300"
                      >
                        <option value="default">Sort: Default</option>
                        <option value="az">Sort: A-Z</option>
                        <option value="za">Sort: Z-A</option>
                        <option value="class-count">Sort: Class Count</option>
                        <option value="availability">Sort: Availability</option>
                      </select>
                    </div>
                  )}
                </div>

                {/* Selection mode controls */}
                {!unscheduledCollapsed && selectionMode && (
                  <div className="mb-3 p-2 bg-primary-50 dark:bg-primary-900/20 rounded-lg border border-primary-200 dark:border-primary-800">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={handleSelectFiltered}
                          className="text-xs px-2 py-1 rounded bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300"
                          title={searchQuery ? 'Select all filtered sessions' : 'Select all unscheduled sessions'}
                        >
                          {searchQuery ? 'Select Filtered' : 'Select All'}
                        </button>
                        {searchQuery && (
                          <button
                            onClick={selectAllUnscheduled}
                            className="text-xs px-2 py-1 rounded bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300"
                            title="Select all unscheduled sessions (ignore filter)"
                          >
                            Select All
                          </button>
                        )}
                        <button
                          onClick={clearSelection}
                          className="text-xs px-2 py-1 rounded bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300"
                        >
                          Clear
                        </button>
                        <span className="text-xs text-primary-600 dark:text-primary-400">
                          {selectedSessionIds.size} selected
                        </span>
                      </div>
                      <div className="relative flex items-center" ref={dayMenuRef}>
                        <button
                          onClick={() => handleAutoScheduleSelected()}
                          disabled={selectedSessionIds.size === 0 || isAutoScheduling}
                          className="text-xs px-3 py-1 rounded-l bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                        >
                          {isAutoScheduling ? (
                            <>
                              <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                              </svg>
                              Scheduling...
                            </>
                          ) : (
                            <>
                              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                              </svg>
                              Schedule
                            </>
                          )}
                        </button>
                        {!isAutoScheduling && selectedSessionIds.size > 0 && eventConfig.days.length > 1 && (
                          <button
                            onClick={() => setShowDayMenu(!showDayMenu)}
                            className="text-xs px-1.5 py-1 rounded-r bg-primary-600 text-white hover:bg-primary-700 border-l border-primary-500"
                            title="Schedule to specific day"
                          >
                            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                        )}
                        {showDayMenu && (
                          <div className="absolute top-full right-0 mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50 min-w-[160px]">
                            <p className="px-3 py-1 text-xs text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                              Schedule to:
                            </p>
                            {eventConfig.days.map((day) => (
                              <button
                                key={day.id}
                                onClick={() => handleAutoScheduleSelected([day.name])}
                                className="w-full px-3 py-1.5 text-left text-xs hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                              >
                                <svg className="h-3 w-3 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                {day.name}
                              </button>
                            ))}
                            <div className="border-t border-gray-200 dark:border-gray-700 mt-1 pt-1">
                              <button
                                onClick={() => handleAutoScheduleSelected()}
                                className="w-full px-3 py-1.5 text-left text-xs hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 font-medium"
                              >
                                <svg className="h-3 w-3 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                                All Days
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {!unscheduledCollapsed && (
                  <div className="space-y-2">
                    {unscheduledSessions.map((session) => (
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
