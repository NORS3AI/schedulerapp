import { useState } from 'react';
import { DndContext, closestCenter, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useSchedulerStore } from '../../store/useSchedulerStore';
import { generateId } from '../../utils/csvParser';
import type { Room } from '../../store/types';

interface RoomSetupProps {
  onNext: () => void;
  onBack: () => void;
}

interface SortableRoomProps {
  room: Room;
  onEdit: (room: Room) => void;
  onRemove: (id: string) => void;
  isEditing: boolean;
  editValues: { name: string; capacity: string };
  setEditValues: (values: { name: string; capacity: string }) => void;
  onSaveEdit: (id: string) => void;
  onCancelEdit: () => void;
}

function SortableRoom({
  room,
  onEdit,
  onRemove,
  isEditing,
  editValues,
  setEditValues,
  onSaveEdit,
  onCancelEdit,
}: SortableRoomProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: room.id,
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
      className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
        </svg>
      </button>

      {isEditing ? (
        <>
          <input
            type="text"
            value={editValues.name}
            onChange={(e) => setEditValues({ ...editValues, name: e.target.value })}
            className="flex-1 px-3 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700"
          />
          <input
            type="number"
            value={editValues.capacity}
            onChange={(e) => setEditValues({ ...editValues, capacity: e.target.value })}
            className="w-20 px-3 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700"
          />
          <button onClick={() => onSaveEdit(room.id)} className="p-1 text-green-600 hover:text-green-700">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </button>
          <button onClick={onCancelEdit} className="p-1 text-gray-500 hover:text-gray-700">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </>
      ) : (
        <>
          <span className="flex-1 font-medium">{room.name}</span>
          <span className="text-sm text-gray-500 dark:text-gray-400">Capacity: {room.capacity}</span>
          <button
            onClick={() => onEdit(room)}
            className="p-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
              />
            </svg>
          </button>
          <button onClick={() => onRemove(room.id)} className="p-1 text-red-500 hover:text-red-700">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        </>
      )}
    </div>
  );
}

export function RoomSetup({ onNext, onBack }: RoomSetupProps) {
  const { eventConfig, addRoom, updateRoom, removeRoom, reorderRooms } = useSchedulerStore();

  const [newRoom, setNewRoom] = useState({ name: '', capacity: '' });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{ name: string; capacity: string }>({
    name: '',
    capacity: '',
  });

  const handleAddRoom = () => {
    if (newRoom.name.trim()) {
      const room: Room = {
        id: generateId(),
        name: newRoom.name.trim(),
        capacity: parseInt(newRoom.capacity) || 50,
        order: eventConfig.rooms.length,
      };
      addRoom(room);
      setNewRoom({ name: '', capacity: '' });
    }
  };

  const handleStartEdit = (room: Room) => {
    setEditingId(room.id);
    setEditValues({ name: room.name, capacity: room.capacity.toString() });
  };

  const handleSaveEdit = (id: string) => {
    if (editValues.name.trim()) {
      updateRoom(id, {
        name: editValues.name.trim(),
        capacity: parseInt(editValues.capacity) || 50,
      });
    }
    setEditingId(null);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = eventConfig.rooms.findIndex((r) => r.id === active.id);
      const newIndex = eventConfig.rooms.findIndex((r) => r.id === over.id);
      const reordered = arrayMove(eventConfig.rooms, oldIndex, newIndex).map((r, i) => ({
        ...r,
        order: i,
      }));
      reorderRooms(reordered);
    }
  };

  const handleQuickAdd = () => {
    const templates = [
      { name: 'Main Hall', capacity: 200 },
      { name: 'Room A', capacity: 50 },
      { name: 'Room B', capacity: 50 },
      { name: 'Room C', capacity: 30 },
      { name: 'Workshop Room', capacity: 20 },
    ];

    templates.forEach((t, i) => {
      if (!eventConfig.rooms.find((r) => r.name === t.name)) {
        addRoom({ id: generateId(), ...t, order: eventConfig.rooms.length + i });
      }
    });
  };

  const isValid = eventConfig.rooms.length > 0;

  return (
    <div>
      <h2 className="text-xl font-bold mb-2">Configure Rooms</h2>
      <p className="text-gray-600 dark:text-gray-400 mb-6">
        Add the rooms or venues where sessions will take place. Drag to reorder.
      </p>

      <button
        onClick={handleQuickAdd}
        className="mb-4 px-4 py-2 text-sm bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
      >
        Quick Add: Sample Rooms
      </button>

      <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={eventConfig.rooms.map((r) => r.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2 mb-6 max-h-48 overflow-y-auto">
            {eventConfig.rooms.map((room) => (
              <SortableRoom
                key={room.id}
                room={room}
                onEdit={handleStartEdit}
                onRemove={removeRoom}
                isEditing={editingId === room.id}
                editValues={editValues}
                setEditValues={setEditValues}
                onSaveEdit={handleSaveEdit}
                onCancelEdit={handleCancelEdit}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <div className="flex gap-2 mb-6">
        <input
          type="text"
          value={newRoom.name}
          onChange={(e) => setNewRoom((prev) => ({ ...prev, name: e.target.value }))}
          onKeyDown={(e) => e.key === 'Enter' && handleAddRoom()}
          placeholder="Room name"
          className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        />
        <input
          type="number"
          value={newRoom.capacity}
          onChange={(e) => setNewRoom((prev) => ({ ...prev, capacity: e.target.value }))}
          onKeyDown={(e) => e.key === 'Enter' && handleAddRoom()}
          placeholder="Capacity"
          className="w-28 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        />
        <button
          onClick={handleAddRoom}
          disabled={!newRoom.name.trim()}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
        >
          Add
        </button>
      </div>

      <div className="flex justify-between">
        <button
          onClick={onBack}
          className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
        >
          Back
        </button>
        <button
          onClick={onNext}
          disabled={!isValid}
          className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>
    </div>
  );
}
