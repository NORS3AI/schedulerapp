import { useEffect, useState } from 'react';
import { useSchedulerStore } from '../../store/useSchedulerStore';
import { formatTime } from '../../utils/timeFormatter';

export function SessionDetailPopup() {
  const { sessions, eventConfig, selectedSessionId, setSelectedSessionId, updateSession, settings } = useSchedulerStore();
  const [editingDuration, setEditingDuration] = useState(false);
  const [editingAttendees, setEditingAttendees] = useState(false);
  const [durationValue, setDurationValue] = useState('');

  const session = sessions.find((s) => s.id === selectedSessionId);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedSessionId(null);
      }
    };

    if (selectedSessionId) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [selectedSessionId, setSelectedSessionId]);

  if (!session) return null;

  const room = eventConfig.rooms.find((r) => r.id === session.roomId);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center modal-backdrop"
      onClick={() => setSelectedSessionId(null)}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-primary-50 dark:bg-primary-900/20">
          <h2 className="text-lg font-semibold">Session Details</h2>
          <button
            onClick={() => setSelectedSessionId(null)}
            className="p-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Session Info */}
          <div>
            <h3 className="font-bold text-lg">{session.sessionTitle}</h3>
            {session.description && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{session.description}</p>
            )}
            {session.breakoutNumber && (
              <span className="inline-block mt-2 px-2 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded text-xs">
                Breakout Session {session.breakoutNumber}
              </span>
            )}
          </div>

          {/* Presenter Info */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <h4 className="font-medium text-sm text-gray-500 dark:text-gray-400 mb-2">Presenter</h4>
            <div className="space-y-2">
              <p className="font-semibold">{session.presenterName}</p>
              {session.presenterTitle && (
                <p className="text-sm text-gray-600 dark:text-gray-400">{session.presenterTitle}</p>
              )}
              {session.presenterCompany && (
                <p className="text-sm text-gray-600 dark:text-gray-400">{session.presenterCompany}</p>
              )}
              {session.presenterPhone && (
                <p className="text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Phone: </span>
                  <a href={`tel:${session.presenterPhone}`} className="text-primary-600 dark:text-primary-400">
                    {session.presenterPhone}
                  </a>
                </p>
              )}
              {session.presenterEmail && (
                <p className="text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Email: </span>
                  <a href={`mailto:${session.presenterEmail}`} className="text-primary-600 dark:text-primary-400">
                    {session.presenterEmail}
                  </a>
                </p>
              )}
            </div>
          </div>

          {/* Co-Presenter Info */}
          {session.coPresenterName && (
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <h4 className="font-medium text-sm text-gray-500 dark:text-gray-400 mb-2">Co-Presenter</h4>
              <div className="space-y-2">
                <p className="font-semibold">{session.coPresenterName}</p>
                {session.coPresenterPhone && (
                  <p className="text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Phone: </span>
                    <a href={`tel:${session.coPresenterPhone}`} className="text-primary-600 dark:text-primary-400">
                      {session.coPresenterPhone}
                    </a>
                  </p>
                )}
                {session.coPresenterEmail && (
                  <p className="text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Email: </span>
                    <a href={`mailto:${session.coPresenterEmail}`} className="text-primary-600 dark:text-primary-400">
                      {session.coPresenterEmail}
                    </a>
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Unavailability */}
          {session.unavailability && session.unavailability.length > 0 && (
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <h4 className="font-medium text-sm text-amber-600 dark:text-amber-400 mb-2 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Unavailable Times
              </h4>
              <div className="flex flex-wrap gap-2">
                {session.unavailability.map((slot, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded text-xs"
                  >
                    {slot.day} @ {slot.timeSlot}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Schedule Info */}
          {session.day && session.timeSlot && session.roomId && (
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <h4 className="font-medium text-sm text-green-600 dark:text-green-400 mb-2">Scheduled</h4>
              <p className="text-sm">
                <span className="font-medium">{session.day}</span> at{' '}
                <span className="font-medium">{formatTime(session.timeSlot, settings.timeFormat)}</span> in{' '}
                <span className="font-medium">{room?.name || 'Unknown Room'}</span>
              </p>
            </div>
          )}

          {/* Duration & Attendees - Editable */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4 flex gap-4 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-gray-500 dark:text-gray-400">Duration: </span>
              {editingDuration ? (
                <input
                  type="number"
                  className="w-20 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-sm"
                  value={durationValue}
                  onChange={(e) => setDurationValue(e.target.value)}
                  onBlur={() => {
                    const val = parseInt(durationValue);
                    if (!isNaN(val) && val > 0) {
                      updateSession(session.id, { duration: val });
                    }
                    setEditingDuration(false);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const val = parseInt(durationValue);
                      if (!isNaN(val) && val > 0) {
                        updateSession(session.id, { duration: val });
                      }
                      setEditingDuration(false);
                    } else if (e.key === 'Escape') {
                      setEditingDuration(false);
                    }
                  }}
                  autoFocus
                />
              ) : (
                <button
                  onClick={() => {
                    setDurationValue(session.duration.toString());
                    setEditingDuration(true);
                  }}
                  className="font-medium hover:text-primary-600 dark:hover:text-primary-400 underline decoration-dotted cursor-pointer"
                  title="Click to edit"
                >
                  {session.duration} minutes
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-500 dark:text-gray-400">Expected: </span>
              {editingAttendees ? (
                <input
                  type="number"
                  className="w-20 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-sm"
                  value={durationValue}
                  onChange={(e) => setDurationValue(e.target.value)}
                  onBlur={() => {
                    const val = parseInt(durationValue);
                    if (!isNaN(val) && val >= 0) {
                      updateSession(session.id, { expectedAttendees: val || undefined });
                    }
                    setEditingAttendees(false);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const val = parseInt(durationValue);
                      if (!isNaN(val) && val >= 0) {
                        updateSession(session.id, { expectedAttendees: val || undefined });
                      }
                      setEditingAttendees(false);
                    } else if (e.key === 'Escape') {
                      setEditingAttendees(false);
                    }
                  }}
                  autoFocus
                />
              ) : (
                <button
                  onClick={() => {
                    setDurationValue((session.expectedAttendees || 0).toString());
                    setEditingAttendees(true);
                  }}
                  className="font-medium hover:text-primary-600 dark:hover:text-primary-400 underline decoration-dotted cursor-pointer"
                  title="Click to edit"
                >
                  {session.expectedAttendees || 0} attendees
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
