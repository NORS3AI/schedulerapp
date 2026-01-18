import { useMemo } from 'react';
import { useSchedulerStore } from '../../store/useSchedulerStore';
import { DayTabs } from './DayTabs';
import { DropZone } from './DropZone';
import { detectConflicts, hasConflict } from '../../utils/conflictDetector';

export function SchedulerGrid() {
  const { sessions, eventConfig, selectedDay, settings } = useSchedulerStore();

  const conflicts = useMemo(() => {
    if (!settings.showConflicts) return [];
    return detectConflicts(sessions, eventConfig.rooms);
  }, [sessions, eventConfig.rooms, settings.showConflicts]);

  const formatTime = (time: string) => {
    const [hours, mins] = time.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${String(mins).padStart(2, '0')} ${period}`;
  };

  if (eventConfig.rooms.length === 0 || eventConfig.timeSlots.length === 0) {
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
            {eventConfig.rooms.length === 0 && eventConfig.timeSlots.length === 0 && 'and '}
            {eventConfig.timeSlots.length === 0 && 'add time slots '}
            to start scheduling sessions.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900" id="scheduler-grid">
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
                <div className="bg-primary-600 text-white rounded-t-lg py-2 px-3">
                  <div className="font-medium">{room.name}</div>
                  <div className="text-xs opacity-80">Cap: {room.capacity}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Time slot rows */}
          <div className="space-y-2">
            {eventConfig.timeSlots.map((slot) => (
              <div key={slot.id} className="flex">
                {/* Time label */}
                <div className="w-24 flex-shrink-0 pr-2 text-right">
                  <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {formatTime(slot.startTime)}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {formatTime(slot.endTime)}
                  </div>
                </div>

                {/* Room cells */}
                {eventConfig.rooms.map((room) => {
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
                      />
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
