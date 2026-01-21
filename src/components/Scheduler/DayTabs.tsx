import { useCallback, useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useSchedulerStore } from '../../store/useSchedulerStore';
import { generateId } from '../../utils/csvParser';
import type { DayConfig } from '../../store/types';

interface SortableDayTabProps {
  day: DayConfig;
  isSelected: boolean;
  emptySlotCount: number;
  onClick: () => void;
  onDoubleClick: () => void;
}

function SortableDayTab({ day, isSelected, emptySlotCount, onClick, onDoubleClick }: SortableDayTabProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: day.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : 'auto',
  };

  return (
    <button
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap relative cursor-grab active:cursor-grabbing ${
        isSelected
          ? 'bg-primary-600 text-white'
          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
      }`}
      title="Double-click to rename"
    >
      {day.name}
      {emptySlotCount > 0 && (
        <span className={`ml-2 px-1.5 py-0.5 text-xs rounded-full ${
          isSelected
            ? 'bg-white/20 text-white'
            : 'bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300'
        }`}>
          {emptySlotCount}
        </span>
      )}
    </button>
  );
}

export function DayTabs() {
  const { eventConfig, selectedDay, setSelectedDay, addDay, removeDay, reorderDays, sessions, updateSession, setDayTimeSlots, updateDay } = useSchedulerStore();
  const [showCopyMenu, setShowCopyMenu] = useState(false);
  const [editingDayId, setEditingDayId] = useState<string | null>(null);
  const [editDayName, setEditDayName] = useState('');

  // Get all existing day names for duplicate checking
  const existingDayNames = new Set(eventConfig.days.map((d) => d.name.toLowerCase()));

  // Generate a unique day name
  const getUniqueDayName = () => {
    let num = eventConfig.days.length + 1;
    let name = `Day ${num}`;

    // Keep incrementing until we find a unique name
    while (existingDayNames.has(name.toLowerCase())) {
      num++;
      name = `Day ${num}`;
    }

    return name;
  };

  const handleAddDay = () => {
    const newDayName = getUniqueDayName();
    // Copy time slots from the current day (or first day) to maintain consistency
    const currentDay = eventConfig.days.find((d) => d.name === selectedDay) || eventConfig.days[0];
    const timeSlotsToCopy = currentDay?.timeSlots && currentDay.timeSlots.length > 0
      ? currentDay.timeSlots.map(ts => ({ ...ts, id: generateId() }))
      : undefined;

    const newDay: DayConfig = {
      id: generateId(),
      name: newDayName,
      order: eventConfig.days.length,
      timeSlots: timeSlotsToCopy,
    };
    addDay(newDay);
    setSelectedDay(newDay.name);
  };

  const handleRemoveDay = () => {
    if (eventConfig.days.length <= 1) return;

    const dayToRemove = eventConfig.days.find((d) => d.name === selectedDay);
    if (!dayToRemove) return;

    // Check if there are any sessions scheduled on this day
    const scheduledOnThisDay = sessions.filter(
      (s) => s.day === selectedDay && s.timeSlot && s.roomId
    );

    if (scheduledOnThisDay.length > 0) {
      const confirmed = confirm(
        `There are ${scheduledOnThisDay.length} session(s) scheduled on ${selectedDay}.\n\n` +
        `Deleting this day will unschedule these sessions and move them back to the unscheduled list.\n\n` +
        `Do you want to continue?`
      );

      if (!confirmed) return;

      // Unschedule all sessions on this day
      for (const session of scheduledOnThisDay) {
        updateSession(session.id, {
          day: undefined,
          timeSlot: undefined,
          roomId: undefined,
        });
      }
    }

    const currentIndex = eventConfig.days.findIndex((d) => d.name === selectedDay);

    removeDay(dayToRemove.id);

    // Select adjacent day
    const newIndex = Math.max(0, currentIndex - 1);
    const remainingDays = eventConfig.days.filter((d) => d.id !== dayToRemove.id);
    if (remainingDays.length > 0) {
      setSelectedDay(remainingDays[newIndex]?.name || remainingDays[0].name);
    }
  };

  // Calculate empty slots for a day (total slots - scheduled sessions)
  const getEmptySlotCount = (dayName: string) => {
    const day = eventConfig.days.find((d) => d.name === dayName);
    const daySlots = day?.timeSlots && day.timeSlots.length > 0 ? day.timeSlots : eventConfig.timeSlots;
    // Only count non-break slots
    const schedulableSlots = daySlots.filter((s) => !s.isBreak);
    const totalSlots = schedulableSlots.length * eventConfig.rooms.length;
    const scheduledCount = sessions.filter((s) => s.day === dayName && s.timeSlot && s.roomId).length;
    return Math.max(0, totalSlots - scheduledCount);
  };

  // Handle renaming a day
  const handleStartRename = (day: DayConfig) => {
    setEditingDayId(day.id);
    setEditDayName(day.name);
  };

  const handleSaveRename = () => {
    if (!editingDayId || !editDayName.trim()) {
      setEditingDayId(null);
      return;
    }
    const oldDay = eventConfig.days.find((d) => d.id === editingDayId);
    if (!oldDay) {
      setEditingDayId(null);
      return;
    }
    const newName = editDayName.trim();
    // Check for duplicate name (excluding current day)
    const isDuplicate = eventConfig.days.some(
      (d) => d.id !== editingDayId && d.name.toLowerCase() === newName.toLowerCase()
    );
    if (isDuplicate) {
      alert('A day with this name already exists.');
      return;
    }
    // Update sessions that reference the old day name
    const oldName = oldDay.name;
    sessions.forEach((session) => {
      if (session.day === oldName) {
        updateSession(session.id, { day: newName });
      }
    });
    // Update selected day if it was the renamed one
    if (selectedDay === oldName) {
      setSelectedDay(newName);
    }
    updateDay(editingDayId, { name: newName });
    setEditingDayId(null);
  };

  // Get the current day's time slots
  const getCurrentDayTimeSlots = () => {
    const currentDay = eventConfig.days.find((d) => d.name === selectedDay);
    if (currentDay?.timeSlots && currentDay.timeSlots.length > 0) {
      return currentDay.timeSlots;
    }
    return eventConfig.timeSlots;
  };

  // Get other days that have breaks/lunch defined
  const getDaysWithBreaks = () => {
    return eventConfig.days.filter((day) => {
      if (day.name === selectedDay) return false;
      const slots = day.timeSlots && day.timeSlots.length > 0 ? day.timeSlots : eventConfig.timeSlots;
      return slots.some((s) => s.isBreak);
    });
  };

  // Copy breaks from another day to current day
  const handleCopyBreaks = (sourceDayName: string) => {
    const sourceDay = eventConfig.days.find((d) => d.name === sourceDayName);
    const targetDay = eventConfig.days.find((d) => d.name === selectedDay);
    if (!sourceDay || !targetDay) return;

    const sourceSlots = sourceDay.timeSlots && sourceDay.timeSlots.length > 0 ? sourceDay.timeSlots : eventConfig.timeSlots;
    const targetSlots = getCurrentDayTimeSlots();

    // Get break slots from source
    const sourceBreaks = sourceSlots.filter((s) => s.isBreak);
    if (sourceBreaks.length === 0) return;

    // Merge: add breaks to target if they don't exist at that time
    const newSlots = [...targetSlots];
    for (const breakSlot of sourceBreaks) {
      const exists = newSlots.some((s) => s.startTime === breakSlot.startTime && s.endTime === breakSlot.endTime);
      if (!exists) {
        newSlots.push({
          ...breakSlot,
          id: generateId(),
        });
      } else {
        // Update existing slot to be a break
        const idx = newSlots.findIndex((s) => s.startTime === breakSlot.startTime && s.endTime === breakSlot.endTime);
        if (idx !== -1 && !newSlots[idx].isBreak) {
          newSlots[idx] = { ...newSlots[idx], isBreak: true, breakLabel: breakSlot.breakLabel };
        }
      }
    }

    // Sort by start time
    newSlots.sort((a, b) => a.startTime.localeCompare(b.startTime));

    setDayTimeSlots(targetDay.id, newSlots);
    setShowCopyMenu(false);
  };

  const daysWithBreaks = getDaysWithBreaks();

  // Drag-and-drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px of movement before starting drag
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Handle drag end for reordering
  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = eventConfig.days.findIndex((d) => d.id === active.id);
      const newIndex = eventConfig.days.findIndex((d) => d.id === over.id);
      const newDays = arrayMove(eventConfig.days, oldIndex, newIndex).map((d, i) => ({
        ...d,
        order: i,
      }));
      reorderDays(newDays);
    }
  }, [eventConfig.days, reorderDays]);

  return (
    <div className="flex items-center gap-1 px-4 pt-4 pb-2 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-x-auto">
      {/* Day tabs with drag-and-drop reordering */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={eventConfig.days.map((d) => d.id)}
          strategy={horizontalListSortingStrategy}
        >
          <div className="flex gap-1">
            {eventConfig.days.map((day) => (
              editingDayId === day.id ? (
                <input
                  key={day.id}
                  type="text"
                  value={editDayName}
                  onChange={(e) => setEditDayName(e.target.value)}
                  onBlur={handleSaveRename}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveRename();
                    if (e.key === 'Escape') setEditingDayId(null);
                  }}
                  className="px-3 py-2 rounded-lg font-medium border-2 border-primary-500 bg-white dark:bg-gray-700 text-sm w-24"
                  autoFocus
                />
              ) : (
                <SortableDayTab
                  key={day.id}
                  day={day}
                  isSelected={selectedDay === day.name}
                  emptySlotCount={getEmptySlotCount(day.name)}
                  onClick={() => setSelectedDay(day.name)}
                  onDoubleClick={() => handleStartRename(day)}
                />
              )
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {/* Add/Remove day buttons */}
      <div className="flex gap-1 ml-2 border-l border-gray-300 dark:border-gray-600 pl-2">
        <button
          onClick={handleAddDay}
          className="p-2 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-lg transition-colors"
          title="Add day"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
        <button
          onClick={handleRemoveDay}
          disabled={eventConfig.days.length <= 1}
          className="p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          title="Remove current day"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
          </svg>
        </button>

        {/* Copy breaks from another day */}
        {daysWithBreaks.length > 0 && (
          <div className="relative">
            <button
              onClick={() => setShowCopyMenu(!showCopyMenu)}
              className="p-2 text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/30 rounded-lg transition-colors"
              title="Copy breaks from another day"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
            </button>
            {showCopyMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowCopyMenu(false)}
                />
                <div className="absolute right-0 top-full mt-1 z-50 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 min-w-[180px]">
                  <div className="px-3 py-2 text-xs text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                    Copy breaks from:
                  </div>
                  {daysWithBreaks.map((day) => {
                    const slots = day.timeSlots && day.timeSlots.length > 0 ? day.timeSlots : eventConfig.timeSlots;
                    const breakCount = slots.filter((s) => s.isBreak).length;
                    return (
                      <button
                        key={day.id}
                        onClick={() => handleCopyBreaks(day.name)}
                        className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-between"
                      >
                        <span>{day.name}</span>
                        <span className="text-xs text-amber-600 dark:text-amber-400">
                          {breakCount} break{breakCount !== 1 ? 's' : ''}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
