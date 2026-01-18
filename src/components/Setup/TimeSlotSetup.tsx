import { useState } from 'react';
import { useSchedulerStore } from '../../store/useSchedulerStore';
import { generateId } from '../../utils/csvParser';
import type { TimeSlot } from '../../store/types';

interface TimeSlotSetupProps {
  onComplete: () => void;
  onBack: () => void;
}

export function TimeSlotSetup({ onComplete, onBack }: TimeSlotSetupProps) {
  const { eventConfig, setTimeSlots, addTimeSlot, removeTimeSlot } = useSchedulerStore();

  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');

  const handleAddSlot = () => {
    if (startTime && endTime && startTime < endTime) {
      const slot: TimeSlot = {
        id: generateId(),
        startTime,
        endTime,
      };
      addTimeSlot(slot);
      // Auto-increment for next slot
      setStartTime(endTime);
      const [hours, mins] = endTime.split(':').map(Number);
      const newEndHours = hours + 1;
      setEndTime(`${String(newEndHours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`);
    }
  };

  const handleQuickGenerate = (duration: number) => {
    const slots: TimeSlot[] = [];
    const startHour = 9;
    const endHour = 17;

    let currentHour = startHour;
    let currentMin = 0;

    while (currentHour < endHour) {
      const start = `${String(currentHour).padStart(2, '0')}:${String(currentMin).padStart(2, '0')}`;
      currentMin += duration;
      if (currentMin >= 60) {
        currentHour += Math.floor(currentMin / 60);
        currentMin = currentMin % 60;
      }
      const end = `${String(currentHour).padStart(2, '0')}:${String(currentMin).padStart(2, '0')}`;

      if (currentHour <= endHour) {
        slots.push({ id: generateId(), startTime: start, endTime: end });
      }
    }

    setTimeSlots(slots);
  };

  const formatTime = (time: string) => {
    const [hours, mins] = time.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${String(mins).padStart(2, '0')} ${period}`;
  };

  const isValid = eventConfig.timeSlots.length > 0;

  return (
    <div>
      <h2 className="text-xl font-bold mb-2">Configure Time Slots</h2>
      <p className="text-gray-600 dark:text-gray-400 mb-6">
        Set up the time slots for your schedule. Sessions will be assigned to these slots.
      </p>

      <div className="mb-4">
        <p className="text-sm font-medium mb-2">Quick Generate (9 AM - 5 PM)</p>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => handleQuickGenerate(15)}
            className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
          >
            15 min slots
          </button>
          <button
            onClick={() => handleQuickGenerate(30)}
            className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
          >
            30 min slots
          </button>
          <button
            onClick={() => handleQuickGenerate(45)}
            className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
          >
            45 min slots
          </button>
          <button
            onClick={() => handleQuickGenerate(60)}
            className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
          >
            60 min slots
          </button>
          <button
            onClick={() => handleQuickGenerate(90)}
            className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
          >
            90 min slots
          </button>
        </div>
      </div>

      <div className="space-y-2 mb-6 max-h-48 overflow-y-auto">
        {eventConfig.timeSlots.map((slot) => (
          <div
            key={slot.id}
            className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
          >
            <span className="font-medium">
              {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
            </span>
            <button
              onClick={() => removeTimeSlot(slot.id)}
              className="p-1 text-red-500 hover:text-red-700"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        ))}
        {eventConfig.timeSlots.length === 0 && (
          <p className="text-gray-500 dark:text-gray-400 text-center py-4">
            No time slots added yet. Use quick generate or add manually.
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
