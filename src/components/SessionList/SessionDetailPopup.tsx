import { useEffect, useState } from 'react';
import { useSchedulerStore } from '../../store/useSchedulerStore';
import { formatTime } from '../../utils/timeFormatter';
import { RichTextEditor, RichTextDisplay } from '../Common/RichTextEditor';
import type { MasteryLevel } from '../../store/types';

type EditingField =
  | 'sessionTitle'
  | 'description'
  | 'presenterName'
  | 'presenterEmail'
  | 'presenterPhone'
  | 'presenterTitle'
  | 'presenterCompany'
  | 'coPresenterName'
  | 'coPresenterEmail'
  | 'coPresenterPhone'
  | 'coPresenterTitle'
  | 'coPresenterCompany'
  | 'duration'
  | 'attendees'
  | null;

export function SessionDetailPopup() {
  const { sessions, eventConfig, selectedSessionId, setSelectedSessionId, updateSession, settings } = useSchedulerStore();
  const [editingField, setEditingField] = useState<EditingField>(null);
  const [editValue, setEditValue] = useState('');
  const [showQuickAssign, setShowQuickAssign] = useState(false);

  const session = sessions.find((s) => s.id === selectedSessionId);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (editingField) {
          setEditingField(null);
        } else {
          setSelectedSessionId(null);
        }
      }
    };

    if (selectedSessionId) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [selectedSessionId, setSelectedSessionId, editingField]);

  if (!session) return null;

  const room = eventConfig.rooms.find((r) => r.id === session.roomId);

  // Helper to save edited field
  const saveField = (field: EditingField, value: string) => {
    if (!field) return;

    switch (field) {
      case 'sessionTitle':
        if (value.trim()) updateSession(session.id, { sessionTitle: value.trim() });
        break;
      case 'description':
        updateSession(session.id, { description: value.trim() || undefined });
        break;
      case 'presenterName': {
        const parts = value.trim().split(' ');
        const firstName = parts[0] || '';
        const lastName = parts.slice(1).join(' ') || '';
        updateSession(session.id, {
          presenterName: value.trim(),
          presenterFirstName: firstName,
          presenterLastName: lastName,
        });
        break;
      }
      case 'presenterEmail':
        updateSession(session.id, { presenterEmail: value.trim() || undefined });
        break;
      case 'presenterPhone':
        updateSession(session.id, { presenterPhone: value.trim() || undefined });
        break;
      case 'presenterTitle':
        updateSession(session.id, { presenterTitle: value.trim() || undefined });
        break;
      case 'presenterCompany':
        updateSession(session.id, { presenterCompany: value.trim() || undefined });
        break;
      case 'coPresenterName': {
        const parts = value.trim().split(' ');
        const firstName = parts[0] || '';
        const lastName = parts.slice(1).join(' ') || '';
        updateSession(session.id, {
          coPresenterName: value.trim() || undefined,
          coPresenterFirstName: firstName || undefined,
          coPresenterLastName: lastName || undefined,
        });
        break;
      }
      case 'coPresenterEmail':
        updateSession(session.id, { coPresenterEmail: value.trim() || undefined });
        break;
      case 'coPresenterPhone':
        updateSession(session.id, { coPresenterPhone: value.trim() || undefined });
        break;
      case 'coPresenterTitle':
        updateSession(session.id, { coPresenterTitle: value.trim() || undefined });
        break;
      case 'coPresenterCompany':
        updateSession(session.id, { coPresenterCompany: value.trim() || undefined });
        break;
      case 'duration': {
        const val = parseInt(value);
        if (!isNaN(val) && val > 0) {
          updateSession(session.id, { duration: val });
        }
        break;
      }
      case 'attendees': {
        const val = parseInt(value);
        if (!isNaN(val) && val >= 0) {
          updateSession(session.id, { expectedAttendees: val || undefined });
        }
        break;
      }
    }
    setEditingField(null);
  };

  // Helper component for editable text fields
  const EditableText = ({
    field,
    value,
    placeholder,
    className = '',
    isLink = false,
    linkPrefix = '',
    multiline = false,
  }: {
    field: EditingField;
    value: string | undefined;
    placeholder: string;
    className?: string;
    isLink?: boolean;
    linkPrefix?: string;
    multiline?: boolean;
  }) => {
    if (editingField === field) {
      if (multiline) {
        return (
          <textarea
            className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-sm min-h-[100px] resize-y"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={() => saveField(field, editValue)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                setEditingField(null);
              }
              // Allow Enter for new lines, Ctrl+Enter to save
              if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                saveField(field, editValue);
              }
            }}
            autoFocus
            placeholder={placeholder}
          />
        );
      }
      return (
        <input
          type="text"
          className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-sm"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={() => saveField(field, editValue)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              saveField(field, editValue);
            } else if (e.key === 'Escape') {
              setEditingField(null);
            }
          }}
          autoFocus
        />
      );
    }

    const displayValue = value || placeholder;
    const isEmpty = !value;

    if (isLink && value) {
      return (
        <span className="flex items-center gap-1 group">
          <a
            href={`${linkPrefix}${value}`}
            className={`text-primary-600 dark:text-primary-400 ${className}`}
            onClick={(e) => e.stopPropagation()}
          >
            {displayValue}
          </a>
          <button
            onClick={() => {
              setEditValue(value || '');
              setEditingField(field);
            }}
            className="opacity-0 group-hover:opacity-100 p-0.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            title="Edit"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </button>
        </span>
      );
    }

    // For multiline fields, show the text with preserved line breaks
    if (multiline) {
      return (
        <button
          onClick={() => {
            setEditValue(value || '');
            setEditingField(field);
          }}
          className={`text-left hover:bg-gray-100 dark:hover:bg-gray-700 px-1 -mx-1 rounded transition-colors w-full ${
            isEmpty ? 'text-gray-400 dark:text-gray-500 italic' : ''
          } ${className}`}
          title="Click to edit (Ctrl+Enter to save)"
        >
          <span className="whitespace-pre-wrap">{displayValue}</span>
        </button>
      );
    }

    return (
      <button
        onClick={() => {
          setEditValue(value || '');
          setEditingField(field);
        }}
        className={`text-left hover:bg-gray-100 dark:hover:bg-gray-700 px-1 -mx-1 rounded transition-colors ${
          isEmpty ? 'text-gray-400 dark:text-gray-500 italic' : ''
        } ${className}`}
        title="Click to edit"
      >
        {displayValue}
      </button>
    );
  };

  // Quick assign handlers
  const handleQuickAssign = (day: string, roomId: string, timeSlot: string) => {
    updateSession(session.id, { day, roomId, timeSlot });
    setShowQuickAssign(false);
  };

  const handleUnschedule = () => {
    updateSession(session.id, { day: undefined, roomId: undefined, timeSlot: undefined });
  };

  // Get available time slots for selected day
  const getTimeSlotsForDay = (dayName: string) => {
    const day = eventConfig.days.find((d) => d.name === dayName);
    if (day?.timeSlots && day.timeSlots.length > 0) {
      return day.timeSlots.filter((ts) => !ts.isBreak);
    }
    return eventConfig.timeSlots.filter((ts) => !ts.isBreak);
  };

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

        <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Session Info */}
          <div>
            <EditableText
              field="sessionTitle"
              value={session.sessionTitle}
              placeholder="Session Title"
              className="font-bold text-lg block"
            />
            <div className="mt-2">
              {editingField === 'description' ? (
                <div>
                  <RichTextEditor
                    value={session.description || ''}
                    onChange={(val) => setEditValue(val)}
                    placeholder="Add description..."
                    minHeight="80px"
                  />
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => {
                        updateSession(session.id, { description: editValue || undefined });
                        setEditingField(null);
                      }}
                      className="px-3 py-1 bg-primary-600 text-white rounded text-sm hover:bg-primary-700"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingField(null)}
                      className="px-3 py-1 bg-gray-200 dark:bg-gray-600 rounded text-sm hover:bg-gray-300 dark:hover:bg-gray-500"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setEditValue(session.description || '');
                    setEditingField('description');
                  }}
                  className="text-left w-full hover:bg-gray-100 dark:hover:bg-gray-700 px-2 py-1 -mx-2 rounded transition-colors"
                  title="Click to edit (rich text)"
                >
                  {session.description ? (
                    <RichTextDisplay html={session.description} className="text-sm text-gray-600 dark:text-gray-400" />
                  ) : (
                    <span className="text-sm text-gray-400 dark:text-gray-500 italic">Add description...</span>
                  )}
                </button>
              )}
            </div>
            {/* Breakout & Mastery Level */}
            <div className="flex flex-wrap gap-2 mt-2">
              {session.breakoutNumber && (
                <span className="inline-block px-2 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded text-xs">
                  Breakout {session.breakoutNumber}
                </span>
              )}
              {/* Mastery Level Multi-Select */}
              <div className="flex items-center gap-1 flex-wrap">
                <span className="text-xs text-gray-500 dark:text-gray-400">Mastery:</span>
                {(['beginner', 'intermediate', 'advanced'] as const).map((level) => {
                  const currentLevels = session.masteryLevel ? String(session.masteryLevel).split(',').map(l => l.trim()) : [];
                  const isSelected = currentLevels.includes(level);

                  const toggleLevel = () => {
                    let newLevels: string[];
                    if (isSelected) {
                      newLevels = currentLevels.filter(l => l !== level);
                    } else {
                      newLevels = [...currentLevels, level];
                    }
                    const newValue = newLevels.length > 0 ? newLevels.join(', ') : undefined;
                    updateSession(session.id, { masteryLevel: newValue as MasteryLevel | undefined });
                  };

                  return (
                    <button
                      key={level}
                      onClick={toggleLevel}
                      className={`text-xs px-2 py-1 rounded border transition-colors capitalize ${
                        isSelected
                          ? level === 'beginner' ? 'bg-green-500 text-white border-green-500' :
                            level === 'intermediate' ? 'bg-blue-500 text-white border-blue-500' :
                            'bg-purple-500 text-white border-purple-500'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 border-gray-300 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      {level}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Presenter Info */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <h4 className="font-medium text-sm text-gray-500 dark:text-gray-400 mb-2">Presenter</h4>
            <div className="space-y-2">
              <EditableText
                field="presenterName"
                value={session.presenterName}
                placeholder="Presenter Name"
                className="font-semibold"
              />
              <p className="text-sm">
                <span className="text-gray-500 dark:text-gray-400">Title: </span>
                <EditableText
                  field="presenterTitle"
                  value={session.presenterTitle}
                  placeholder="Add title..."
                  className="text-gray-600 dark:text-gray-400"
                />
              </p>
              <p className="text-sm">
                <span className="text-gray-500 dark:text-gray-400">Company: </span>
                <EditableText
                  field="presenterCompany"
                  value={session.presenterCompany}
                  placeholder="Add company..."
                  className="text-gray-600 dark:text-gray-400"
                />
              </p>
              <p className="text-sm">
                <span className="text-gray-500 dark:text-gray-400">Phone: </span>
                <EditableText
                  field="presenterPhone"
                  value={session.presenterPhone}
                  placeholder="Add phone..."
                  isLink={!!session.presenterPhone}
                  linkPrefix="tel:"
                />
              </p>
              <p className="text-sm">
                <span className="text-gray-500 dark:text-gray-400">Email: </span>
                <EditableText
                  field="presenterEmail"
                  value={session.presenterEmail}
                  placeholder="Add email..."
                  isLink={!!session.presenterEmail}
                  linkPrefix="mailto:"
                />
              </p>
            </div>
          </div>

          {/* Co-Presenter Info - Always show to allow adding */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <h4 className="font-medium text-sm text-gray-500 dark:text-gray-400 mb-2">Co-Presenter</h4>
            <div className="space-y-2">
              <EditableText
                field="coPresenterName"
                value={session.coPresenterName}
                placeholder="Add co-presenter name..."
                className="font-semibold"
              />
              <p className="text-sm">
                <span className="text-gray-500 dark:text-gray-400">Title: </span>
                <EditableText
                  field="coPresenterTitle"
                  value={session.coPresenterTitle}
                  placeholder="Add title..."
                  className="text-gray-600 dark:text-gray-400"
                />
              </p>
              <p className="text-sm">
                <span className="text-gray-500 dark:text-gray-400">Company: </span>
                <EditableText
                  field="coPresenterCompany"
                  value={session.coPresenterCompany}
                  placeholder="Add company..."
                  className="text-gray-600 dark:text-gray-400"
                />
              </p>
              <p className="text-sm">
                <span className="text-gray-500 dark:text-gray-400">Phone: </span>
                <EditableText
                  field="coPresenterPhone"
                  value={session.coPresenterPhone}
                  placeholder="Add phone..."
                  isLink={!!session.coPresenterPhone}
                  linkPrefix="tel:"
                />
              </p>
              <p className="text-sm">
                <span className="text-gray-500 dark:text-gray-400">Email: </span>
                <EditableText
                  field="coPresenterEmail"
                  value={session.coPresenterEmail}
                  placeholder="Add email..."
                  isLink={!!session.coPresenterEmail}
                  linkPrefix="mailto:"
                />
              </p>
            </div>
          </div>

          {/* Availability Info - V1.1.4d: Clean display with bold day headers */}
          {(session.parsedAvailability || session.unavailability?.length || session.unavailabilityText) ? (
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <h4 className="font-medium text-sm text-gray-600 dark:text-gray-400 mb-2 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Availability
              </h4>
              {/* V1.1.4d: Clean display with bold day headers and times underneath */}
              {session.parsedAvailability?.dayDisplays && session.parsedAvailability.dayDisplays.length > 0 ? (
                <div className="space-y-2 bg-gray-50 dark:bg-gray-700/30 rounded-lg p-3">
                  {session.parsedAvailability.dayDisplays.map((dayDisplay, index) => (
                    <div key={index}>
                      {/* Bold day header */}
                      <p className={`font-semibold text-sm ${
                        dayDisplay.type === 'unavailable'
                          ? 'text-orange-600 dark:text-orange-400'
                          : 'text-green-600 dark:text-green-400'
                      }`}>
                        {dayDisplay.dayName}{dayDisplay.dateInfo ? `, ${dayDisplay.dateInfo}` : ''}
                      </p>
                      {/* Times underneath or unavailable message */}
                      {dayDisplay.type === 'unavailable' ? (
                        <p className="text-sm text-orange-500 dark:text-orange-400 ml-4 flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          Not available
                        </p>
                      ) : dayDisplay.timeRanges.length > 0 ? (
                        <div className="ml-4 space-y-0.5">
                          {dayDisplay.timeRanges.map((range, rIdx) => (
                            <p key={rIdx} className="text-sm text-green-600 dark:text-green-400 flex items-center gap-1">
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              {range.startDisplay} - {range.endDisplay}
                            </p>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-green-600 dark:text-green-400 ml-4 flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Available all day
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : !session.parsedAvailability && session.unavailability && session.unavailability.length > 0 ? (
                // Fallback to structured slots as tags
                <div className="flex flex-wrap gap-2">
                  {session.unavailability.map((slot, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded text-xs"
                    >
                      {slot.day} {slot.timeSlot === '*' || slot.timeSlot === 'all' ? '(all day)' : `@ ${slot.timeSlot}`}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}

          {/* Schedule Info / Quick Assign */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            {session.day && session.timeSlot && session.roomId ? (
              <>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-sm text-green-600 dark:text-green-400">Scheduled</h4>
                  <button
                    onClick={handleUnschedule}
                    className="text-xs px-2 py-1 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors"
                  >
                    Unschedule
                  </button>
                </div>
                <p className="text-sm">
                  <span className="font-medium">{session.day}</span> at{' '}
                  <span className="font-medium">{formatTime(session.timeSlot, settings.timeFormat)}</span> in{' '}
                  <span className="font-medium">{room?.name || 'Unknown Room'}</span>
                </p>
                <button
                  onClick={() => setShowQuickAssign(!showQuickAssign)}
                  className="mt-2 text-xs text-primary-600 dark:text-primary-400 hover:underline"
                >
                  {showQuickAssign ? 'Hide Quick Assign' : 'Change Assignment'}
                </button>
              </>
            ) : (
              <>
                <h4 className="font-medium text-sm text-gray-500 dark:text-gray-400 mb-2">Not Scheduled</h4>
                <button
                  onClick={() => setShowQuickAssign(!showQuickAssign)}
                  className="px-3 py-1.5 text-sm bg-primary-600 text-white rounded hover:bg-primary-700 transition-colors"
                >
                  {showQuickAssign ? 'Hide Quick Assign' : 'Quick Assign'}
                </button>
              </>
            )}

            {/* Quick Assign Panel */}
            {showQuickAssign && (
              <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg space-y-3">
                <p className="text-xs text-gray-500 dark:text-gray-400">Select Day, Room, and Time:</p>
                {eventConfig.days.map((day) => (
                  <div key={day.id} className="space-y-2">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{day.name}</p>
                    <div className="grid grid-cols-2 gap-1 text-xs">
                      {eventConfig.rooms.map((r) => (
                        <div key={r.id} className="space-y-1">
                          <p className="text-gray-500 dark:text-gray-400 truncate" title={r.name}>{r.name}</p>
                          <div className="flex flex-wrap gap-1">
                            {getTimeSlotsForDay(day.name).map((ts) => {
                              const isOccupied = sessions.some(
                                (s) => s.id !== session.id && s.day === day.name && s.timeSlot === ts.startTime && s.roomId === r.id
                              );
                              return (
                                <button
                                  key={ts.id}
                                  onClick={() => !isOccupied && handleQuickAssign(day.name, r.id, ts.startTime)}
                                  disabled={isOccupied}
                                  className={`px-1.5 py-0.5 rounded text-xs transition-colors ${
                                    isOccupied
                                      ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                                      : session.day === day.name && session.timeSlot === ts.startTime && session.roomId === r.id
                                      ? 'bg-green-500 text-white'
                                      : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-primary-100 dark:hover:bg-primary-900/30'
                                  }`}
                                  title={isOccupied ? 'Slot occupied' : `Assign to ${formatTime(ts.startTime, settings.timeFormat)}`}
                                >
                                  {formatTime(ts.startTime, settings.timeFormat)}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Duration & Attendees - Editable */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4 text-sm space-y-3">
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <span className="text-gray-500 dark:text-gray-400">Duration: </span>
                {editingField === 'duration' ? (
                  <input
                    type="number"
                    className="w-20 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-sm"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onBlur={() => saveField('duration', editValue)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') saveField('duration', editValue);
                      else if (e.key === 'Escape') setEditingField(null);
                    }}
                    autoFocus
                  />
                ) : (
                  <button
                    onClick={() => {
                      setEditValue(session.duration.toString());
                      setEditingField('duration');
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
                {editingField === 'attendees' ? (
                  <input
                    type="number"
                    className="w-20 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-sm"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onBlur={() => saveField('attendees', editValue)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') saveField('attendees', editValue);
                      else if (e.key === 'Escape') setEditingField(null);
                    }}
                    autoFocus
                  />
                ) : (
                  <button
                    onClick={() => {
                      setEditValue((session.expectedAttendees || 0).toString());
                      setEditingField('attendees');
                    }}
                    className="font-medium hover:text-primary-600 dark:hover:text-primary-400 underline decoration-dotted cursor-pointer"
                    title="Click to edit"
                  >
                    {session.expectedAttendees || 0} attendees
                  </button>
                )}
              </div>
            </div>

            {/* Capacity Indicator - Low/Medium/High */}
            <div>
              <span className="text-gray-500 dark:text-gray-400 block mb-2">Capacity Level:</span>
              <div className="flex gap-2">
                <button
                  onClick={() => updateSession(session.id, { capacityLevel: 'low' })}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    session.capacityLevel === 'low'
                      ? 'bg-green-500 text-white'
                      : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-900/50'
                  }`}
                >
                  Low
                </button>
                <button
                  onClick={() => updateSession(session.id, { capacityLevel: 'medium' })}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    session.capacityLevel === 'medium'
                      ? 'bg-orange-500 text-white'
                      : 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 hover:bg-orange-200 dark:hover:bg-orange-900/50'
                  }`}
                >
                  Medium
                </button>
                <button
                  onClick={() => updateSession(session.id, { capacityLevel: 'high' })}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    session.capacityLevel === 'high'
                      ? 'bg-red-500 text-white'
                      : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900/50'
                  }`}
                >
                  High
                </button>
              </div>
            </div>

            {/* Room Preference - V1.1.2 */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-500 dark:text-gray-400">Room Preference:</span>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={session.preferStayInRoom || false}
                    onChange={(e) => updateSession(session.id, { preferStayInRoom: e.target.checked })}
                    className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-xs text-gray-600 dark:text-gray-400">Stay in one room</span>
                </label>
              </div>
              {session.preferStayInRoom && (
                <select
                  value={session.preferredRoomId || ''}
                  onChange={(e) => updateSession(session.id, { preferredRoomId: e.target.value || undefined })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                >
                  <option value="">Any room (auto-assign)</option>
                  {eventConfig.rooms.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} (Capacity: {r.capacity})
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
