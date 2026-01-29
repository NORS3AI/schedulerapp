import { useState, useRef, useEffect } from 'react';
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

interface RadialMenuPosition {
  x: number;
  y: number;
}

export function SessionCard({ session, hasConflict, isDragging: isDraggingProp }: SessionCardProps) {
  const { eventConfig, updateSession, setSelectedSessionId, settings, selectionMode, selectedSessionIds, toggleSessionSelection, duplicateSession, removeDuplicateSession, sessions } = useSchedulerStore();
  const [showRadialMenu, setShowRadialMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState<RadialMenuPosition>({ x: 0, y: 0 });
  const [showQuickAssign, setShowQuickAssign] = useState(false);
  const radialMenuRef = useRef<HTMLDivElement>(null);
  const quickAssignRef = useRef<HTMLDivElement>(null);

  const isScheduled = session.day && session.timeSlot && session.roomId;

  // Disable drag when in selection mode for unscheduled sessions
  const isDragDisabled = selectionMode && !isScheduled;

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: session.id,
    data: { session },
    disabled: isDragDisabled,
  });

  const style = transform
    ? {
        transform: CSS.Translate.toString(transform),
        zIndex: isDragging ? 50 : undefined,
      }
    : undefined;

  const room = eventConfig.rooms.find((r) => r.id === session.roomId);

  // Close radial menu and quick assign when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (radialMenuRef.current && !radialMenuRef.current.contains(target) &&
          quickAssignRef.current && !quickAssignRef.current.contains(target)) {
        setShowRadialMenu(false);
        setShowQuickAssign(false);
      } else if (radialMenuRef.current && !radialMenuRef.current.contains(target) && !showQuickAssign) {
        setShowRadialMenu(false);
      }
    };

    if (showRadialMenu || showQuickAssign) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showRadialMenu, showQuickAssign]);

  const handleRemoveFromSchedule = (e: React.MouseEvent) => {
    e.stopPropagation();
    updateSession(session.id, {
      day: undefined,
      timeSlot: undefined,
      roomId: undefined,
    });
    setShowRadialMenu(false);
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't open popup if clicking remove button or checkbox
    if ((e.target as HTMLElement).closest('button')) return;
    if ((e.target as HTMLElement).closest('input[type="checkbox"]')) return;
    if ((e.target as HTMLElement).closest('.radial-menu')) return;

    // In selection mode, toggle selection instead of opening details
    if (selectionMode && !isScheduled) {
      toggleSessionSelection(session.id);
      return;
    }

    // For scheduled sessions, open details on click
    if (isScheduled) {
      setSelectedSessionId(session.id);
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Don't show radial menu in selection mode
    if (selectionMode) return;

    // Get position relative to viewport
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setMenuPosition({ x, y });
    setShowRadialMenu(true);
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    toggleSessionSelection(session.id);
  };

  const isSelected = selectedSessionIds.has(session.id);

  const actualIsDragging = isDragging || isDraggingProp;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...(isDragDisabled ? {} : attributes)}
      {...(isDragDisabled ? {} : listeners)}
      onClick={handleCardClick}
      onContextMenu={handleContextMenu}
      className={`
        p-3 rounded-lg border relative
        transition-all duration-150
        ${isDragDisabled ? 'cursor-pointer' : 'cursor-grab active:cursor-grabbing'}
        ${actualIsDragging ? 'opacity-50 shadow-lg scale-105' : 'hover:shadow-md'}
        ${
          isScheduled
            ? 'session-scheduled'
            : 'session-unscheduled'
        }
        ${hasConflict ? 'session-conflict' : ''}
        ${selectionMode && !isScheduled && isSelected ? 'ring-2 ring-primary-500 bg-primary-50 dark:bg-primary-900/20' : ''}
      `}
    >
      {/* Radial Menu - rendered in portal-like manner to avoid drag interference */}
      {showRadialMenu && (
        <div
          ref={radialMenuRef}
          className="radial-menu absolute z-[100]"
          style={{
            left: menuPosition.x - 60,
            top: menuPosition.y - 60,
            pointerEvents: 'auto',
          }}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <div className="relative w-[120px] h-[120px]" style={{ pointerEvents: 'auto' }}>
            {/* Circular background */}
            <div className="absolute inset-0 rounded-full bg-white dark:bg-gray-800 shadow-xl border border-gray-200 dark:border-gray-700" />

            {/* Top: Session Details */}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowRadialMenu(false);
                setSelectedSessionId(session.id);
              }}
              onMouseDown={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
              className="absolute top-1 left-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/50 hover:bg-primary-200 dark:hover:bg-primary-800 flex items-center justify-center transition-colors z-10"
              title="Session Details"
            >
              <svg className="w-5 h-5 text-primary-600 dark:text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>

            {/* Right: Assign Room - shows quick assign menu */}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowQuickAssign(true);
              }}
              onMouseDown={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
              className="absolute right-1 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/50 hover:bg-green-200 dark:hover:bg-green-800 flex items-center justify-center transition-colors z-10"
              title="Quick Assign"
            >
              <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </button>

            {/* Bottom: Unschedule (only if scheduled) */}
            {isScheduled ? (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowRadialMenu(false);
                  updateSession(session.id, {
                    day: undefined,
                    timeSlot: undefined,
                    roomId: undefined,
                  });
                }}
                onMouseDown={(e) => e.stopPropagation()}
                onPointerDown={(e) => e.stopPropagation()}
                className="absolute bottom-1 left-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/50 hover:bg-red-200 dark:hover:bg-red-800 flex items-center justify-center transition-colors z-10"
                title="Unschedule"
              >
                <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            ) : (
              <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center opacity-50">
                <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
            )}

            {/* Left: Reserved (disabled) */}
            <div
              className="absolute left-1 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center opacity-30"
              title="Reserved"
            >
              <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>

            {/* Center close button */}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowRadialMenu(false);
              }}
              onMouseDown={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 flex items-center justify-center transition-colors z-10"
              title="Close"
            >
              <svg className="w-4 h-4 text-gray-600 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Quick Assign Floating Menu - V1.1.4 */}
          {showQuickAssign && (
            <div
              ref={quickAssignRef}
              className="absolute left-[130px] top-0 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-3 z-[110]"
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-sm">Quick Assign</h4>
                <button
                  type="button"
                  onClick={() => {
                    setShowQuickAssign(false);
                    setShowRadialMenu(false);
                  }}
                  className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Day Selection */}
              <div className="mb-2">
                <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Day</label>
                <select
                  value={session.day || ''}
                  onChange={(e) => updateSession(session.id, { day: e.target.value || undefined })}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700"
                >
                  <option value="">Select day...</option>
                  {eventConfig.days.map((day) => (
                    <option key={day.id} value={day.name}>{day.name}</option>
                  ))}
                </select>
              </div>

              {/* Time Selection */}
              <div className="mb-2">
                <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Time</label>
                <select
                  value={session.timeSlot || ''}
                  onChange={(e) => updateSession(session.id, { timeSlot: e.target.value || undefined })}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700"
                >
                  <option value="">Select time...</option>
                  {eventConfig.timeSlots.filter(ts => !ts.isBreak).map((ts) => (
                    <option key={ts.id} value={ts.startTime}>
                      {formatTime(ts.startTime, settings.timeFormat)} - {formatTime(ts.endTime, settings.timeFormat)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Room Selection */}
              <div className="mb-3">
                <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Room</label>
                <select
                  value={session.roomId || ''}
                  onChange={(e) => updateSession(session.id, { roomId: e.target.value || undefined })}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700"
                >
                  <option value="">Select room...</option>
                  {eventConfig.rooms.map((room) => (
                    <option key={room.id} value={room.id}>{room.name} ({room.capacity})</option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowQuickAssign(false);
                  setShowRadialMenu(false);
                }}
                className="w-full px-3 py-1.5 bg-primary-600 text-white text-sm rounded hover:bg-primary-700"
              >
                Done
              </button>
            </div>
          )}
        </div>
      )}
      <div className="flex items-start justify-between gap-2">
        {/* Selection checkbox for unscheduled sessions in selection mode */}
        {selectionMode && !isScheduled && (
          <div className="flex-shrink-0 pt-0.5">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={handleCheckboxChange}
              className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
          </div>
        )}
        <div className="flex-1 min-w-0">
          {/* Breakout Topic / Title - Bold */}
          <h4 className="font-bold text-sm truncate">{session.sessionTitle}</h4>
          {/* Presenter Name - Below title */}
          <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
            {session.presenterName}
          </p>
          {/* Presenter Title - on its own line */}
          {session.presenterTitle && (
            <p className="text-xs text-gray-500 dark:text-gray-500 truncate">
              {session.presenterTitle}
            </p>
          )}
          {/* Presenter Company - on its own line */}
          {session.presenterCompany && (
            <p className="text-xs text-gray-500 dark:text-gray-500 truncate">
              {session.presenterCompany}
            </p>
          )}
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
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
        <div className="flex items-center gap-2">
          <span>{session.duration} min</span>
          {/* Instance count and controls */}
          {(() => {
            const originalId = session.originalSessionId || session.id;
            const instanceCount = sessions.filter(
              (s) => s.id === originalId || s.originalSessionId === originalId
            ).length;
            const isDuplicate = !!session.originalSessionId;

            return (
              <div className="flex items-center gap-1">
                {instanceCount > 1 && (
                  <span className="px-1.5 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded text-xs">
                    {session.instanceNumber || 1}/{instanceCount}
                  </span>
                )}
                {!isScheduled && (
                  <div
                    className="flex items-center"
                    onMouseDown={(e) => e.stopPropagation()}
                    onPointerDown={(e) => e.stopPropagation()}
                    onTouchStart={(e) => e.stopPropagation()}
                  >
                    {isDuplicate && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          removeDuplicateSession(session.id);
                        }}
                        onMouseDown={(e) => e.stopPropagation()}
                        onPointerDown={(e) => e.stopPropagation()}
                        className="w-5 h-5 flex items-center justify-center text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors cursor-pointer"
                        title="Remove this duplicate"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                        </svg>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        duplicateSession(session.id);
                      }}
                      onMouseDown={(e) => e.stopPropagation()}
                      onPointerDown={(e) => e.stopPropagation()}
                      className="w-5 h-5 flex items-center justify-center text-green-500 hover:bg-green-100 dark:hover:bg-green-900/30 rounded transition-colors cursor-pointer"
                      title="Add another teaching of this session"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            );
          })()}
        </div>
        <div className="flex items-center gap-1 flex-wrap justify-end">
          {session.masteryLevel && (
            String(session.masteryLevel).split(',').map((level) => (
              <span
                key={`${session.id}-${level.trim()}`}
                className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-xs capitalize"
              >
                {level.trim()}
              </span>
            ))
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
