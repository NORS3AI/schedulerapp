import { useEffect, useMemo } from 'react';
import { useSchedulerStore } from '../../store/useSchedulerStore';
import { detectConflicts } from '../../utils/conflictDetector';
import { formatTime } from '../../utils/timeFormatter';
import type { Conflict } from '../../store/types';

interface ConflictsModalProps {
  onClose: () => void;
}

interface DetailedConflict extends Conflict {
  sessions: Array<{
    id: string;
    presenterName: string;
    sessionTitle: string;
    day?: string;
    timeSlot?: string;
    roomName?: string;
  }>;
}

export function ConflictsModal({ onClose }: ConflictsModalProps) {
  const { sessions, eventConfig, settings } = useSchedulerStore();

  // Handle Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Detect and enrich conflicts with session details
  const detailedConflicts = useMemo((): DetailedConflict[] => {
    const conflicts = detectConflicts(sessions, eventConfig.rooms);

    return conflicts.map((conflict) => {
      const conflictSessions = conflict.sessionIds.map((id) => {
        const session = sessions.find((s) => s.id === id);
        const room = session?.roomId
          ? eventConfig.rooms.find((r) => r.id === session.roomId)
          : undefined;

        return {
          id,
          presenterName: session?.presenterName || 'Unknown',
          sessionTitle: session?.sessionTitle || 'Unknown Session',
          day: session?.day,
          timeSlot: session?.timeSlot,
          roomName: room?.name,
        };
      });

      return {
        ...conflict,
        sessions: conflictSessions,
      };
    });
  }, [sessions, eventConfig.rooms]);

  const getConflictIcon = (type: Conflict['type']) => {
    switch (type) {
      case 'presenter':
        return (
          <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        );
      case 'room':
        return (
          <svg className="w-5 h-5 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        );
      case 'capacity':
        return (
          <svg className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        );
      case 'availability':
        return (
          <svg className="w-5 h-5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      default:
        return null;
    }
  };

  const getConflictTypeName = (type: Conflict['type']) => {
    switch (type) {
      case 'presenter':
        return 'Presenter Double-Booked';
      case 'room':
        return 'Room Double-Booked';
      case 'capacity':
        return 'Capacity Exceeded';
      case 'availability':
        return 'Presenter Unavailable';
      default:
        return 'Conflict';
    }
  };

  const getConflictSeverity = (type: Conflict['type']) => {
    switch (type) {
      case 'presenter':
      case 'room':
        return 'Critical';
      case 'availability':
        return 'Warning';
      case 'capacity':
        return 'Caution';
      default:
        return 'Info';
    }
  };

  const getSeverityColor = (type: Conflict['type']) => {
    switch (type) {
      case 'presenter':
      case 'room':
        return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800';
      case 'availability':
        return 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800';
      case 'capacity':
        return 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800';
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600';
    }
  };

  // Group conflicts by type
  const groupedConflicts = useMemo(() => {
    const groups: Record<string, DetailedConflict[]> = {
      presenter: [],
      room: [],
      availability: [],
      capacity: [],
    };

    for (const conflict of detailedConflicts) {
      groups[conflict.type]?.push(conflict);
    }

    return groups;
  }, [detailedConflicts]);

  const totalConflicts = detailedConflicts.length;
  const criticalCount = groupedConflicts.presenter.length + groupedConflicts.room.length;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center modal-backdrop"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-lg font-semibold">Schedule Conflicts</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {totalConflicts === 0 ? (
                'No conflicts detected'
              ) : (
                <>
                  {totalConflicts} conflict{totalConflicts !== 1 ? 's' : ''} found
                  {criticalCount > 0 && (
                    <span className="text-red-500 ml-2">
                      ({criticalCount} critical)
                    </span>
                  )}
                </>
              )}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {totalConflicts === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500 dark:text-gray-400">
              <svg className="w-16 h-16 mb-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-lg font-medium text-green-600 dark:text-green-400">All Clear!</p>
              <p className="text-sm mt-1">Your schedule has no conflicts.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                  <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                    {groupedConflicts.presenter.length}
                  </div>
                  <div className="text-xs text-red-600 dark:text-red-400">Presenter Conflicts</div>
                </div>
                <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                  <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                    {groupedConflicts.room.length}
                  </div>
                  <div className="text-xs text-orange-600 dark:text-orange-400">Room Conflicts</div>
                </div>
                <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {groupedConflicts.availability.length}
                  </div>
                  <div className="text-xs text-purple-600 dark:text-purple-400">Availability Issues</div>
                </div>
                <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                  <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                    {groupedConflicts.capacity.length}
                  </div>
                  <div className="text-xs text-amber-600 dark:text-amber-400">Capacity Warnings</div>
                </div>
              </div>

              {/* Detailed Conflicts List */}
              <div className="space-y-3">
                {detailedConflicts.map((conflict, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border ${getSeverityColor(conflict.type)}`}
                  >
                    {/* Conflict Header */}
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-0.5">
                        {getConflictIcon(conflict.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{getConflictTypeName(conflict.type)}</span>
                          <span className={`px-2 py-0.5 text-xs rounded-full ${
                            conflict.type === 'presenter' || conflict.type === 'room'
                              ? 'bg-red-200 dark:bg-red-800 text-red-800 dark:text-red-200'
                              : conflict.type === 'availability'
                              ? 'bg-purple-200 dark:bg-purple-800 text-purple-800 dark:text-purple-200'
                              : 'bg-amber-200 dark:bg-amber-800 text-amber-800 dark:text-amber-200'
                          }`}>
                            {getConflictSeverity(conflict.type)}
                          </span>
                        </div>
                        <p className="text-sm opacity-90">{conflict.message}</p>
                      </div>
                    </div>

                    {/* Affected Sessions */}
                    <div className="mt-3 pl-8 space-y-2">
                      <div className="text-xs font-medium opacity-70 uppercase tracking-wide">
                        Affected Sessions:
                      </div>
                      {conflict.sessions.map((session) => (
                        <div
                          key={session.id}
                          className="p-2 bg-white/50 dark:bg-gray-900/30 rounded border border-current/20"
                        >
                          <div className="font-medium text-sm">{session.sessionTitle}</div>
                          <div className="text-xs opacity-80 flex flex-wrap gap-x-3 gap-y-1 mt-1">
                            <span>Presenter: {session.presenterName}</span>
                            {session.day && session.timeSlot && (
                              <span>
                                When: {session.day} @ {formatTime(session.timeSlot, settings.timeFormat)}
                              </span>
                            )}
                            {session.roomName && <span>Room: {session.roomName}</span>}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Resolution Hint */}
                    <div className="mt-3 pl-8 text-xs opacity-70 italic">
                      {conflict.type === 'presenter' && (
                        <>Resolve by moving one session to a different time slot.</>
                      )}
                      {conflict.type === 'room' && (
                        <>Resolve by moving one session to a different room or time.</>
                      )}
                      {conflict.type === 'availability' && (
                        <>Resolve by scheduling this session at a time when the presenter is available.</>
                      )}
                      {conflict.type === 'capacity' && (
                        <>Consider moving to a larger room or limiting attendees.</>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
