import { useDroppable, useDraggable } from '@dnd-kit/core';
import type { Session, Conflict } from '../../store/types';
import { useSchedulerStore } from '../../store/useSchedulerStore';
import { getSessionConflicts, hasOverriddenCapacity } from '../../utils/conflictDetector';

interface DropZoneProps {
  day: string;
  timeSlot: string;
  roomId: string;
  session?: Session;
  hasConflict?: boolean;
  conflicts?: Conflict[];
}

export function DropZone({ day, timeSlot, roomId, session, hasConflict, conflicts = [] }: DropZoneProps) {
  const { updateSession, eventConfig, setSelectedSessionId } = useSchedulerStore();

  const { isOver, setNodeRef: setDropRef } = useDroppable({
    id: `${day}-${timeSlot}-${roomId}`,
    data: { day, timeSlot, roomId },
  });

  // Make scheduled sessions draggable
  const {
    attributes,
    listeners,
    setNodeRef: setDragRef,
    isDragging,
  } = useDraggable({
    id: session?.id || `empty-${day}-${timeSlot}-${roomId}`,
    disabled: !session,
  });

  const room = eventConfig.rooms.find((r) => r.id === roomId);

  // Check if this session has an overridden capacity warning (approved)
  const hasCapacityOverride = session ? hasOverriddenCapacity(session, eventConfig.rooms) : false;

  // Get the type of conflict for this session
  const sessionConflicts = session ? getSessionConflicts(session.id, conflicts) : [];
  const hasCapacityConflict = sessionConflicts.some((c) => c.type === 'capacity');

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (session) {
      updateSession(session.id, {
        day: undefined,
        timeSlot: undefined,
        roomId: undefined,
      });
    }
  };

  const handleRemovePointerDown = (e: React.PointerEvent) => {
    // Prevent drag from starting when clicking the remove button
    e.stopPropagation();
  };

  const handleApproveCapacity = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (session) {
      updateSession(session.id, { capacityOverride: true });
    }
  };

  const handleApprovePointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
  };

  const handleSessionClick = (e: React.MouseEvent) => {
    // Don't open details if we clicked a button or are dragging
    if (isDragging) return;
    const target = e.target as HTMLElement;
    if (target.closest('button')) return;
    if (session) {
      setSelectedSessionId(session.id);
    }
  };

  // Determine styling based on conflict state
  const getBorderStyle = () => {
    if (isDragging) return 'opacity-50 border-gray-300 dark:border-gray-600';
    if (!session) {
      return isOver
        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30'
        : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500';
    }
    if (hasConflict) {
      return 'border-red-400 bg-red-50 dark:bg-red-900/20';
    }
    if (hasCapacityOverride) {
      return 'border-amber-400 bg-amber-50 dark:bg-amber-900/20';
    }
    return 'border-green-300 bg-green-50 dark:bg-green-900/20 border-solid';
  };

  return (
    <div
      ref={setDropRef}
      className={`
        min-h-[80px] rounded-lg border-2 border-dashed transition-all
        ${getBorderStyle()}
      `}
    >
      {session ? (
        <div
          ref={setDragRef}
          {...attributes}
          {...listeners}
          onClick={handleSessionClick}
          className={`p-2 h-full cursor-grab active:cursor-grabbing ${isDragging ? 'opacity-50' : ''}`}
        >
          <div className="flex items-start justify-between gap-1">
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-sm truncate">{session.sessionTitle}</h4>
              <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                {session.presenterName}
              </p>
            </div>
            <button
              onClick={handleRemove}
              onPointerDown={handleRemovePointerDown}
              className="flex-shrink-0 p-1 text-gray-400 hover:text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors"
              title="Unschedule session"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
          <div className="mt-1 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <span>{session.duration} min</span>
            {session.expectedAttendees && room && (
              <span className={session.expectedAttendees > room.capacity && !session.capacityOverride ? 'text-red-500' : session.expectedAttendees > room.capacity ? 'text-amber-600' : ''}>
                {session.expectedAttendees}/{room.capacity}
              </span>
            )}
          </div>
          {hasConflict && (
            <div className="mt-1 flex items-center justify-between">
              <div className="flex items-center gap-1 text-xs text-red-600 dark:text-red-400">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                Conflict
              </div>
              {hasCapacityConflict && (
                <button
                  onClick={handleApproveCapacity}
                  onPointerDown={handleApprovePointerDown}
                  className="px-1.5 py-0.5 text-xs bg-amber-500 text-white rounded hover:bg-amber-600 transition-colors"
                  title="Approve capacity override"
                >
                  Approve
                </button>
              )}
            </div>
          )}
          {hasCapacityOverride && (
            <div className="mt-1 flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Capacity Approved
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
