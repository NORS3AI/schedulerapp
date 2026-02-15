import { useState, useMemo, useCallback } from 'react';
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
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useSchedulerStore } from '../../store/useSchedulerStore';
import { generateId } from '../../utils/csvParser';
import type { TimeSlot } from '../../store/types';

interface SortableTimeSlotProps {
  slot: TimeSlot;
  formatTime: (time: string) => string;
  onToggleBreak: (id: string) => void;
  onRemove: (id: string) => void;
}

function SortableTimeSlot({ slot, formatTime, onToggleBreak, onRemove }: SortableTimeSlotProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: slot.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : 'auto',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center justify-between p-3 rounded-lg ${
        slot.isBreak
          ? 'bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800'
          : 'bg-gray-50 dark:bg-gray-700/50'
      }`}
    >
      <div className="flex items-center gap-3">
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
          </svg>
        </button>
        <span className="font-medium">
          {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
        </span>
        {slot.isBreak && (
          <span className="px-2 py-0.5 bg-amber-200 dark:bg-amber-800 text-amber-700 dark:text-amber-300 rounded text-xs">
            {slot.breakLabel || 'Break'}
          </span>
        )}
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onToggleBreak(slot.id)}
          className={`px-2 py-1 text-xs rounded transition-colors ${
            slot.isBreak
              ? 'bg-amber-500 text-white hover:bg-amber-600'
              : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 hover:bg-amber-200 dark:hover:bg-amber-900/50'
          }`}
          title={slot.isBreak ? 'Convert to session slot' : 'Mark as break'}
        >
          {slot.isBreak ? 'Break' : 'Session'}
        </button>
        <button
          onClick={() => onRemove(slot.id)}
          className="p-1 text-red-500 hover:text-red-700"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  );
}

interface TimeSlotSetupProps {
  onComplete: () => void;
  onBack: () => void;
}

export function TimeSlotSetup({ onComplete, onBack }: TimeSlotSetupProps) {
  const { eventConfig, setTimeSlots, setDayTimeSlots } = useSchedulerStore();

  // Mode: 'same' = same slots for all days, 'different' = per-day slots
  const [mode, setMode] = useState<'same' | 'different'>(() => {
    // Check if any day has custom time slots
    return eventConfig.days.some(d => d.timeSlots && d.timeSlots.length > 0) ? 'different' : 'same';
  });
  const [selectedDayId, setSelectedDayId] = useState(eventConfig.days[0]?.id || '');

  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');

  // Quick generate settings
  const [quickStartTime, setQuickStartTime] = useState('09:00');
  const [quickEndTime, setQuickEndTime] = useState('17:00');
  const [customMinutes, setCustomMinutes] = useState('50');

  // Get current time slots based on mode
  const currentTimeSlots = useMemo(() => {
    if (mode === 'same') {
      return eventConfig.timeSlots;
    } else {
      const day = eventConfig.days.find(d => d.id === selectedDayId);
      return day?.timeSlots || [];
    }
  }, [mode, selectedDayId, eventConfig.timeSlots, eventConfig.days]);

  const handleSetSlots = useCallback((slots: TimeSlot[]) => {
    if (mode === 'same') {
      setTimeSlots(slots);
    } else {
      setDayTimeSlots(selectedDayId, slots);
    }
  }, [mode, selectedDayId, setTimeSlots, setDayTimeSlots]);

  const handleAddSlot = () => {
    if (startTime && endTime && startTime < endTime) {
      const slot: TimeSlot = {
        id: generateId(),
        startTime,
        endTime,
      };
      handleSetSlots([...currentTimeSlots, slot]);
      // Auto-increment for next slot
      setStartTime(endTime);
      const [hours, mins] = endTime.split(':').map(Number);
      const newEndHours = hours + 1;
      setEndTime(`${String(newEndHours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`);
    }
  };

  const handleRemoveSlot = (id: string) => {
    handleSetSlots(currentTimeSlots.filter(s => s.id !== id));
  };

  const handleToggleBreak = (id: string) => {
    const slot = currentTimeSlots.find(s => s.id === id);
    if (!slot) return;

    if (slot.isBreak) {
      // Convert back to session slot
      handleSetSlots(currentTimeSlots.map(s =>
        s.id === id ? { ...s, isBreak: false, breakLabel: undefined } : s
      ));
    } else {
      // Prompt for break label
      const label = prompt('Enter break label (e.g., Lunch, Break, Networking):', 'Lunch');
      if (label !== null) {
        handleSetSlots(currentTimeSlots.map(s =>
          s.id === id ? { ...s, isBreak: true, breakLabel: label || 'Break' } : s
        ));
      }
    }
  };

  // Quick add break/lunch
  const [breakStartTime, setBreakStartTime] = useState('12:00');
  const [breakEndTime, setBreakEndTime] = useState('13:00');
  const [breakLabel, setBreakLabel] = useState('Lunch');

  // V1.1.4: Helper to convert time string to minutes
  const timeToMinutes = (time: string): number => {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  };

  // V1.1.4: Check overlap between two time ranges, returns overlap in minutes
  const getOverlapMinutes = (start1: string, end1: string, start2: string, end2: string): number => {
    const s1 = timeToMinutes(start1);
    const e1 = timeToMinutes(end1);
    const s2 = timeToMinutes(start2);
    const e2 = timeToMinutes(end2);
    const overlapStart = Math.max(s1, s2);
    const overlapEnd = Math.min(e1, e2);
    return Math.max(0, overlapEnd - overlapStart);
  };

  // V1.1.4: Remove slots that overlap with break by more than 45 minutes
  const removeOverlappingSlots = (slots: TimeSlot[], breakStart: string, breakEnd: string): TimeSlot[] => {
    return slots.filter(slot => {
      if (slot.isBreak) return true; // Keep existing breaks
      const overlap = getOverlapMinutes(slot.startTime, slot.endTime, breakStart, breakEnd);
      return overlap <= 45; // Keep slots with 45 minutes or less overlap
    });
  };

  const handleAddBreak = () => {
    if (breakStartTime && breakEndTime && breakStartTime < breakEndTime) {
      const newSlot: TimeSlot = {
        id: generateId(),
        startTime: breakStartTime,
        endTime: breakEndTime,
        isBreak: true,
        breakLabel: breakLabel || 'Break',
      };
      // V1.1.4: Remove slots that overlap by more than 45 minutes
      const filteredSlots = removeOverlappingSlots(currentTimeSlots, breakStartTime, breakEndTime);
      // Insert in correct position based on start time
      const newSlots = [...filteredSlots, newSlot].sort((a, b) =>
        a.startTime.localeCompare(b.startTime)
      );
      handleSetSlots(newSlots);
    }
  };

  const handleQuickAddBreak = (label: string, duration: number) => {
    // Find a gap in the schedule or add at noon
    const start = '12:00';
    const [h, m] = start.split(':').map(Number);
    const endMins = h * 60 + m + duration;
    const end = `${String(Math.floor(endMins / 60)).padStart(2, '0')}:${String(endMins % 60).padStart(2, '0')}`;

    const newSlot: TimeSlot = {
      id: generateId(),
      startTime: start,
      endTime: end,
      isBreak: true,
      breakLabel: label,
    };
    // V1.1.4: Remove slots that overlap by more than 45 minutes
    const filteredSlots = removeOverlappingSlots(currentTimeSlots, start, end);
    const newSlots = [...filteredSlots, newSlot].sort((a, b) =>
      a.startTime.localeCompare(b.startTime)
    );
    handleSetSlots(newSlots);
  };

  // Drag-and-drop sensors and handler
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = currentTimeSlots.findIndex((s) => s.id === active.id);
      const newIndex = currentTimeSlots.findIndex((s) => s.id === over.id);
      const newSlots = arrayMove(currentTimeSlots, oldIndex, newIndex);
      handleSetSlots(newSlots);
    }
  }, [currentTimeSlots, handleSetSlots]);

  const handleQuickGenerate = (duration: number) => {
    const slots: TimeSlot[] = [];
    const [startHour, startMin] = quickStartTime.split(':').map(Number);
    const [endHour, endMin] = quickEndTime.split(':').map(Number);
    const endTotalMins = endHour * 60 + endMin;

    let currentHour = startHour;
    let currentMin = startMin;

    while (currentHour * 60 + currentMin < endTotalMins) {
      const start = `${String(currentHour).padStart(2, '0')}:${String(currentMin).padStart(2, '0')}`;
      currentMin += duration;
      if (currentMin >= 60) {
        currentHour += Math.floor(currentMin / 60);
        currentMin = currentMin % 60;
      }
      const end = `${String(currentHour).padStart(2, '0')}:${String(currentMin).padStart(2, '0')}`;

      if (currentHour * 60 + currentMin <= endTotalMins) {
        slots.push({ id: generateId(), startTime: start, endTime: end });
      }
    }

    handleSetSlots(slots);
  };

  const handleCustomGenerate = () => {
    const mins = parseInt(customMinutes, 10);
    if (mins > 0 && mins <= 240) {
      handleQuickGenerate(mins);
    }
  };

  const handleCopyToAllDays = () => {
    // Copy current day's time slots to all other days
    const currentDay = eventConfig.days.find(d => d.id === selectedDayId);
    const slotsToCopy = currentDay?.timeSlots || [];

    eventConfig.days.forEach(day => {
      if (day.id !== selectedDayId) {
        // Create new slots with new IDs
        const newSlots = slotsToCopy.map(slot => ({
          ...slot,
          id: generateId(),
        }));
        setDayTimeSlots(day.id, newSlots);
      }
    });
  };

  const handleModeChange = (newMode: 'same' | 'different') => {
    if (newMode === 'different' && mode === 'same') {
      // Switching to per-day: copy global slots to all days
      eventConfig.days.forEach(day => {
        const newSlots = eventConfig.timeSlots.map(slot => ({
          ...slot,
          id: generateId(),
        }));
        setDayTimeSlots(day.id, newSlots);
      });
    } else if (newMode === 'same' && mode === 'different') {
      // Switching to same: use first day's slots as global, clear per-day
      const firstDay = eventConfig.days[0];
      if (firstDay?.timeSlots) {
        setTimeSlots(firstDay.timeSlots);
      }
      // Clear per-day slots
      eventConfig.days.forEach(day => {
        setDayTimeSlots(day.id, []);
      });
    }
    setMode(newMode);
  };

  const formatTime = (time: string) => {
    const [hours, mins] = time.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${String(mins).padStart(2, '0')} ${period}`;
  };

  // Validation: need at least one slot in all days (or global)
  const isValid = useMemo(() => {
    if (mode === 'same') {
      return eventConfig.timeSlots.length > 0;
    } else {
      return eventConfig.days.every(day => day.timeSlots && day.timeSlots.length > 0);
    }
  }, [mode, eventConfig.timeSlots, eventConfig.days]);

  return (
    <div>
      <h2 className="text-xl font-bold mb-2">Configure Time Slots</h2>
      <p className="text-gray-600 dark:text-gray-400 mb-4">
        Set up the time slots for your schedule. Sessions will be assigned to these slots.
      </p>

      {/* Mode Toggle */}
      <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium">Schedule type:</span>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="mode"
              checked={mode === 'same'}
              onChange={() => handleModeChange('same')}
              className="text-primary-600"
            />
            <span className="text-sm">Same times for all days</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="mode"
              checked={mode === 'different'}
              onChange={() => handleModeChange('different')}
              className="text-primary-600"
            />
            <span className="text-sm">Different times per day</span>
          </label>
        </div>
      </div>

      {/* Day Tabs (only show in per-day mode) */}
      {mode === 'different' && (
        <div className="mb-4">
          <div className="flex flex-wrap gap-2 mb-2">
            {eventConfig.days.map((day) => {
              const hasSlotsForDay = day.timeSlots && day.timeSlots.length > 0;
              return (
                <button
                  key={day.id}
                  onClick={() => setSelectedDayId(day.id)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    selectedDayId === day.id
                      ? 'bg-primary-600 text-white'
                      : hasSlotsForDay
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-900/50'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {day.name}
                  {hasSlotsForDay && selectedDayId !== day.id && (
                    <span className="ml-1 text-xs">({day.timeSlots!.length})</span>
                  )}
                </button>
              );
            })}
          </div>
          {currentTimeSlots.length > 0 && (
            <button
              onClick={handleCopyToAllDays}
              className="text-xs text-primary-600 dark:text-primary-400 hover:underline"
            >
              Copy these time slots to all other days
            </button>
          )}
        </div>
      )}

      <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
        <p className="text-sm font-medium mb-3">Quick Generate</p>

        {/* Time range inputs */}
        <div className="flex items-center gap-2 mb-3">
          <label className="text-xs text-gray-600 dark:text-gray-400">From:</label>
          <input
            type="time"
            value={quickStartTime}
            onChange={(e) => setQuickStartTime(e.target.value)}
            className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-sm"
          />
          <label className="text-xs text-gray-600 dark:text-gray-400">To:</label>
          <input
            type="time"
            value={quickEndTime}
            onChange={(e) => setQuickEndTime(e.target.value)}
            className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-sm"
          />
        </div>

        {/* Preset buttons */}
        <div className="flex gap-2 flex-wrap mb-3">
          <button
            onClick={() => handleQuickGenerate(15)}
            className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-600 rounded hover:bg-gray-200 dark:hover:bg-gray-500"
          >
            15 min
          </button>
          <button
            onClick={() => handleQuickGenerate(30)}
            className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-600 rounded hover:bg-gray-200 dark:hover:bg-gray-500"
          >
            30 min
          </button>
          <button
            onClick={() => handleQuickGenerate(45)}
            className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-600 rounded hover:bg-gray-200 dark:hover:bg-gray-500"
          >
            45 min
          </button>
          <button
            onClick={() => handleQuickGenerate(60)}
            className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-600 rounded hover:bg-gray-200 dark:hover:bg-gray-500"
          >
            60 min
          </button>
          <button
            onClick={() => handleQuickGenerate(90)}
            className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-600 rounded hover:bg-gray-200 dark:hover:bg-gray-500"
          >
            90 min
          </button>
        </div>

        {/* Custom minutes */}
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-600 dark:text-gray-400">Custom:</label>
          <input
            type="number"
            min="5"
            max="240"
            value={customMinutes}
            onChange={(e) => setCustomMinutes(e.target.value)}
            className="w-20 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-sm"
            placeholder="50"
          />
          <span className="text-xs text-gray-500">minutes</span>
          <button
            onClick={handleCustomGenerate}
            className="px-3 py-1 text-sm bg-primary-600 text-white rounded hover:bg-primary-700"
          >
            Generate
          </button>
        </div>
      </div>

      {/* Quick Add Break/Lunch Section */}
      <div className="mb-4 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
        <p className="text-sm font-medium mb-3 text-amber-800 dark:text-amber-200">Add Break / Lunch</p>
        <div className="flex flex-wrap gap-2 mb-3">
          <button
            onClick={() => handleQuickAddBreak('Break', 15)}
            className="px-3 py-1 text-sm bg-amber-100 dark:bg-amber-800/50 text-amber-700 dark:text-amber-300 rounded hover:bg-amber-200 dark:hover:bg-amber-800"
          >
            15 min Break
          </button>
          <button
            onClick={() => handleQuickAddBreak('Break', 30)}
            className="px-3 py-1 text-sm bg-amber-100 dark:bg-amber-800/50 text-amber-700 dark:text-amber-300 rounded hover:bg-amber-200 dark:hover:bg-amber-800"
          >
            30 min Break
          </button>
          <button
            onClick={() => handleQuickAddBreak('Lunch', 30)}
            className="px-3 py-1 text-sm bg-amber-100 dark:bg-amber-800/50 text-amber-700 dark:text-amber-300 rounded hover:bg-amber-200 dark:hover:bg-amber-800"
          >
            30 min Lunch
          </button>
          <button
            onClick={() => handleQuickAddBreak('Lunch', 60)}
            className="px-3 py-1 text-sm bg-amber-100 dark:bg-amber-800/50 text-amber-700 dark:text-amber-300 rounded hover:bg-amber-200 dark:hover:bg-amber-800"
          >
            1 hr Lunch
          </button>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <input
            type="time"
            value={breakStartTime}
            onChange={(e) => setBreakStartTime(e.target.value)}
            className="px-2 py-1 border border-amber-300 dark:border-amber-700 rounded bg-white dark:bg-gray-700 text-sm"
          />
          <span className="text-xs text-amber-700 dark:text-amber-300">to</span>
          <input
            type="time"
            value={breakEndTime}
            onChange={(e) => setBreakEndTime(e.target.value)}
            className="px-2 py-1 border border-amber-300 dark:border-amber-700 rounded bg-white dark:bg-gray-700 text-sm"
          />
          <input
            type="text"
            value={breakLabel}
            onChange={(e) => setBreakLabel(e.target.value)}
            placeholder="Label"
            className="w-24 px-2 py-1 border border-amber-300 dark:border-amber-700 rounded bg-white dark:bg-gray-700 text-sm"
          />
          <button
            onClick={handleAddBreak}
            className="px-3 py-1 text-sm bg-amber-500 text-white rounded hover:bg-amber-600"
          >
            Add
          </button>
        </div>
      </div>

      {/* Time Slots List with Drag-and-Drop Reorder */}
      <div className="space-y-2 mb-6 max-h-48 overflow-y-auto">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={currentTimeSlots.map((s) => s.id)}
            strategy={verticalListSortingStrategy}
          >
            {currentTimeSlots.map((slot) => (
              <SortableTimeSlot
                key={slot.id}
                slot={slot}
                formatTime={formatTime}
                onToggleBreak={handleToggleBreak}
                onRemove={handleRemoveSlot}
              />
            ))}
          </SortableContext>
        </DndContext>
        {currentTimeSlots.length === 0 && (
          <p className="text-gray-500 dark:text-gray-400 text-center py-4">
            No time slots added yet. Use quick generate or add manually.
          </p>
        )}
        {currentTimeSlots.length > 1 && (
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
            Drag to reorder time slots
          </p>
        )}
      </div>

      <div className="flex gap-2 mb-6">
        <div className="flex-1">
          <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
            Start Time
          </label>
          <input
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
        <div className="flex-1">
          <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
            End Time
          </label>
          <input
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
        <div className="flex items-end">
          <button
            onClick={handleAddSlot}
            disabled={!startTime || !endTime || startTime >= endTime}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
          >
            Add
          </button>
        </div>
      </div>

      {/* Validation message for per-day mode */}
      {mode === 'different' && !isValid && (
        <p className="mb-4 text-sm text-amber-600 dark:text-amber-400">
          Please add time slots for all days before completing setup.
        </p>
      )}

      <div className="flex justify-between">
        <button
          onClick={onBack}
          className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
        >
          Back
        </button>
        <button
          onClick={onComplete}
          disabled={!isValid}
          className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Complete Setup
        </button>
      </div>
    </div>
  );
}
