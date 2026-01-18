import { useState } from 'react';
import { DndContext, closestCenter, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useSchedulerStore } from '../../store/useSchedulerStore';
import { generateId } from '../../utils/csvParser';
import type { DayConfig } from '../../store/types';

interface EventSetupProps {
  onNext: () => void;
  onBack: () => void;
}

interface SortableDayProps {
  day: DayConfig;
  onRemove: (id: string) => void;
  canRemove: boolean;
}

function SortableDay({ day, onRemove, canRemove }: SortableDayProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: day.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 px-3 py-2 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-lg"
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-primary-500 hover:text-primary-700"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
        </svg>
      </button>
      <span className="flex-1">{day.name}</span>
      {canRemove && (
        <button
          onClick={() => onRemove(day.id)}
          className="text-primary-500 hover:text-red-500 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}

export function EventSetup({ onNext, onBack }: EventSetupProps) {
  const { eventConfig, setEventName, setDays } = useSchedulerStore();

  const [name, setName] = useState(eventConfig.name);
  const [localDays, setLocalDays] = useState<DayConfig[]>(
    eventConfig.days.length > 0 ? eventConfig.days : [{ id: '1', name: 'Day 1', order: 0 }]
  );
  const [newDay, setNewDay] = useState('');

  const handleAddDay = () => {
    if (newDay.trim() && !localDays.some(d => d.name === newDay.trim())) {
      const newDayConfig: DayConfig = {
        id: generateId(),
        name: newDay.trim(),
        order: localDays.length,
      };
      setLocalDays([...localDays, newDayConfig]);
      setNewDay('');
    }
  };

  const handleRemoveDay = (id: string) => {
    if (localDays.length > 1) {
      setLocalDays(localDays.filter((d) => d.id !== id).map((d, i) => ({ ...d, order: i })));
    }
  };

  const handleQuickAdd = (count: number) => {
    const newDays = Array.from({ length: count }, (_, i) => ({
      id: generateId(),
      name: `Day ${i + 1}`,
      order: i,
    }));
    setLocalDays(newDays);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = localDays.findIndex((d) => d.id === active.id);
      const newIndex = localDays.findIndex((d) => d.id === over.id);
      const reordered = arrayMove(localDays, oldIndex, newIndex).map((d, i) => ({ ...d, order: i }));
      setLocalDays(reordered);
    }
  };

  const handleNext = () => {
    setEventName(name);
    setDays(localDays);
    onNext();
  };

  const isValid = name.trim() && localDays.length > 0;

  return (
    <div>
      <h2 className="text-xl font-bold mb-2">Event Details</h2>
      <p className="text-gray-600 dark:text-gray-400 mb-6">
        Configure your conference or event settings.
      </p>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2">
            Event Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Tech Conference 2026"
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Event Days <span className="text-red-500">*</span>
          </label>
          <div className="flex gap-2 mb-3">
            <button
              onClick={() => handleQuickAdd(1)}
              className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
            >
              1 Day
            </button>
            <button
              onClick={() => handleQuickAdd(2)}
              className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
            >
              2 Days
            </button>
            <button
              onClick={() => handleQuickAdd(3)}
              className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
            >
              3 Days
            </button>
            <button
              onClick={() => handleQuickAdd(5)}
              className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
            >
              5 Days
            </button>
          </div>

          <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={localDays.map(d => d.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-2 mb-3">
                {localDays.map((day) => (
                  <SortableDay
                    key={day.id}
                    day={day}
                    onRemove={handleRemoveDay}
                    canRemove={localDays.length > 1}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>

          <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
            Drag days to reorder them
          </p>

          <div className="flex gap-2">
            <input
              type="text"
              value={newDay}
              onChange={(e) => setNewDay(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddDay()}
              placeholder="Add custom day (e.g., Monday, Workshop Day)"
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
            <button
              onClick={handleAddDay}
              disabled={!newDay.trim()}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-600 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 disabled:opacity-50"
            >
              Add
            </button>
          </div>
        </div>
      </div>

      <div className="flex justify-between mt-8">
        <button
          onClick={onBack}
          className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
        >
          Back
        </button>
        <button
          onClick={handleNext}
          disabled={!isValid}
          className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>
    </div>
  );
}
