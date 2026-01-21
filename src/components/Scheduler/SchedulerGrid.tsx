import { useMemo, useState, useRef, useEffect } from 'react';
import { useSchedulerStore, getTimeSlotsForDay } from '../../store/useSchedulerStore';
import { DayTabs } from './DayTabs';
import { DropZone } from './DropZone';
import { detectConflicts, hasConflict } from '../../utils/conflictDetector';
import { formatTime } from '../../utils/timeFormatter';

export function SchedulerGrid() {
  const { sessions, eventConfig, selectedDay, settings, updateRoom } = useSchedulerStore();
  const timeSlots = getTimeSlotsForDay(selectedDay);
  const [editingRoom, setEditingRoom] = useState<string | null>(null);
  const [editRoomName, setEditRoomName] = useState('');
  const [editRoomCapacity, setEditRoomCapacity] = useState('');
  const editContainerRef = useRef<HTMLDivElement>(null);
  const editNameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingRoom && editNameRef.current) {
      editNameRef.current.focus();
      editNameRef.current.select();
    }
  }, [editingRoom]);

  const handleEditRoom = (room: { id: string; name: string; capacity: number }) => {
    setEditingRoom(room.id);
    setEditRoomName(room.name);
    setEditRoomCapacity(String(room.capacity));
  };

  const handleSaveRoom = () => {
    if (editingRoom && editRoomName.trim()) {
      updateRoom(editingRoom, {
        name: editRoomName.trim(),
        capacity: parseInt(editRoomCapacity, 10) || 0,
      });
    }
    setEditingRoom(null);
  };

  const handleRoomKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveRoom();
    } else if (e.key === 'Escape') {
      setEditingRoom(null);
    }
  };

  const handleRoomBlur = (e: React.FocusEvent) => {
    // Only save if focus is leaving the edit container entirely
    if (editContainerRef.current && !editContainerRef.current.contains(e.relatedTarget as Node)) {
      handleSaveRoom();
    }
  };

  const conflicts = useMemo(() => {
    if (!settings.showConflicts) return [];
    return detectConflicts(sessions, eventConfig.rooms);
  }, [sessions, eventConfig.rooms, settings.showConflicts]);

  if (eventConfig.rooms.length === 0 || timeSlots.length === 0) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center max-w-md p-8">
          <svg
            className="w-16 h-16 mx-auto mb-4 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"
            />
          </svg>
          <h3 className="text-lg font-medium mb-2">Set up your schedule</h3>
          <p className="text-gray-500 dark:text-gray-400">
            {eventConfig.rooms.length === 0 && 'Add rooms '}
            {eventConfig.rooms.length === 0 && timeSlots.length === 0 && 'and '}
            {timeSlots.length === 0 && 'add time slots '}
            to start scheduling sessions.
          </p>
        </div>
      </div>
    );
  }

  // Helper to render a single day's grid (reused for print-all-days)
  const renderDayGrid = (dayName: string, dayTimeSlots: typeof timeSlots, isPrintView = false) => {
    return (
      <div key={dayName} className={isPrintView ? 'print-day-section mb-8' : ''}>
        {isPrintView && (
          <h2 className="text-xl font-bold mb-4 text-center border-b-2 border-gray-400 pb-2">
            {eventConfig.name || 'Schedule'} - {dayName}
          </h2>
        )}
        <div className="min-w-max">
          {/* Header row with room names */}
          <div className="flex mb-2">
            <div className="w-24 flex-shrink-0" />
            {eventConfig.rooms.map((room) => (
              <div
                key={room.id}
                className="flex-1 min-w-[150px] px-2 text-center"
              >
                <div className="bg-primary-600 text-white rounded-t-lg py-2 px-3">
                  <div className="font-medium">{room.name}</div>
                  <div className="text-xs opacity-80">Cap: {room.capacity}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Time slot rows */}
          <div className="space-y-1">
            {dayTimeSlots.map((slot) => {
              const hasSessionInSlot = sessions.some(
                (s) => s.day === dayName && s.timeSlot === slot.startTime
              );
              // Skip empty non-break slots in print view
              if (isPrintView && !hasSessionInSlot && !slot.isBreak) {
                return null;
              }

              return (
                <div key={slot.id} className="flex">
                  {/* Time label */}
                  <div className="w-24 flex-shrink-0 pr-2 text-right">
                    <div className={`text-sm font-medium ${slot.isBreak ? 'text-amber-600' : 'text-gray-700'}`}>
                      {formatTime(slot.startTime, settings.timeFormat)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatTime(slot.endTime, settings.timeFormat)}
                    </div>
                  </div>

                  {/* Break slot - spans all rooms */}
                  {slot.isBreak ? (
                    <div
                      className="flex-1 px-1"
                      style={{ minWidth: `${eventConfig.rooms.length * 150}px` }}
                    >
                      <div className="h-12 bg-amber-100 border-2 border-dashed border-amber-300 rounded-lg flex items-center justify-center">
                        <div className="text-center">
                          <div className="font-medium text-amber-700">
                            {slot.breakLabel || 'Break'}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    eventConfig.rooms.map((room) => {
                      const session = sessions.find(
                        (s) =>
                          s.day === dayName &&
                          s.timeSlot === slot.startTime &&
                          s.roomId === room.id
                      );

                      return (
                        <div
                          key={`${slot.id}-${room.id}`}
                          className="flex-1 min-w-[150px] px-1"
                        >
                          <div className={`h-16 rounded-lg border ${
                            session
                              ? 'bg-green-50 border-green-300 p-2'
                              : 'bg-white border-gray-200'
                          }`}>
                            {session && (
                              <>
                                <div className="text-xs font-medium truncate">{session.sessionTitle}</div>
                                <div className="text-xs text-gray-600 truncate">{session.presenterName}</div>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900" id="scheduler-grid">
      {/* Print-only: All days view */}
      <div className="hidden print:block print-all-days p-4">
        {eventConfig.days.map((day) => {
          const dayTimeSlots = day.timeSlots && day.timeSlots.length > 0
            ? day.timeSlots
            : eventConfig.timeSlots;
          return renderDayGrid(day.name, dayTimeSlots, true);
        })}
        <div className="text-center text-xs text-gray-500 mt-4">
          Generated by Conference Scheduler 2026 on {new Date().toLocaleDateString()}
        </div>
      </div>

      {/* Screen view: Single day with tabs */}
      <div className="print:hidden h-full flex flex-col">
        <DayTabs />

        <div className="flex-1 overflow-auto p-4">
          <div className="min-w-max">
            {/* Header row with room names */}
            <div className="flex mb-2 sticky top-0 z-10 bg-gray-50 dark:bg-gray-900 pb-2">
              <div className="w-24 flex-shrink-0" />
              {eventConfig.rooms.map((room) => (
              <div
                key={room.id}
                className="flex-1 min-w-[180px] px-2 text-center"
              >
                {editingRoom === room.id ? (
                  <div
                    ref={editContainerRef}
                    className="bg-primary-600 text-white rounded-t-lg py-2 px-3"
                    onBlur={handleRoomBlur}
                  >
                    <input
                      ref={editNameRef}
                      type="text"
                      value={editRoomName}
                      onChange={(e) => setEditRoomName(e.target.value)}
                      onKeyDown={handleRoomKeyDown}
                      className="w-full bg-white/20 rounded px-2 py-1 text-center font-medium text-white placeholder-white/50 focus:bg-white/30 focus:outline-none"
                      placeholder="Room name"
                    />
                    <div className="flex items-center justify-center gap-2 mt-2">
                      <label className="text-xs opacity-80">Capacity:</label>
                      <input
                        type="number"
                        min="0"
                        value={editRoomCapacity}
                        onChange={(e) => setEditRoomCapacity(e.target.value)}
                        onKeyDown={handleRoomKeyDown}
                        className="w-20 bg-white/20 rounded px-2 py-1 text-center text-sm text-white placeholder-white/50 focus:bg-white/30 focus:outline-none"
                        placeholder="0"
                      />
                    </div>
                    <button
                      onClick={handleSaveRoom}
                      className="w-full mt-2 px-2 py-1 bg-white/20 hover:bg-white/30 rounded text-xs transition-colors"
                    >
                      Save
                    </button>
                  </div>
                ) : (
                  <div
                    className="bg-primary-600 text-white rounded-t-lg py-2 px-3 cursor-pointer hover:bg-primary-700 transition-colors"
                    onClick={() => handleEditRoom(room)}
                    title="Click to edit room"
                  >
                    <div className="font-medium">{room.name}</div>
                    <div className="text-xs opacity-80">Cap: {room.capacity}</div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Time slot rows */}
          <div className="space-y-2">
            {timeSlots.map((slot) => (
              <div key={slot.id} className="flex">
                {/* Time label */}
                <div className="w-24 flex-shrink-0 pr-2 text-right">
                  <div className={`text-sm font-medium ${slot.isBreak ? 'text-amber-600 dark:text-amber-400' : 'text-gray-700 dark:text-gray-300'}`}>
                    {formatTime(slot.startTime, settings.timeFormat)}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {formatTime(slot.endTime, settings.timeFormat)}
                  </div>
                </div>

                {/* Break slot - spans all rooms */}
                {slot.isBreak ? (
                  <div
                    className="flex-1 px-1"
                    style={{ minWidth: `${eventConfig.rooms.length * 180}px` }}
                  >
                    <div className="h-20 bg-amber-100 dark:bg-amber-900/30 border-2 border-dashed border-amber-300 dark:border-amber-700 rounded-lg flex items-center justify-center">
                      <div className="text-center">
                        <div className="font-medium text-amber-700 dark:text-amber-300">
                          {slot.breakLabel || 'Break'}
                        </div>
                        <div className="text-xs text-amber-600 dark:text-amber-400">
                          {formatTime(slot.startTime, settings.timeFormat)} - {formatTime(slot.endTime, settings.timeFormat)}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Room cells for regular slots */
                  eventConfig.rooms.map((room) => {
                    const session = sessions.find(
                      (s) =>
                        s.day === selectedDay &&
                        s.timeSlot === slot.startTime &&
                        s.roomId === room.id
                    );

                    return (
                      <div
                        key={`${slot.id}-${room.id}`}
                        className="flex-1 min-w-[180px] px-1"
                      >
                        <DropZone
                          day={selectedDay}
                          timeSlot={slot.startTime}
                          roomId={room.id}
                          session={session}
                          hasConflict={session ? hasConflict(session.id, conflicts) : false}
                          conflicts={conflicts}
                        />
                      </div>
                    );
                  })
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
