import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import type { Session } from '../../store/types';
import { useSchedulerStore } from '../../store/useSchedulerStore';
import { formatTime } from '../../utils/timeFormatter';

interface SessionCardProps {
  session: Session;
  hasConflict?: boolean;
  isDragging?: boolean;
}

export function SessionCard({ session, hasConflict, isDragging: isDraggingProp }: SessionCardProps) {
  const { eventConfig, updateSession, setSelectedSessionId, settings } = useSchedulerStore();

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: session.id,
    data: { session },
  });

  const style = transform
    ? {
        transform: CSS.Translate.toString(transform),
        zIndex: isDragging ? 50 : undefined,
      }
    : undefined;

  const isScheduled = session.day && session.timeSlot && session.roomId;
  const room = eventConfig.rooms.find((r) => r.id === session.roomId);
  const hasUnavailability = session.unavailability && session.unavailability.length > 0;

  const handleRemoveFromSchedule = (e: React.MouseEvent) => {
    e.stopPropagation();
    updateSession(session.id, {
      day: undefined,
      timeSlot: undefined,
      roomId: undefined,
    });
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't open popup if clicking remove button
    if ((e.target as HTMLElement).closest('button')) return;
    setSelectedSessionId(session.id);
  };

  const actualIsDragging = isDragging || isDraggingProp;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={handleCardClick}
      className={`
        p-3 rounded-lg border cursor-grab active:cursor-grabbing
        transition-all duration-150
        ${actualIsDragging ? 'opacity-50 shadow-lg scale-105' : 'hover:shadow-md'}
        ${
          isScheduled
            ? 'session-scheduled'
            : 'session-unscheduled'
        }
        ${hasConflict ? 'session-conflict' : ''}
      `}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          {/* Breakout Topic / Title - Bold */}
          <h4 className="font-bold text-sm truncate">{session.sessionTitle}</h4>
          {/* Presenter Name - Below title */}
          <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
            {session.presenterName}
          </p>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {hasUnavailability && (
            <span
              className="w-5 h-5 flex items-center justify-center bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-full"
              title="Has availability restrictions"
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </span>
          )}
          {hasConflict && (
            <span className="w-5 h-5 flex items-center justify-center bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </span>
          )}
        </div>
      </div>

      <div className="mt-2 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
        <span>{session.duration} min</span>
        <div className="flex items-center gap-1">
          {session.masteryLevel && (
            <span className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-xs capitalize">
              {session.masteryLevel}
            </span>
          )}
          {session.breakoutNumber && (
            <span className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-600 rounded text-xs">
              Breakout {session.breakoutNumber}
            </span>
          )}
        </div>
      </div>

      {isScheduled && (
        <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-600 flex items-center justify-between text-xs">
          <span className="text-green-600 dark:text-green-400">
            {session.day} &middot; {formatTime(session.timeSlot!, settings.timeFormat)} &middot; {room?.name}
          </span>
          <button
            onClick={handleRemoveFromSchedule}
            className="text-gray-400 hover:text-red-500 transition-colors"
            title="Unschedule session"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
