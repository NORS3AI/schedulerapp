import { useDroppable } from '@dnd-kit/core';
import type { Session } from '../../store/types';
import { useSchedulerStore } from '../../store/useSchedulerStore';

interface DropZoneProps {
  day: string;
  timeSlot: string;
  roomId: string;
  session?: Session;
  hasConflict?: boolean;
}

export function DropZone({ day, timeSlot, roomId, session, hasConflict }: DropZoneProps) {
  const { updateSession, eventConfig } = useSchedulerStore();

  const { isOver, setNodeRef } = useDroppable({
    id: `${day}-${timeSlot}-${roomId}`,
    data: { day, timeSlot, roomId },
  });

  const room = eventConfig.rooms.find((r) => r.id === roomId);

  const handleRemove = () => {
    if (session) {
      updateSession(session.id, {
        day: undefined,
        timeSlot: undefined,
        roomId: undefined,
      });
    }
  };

  return (
    <div
      ref={setNodeRef}
      className={`
        min-h-[80px] rounded-lg border-2 border-dashed transition-all
        ${
          session
            ? hasConflict
              ? 'border-red-400 bg-red-50 dark:bg-red-900/20'
              : 'border-green-300 bg-green-50 dark:bg-green-900/20 border-solid'
            : isOver
            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30'
            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
        }
      `}
    >
      {session ? (
        <div className="p-2 h-full">
          <div className="flex items-start justify-between gap-1">
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-sm truncate">{session.sessionTitle}</h4>
              <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                {session.presenterName}
              </p>
            </div>
            <button
              onClick={handleRemove}
              className="flex-shrink-0 p-1 text-gray-400 hover:text-red-500 rounded"
              title="Remove from slot"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="mt-1 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <span>{session.duration} min</span>
            {session.expectedAttendees && room && (
              <span className={session.expectedAttendees > room.capacity ? 'text-red-500' : ''}>
                {session.expectedAttendees}/{room.capacity}
              </span>
            )}
          </div>
          {hasConflict && (
            <div className="mt-1 flex items-center gap-1 text-xs text-red-600 dark:text-red-400">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              Conflict
            </div>
          )}
        </div>
      ) : (
        <div className="h-full flex items-center justify-center p-2">
          {isOver ? (
            <span className="text-sm text-primary-600 dark:text-primary-400">
              Drop here
            </span>
          ) : (
            <span className="text-xs text-gray-400 dark:text-gray-500">
              Empty slot
            </span>
          )}
        </div>
      )}
    </div>
  );
}
