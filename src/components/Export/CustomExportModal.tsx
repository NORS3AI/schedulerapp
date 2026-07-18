import { useState, useCallback } from 'react';
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
import { ExportField, ALL_EXPORT_FIELDS } from './exportFields';

// Default fields in default order
const DEFAULT_SELECTED_FIELDS = [
  'day',
  'timeSlot',
  'room',
  'sessionTitle',
  'presenterName',
  'duration',
  'expectedAttendees',
];

interface SortableFieldItemProps {
  field: ExportField;
  isSelected: boolean;
  onToggle: (id: string) => void;
}

function SortableFieldItem({ field, isSelected, onToggle }: SortableFieldItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: field.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-2 p-2 rounded border ${
        isSelected
          ? 'bg-primary-50 dark:bg-primary-900/30 border-primary-300 dark:border-primary-700'
          : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
      }`}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
        </svg>
      </button>
      <label className="flex items-center gap-2 flex-1 cursor-pointer">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onToggle(field.id)}
          className="w-4 h-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
        />
        <span className="text-sm">{field.label}</span>
      </label>
    </div>
  );
}

export type ExportType = 'csv' | 'pdf' | 'print';

interface CustomExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (fields: ExportField[], exportType: ExportType) => void;
}

export function CustomExportModal({ isOpen, onClose, onExport }: CustomExportModalProps) {
  const [exportType, setExportType] = useState<ExportType>('csv');
  // Track ordered list of all fields (order determines export column order)
  const [orderedFields, setOrderedFields] = useState<ExportField[]>(
    () => {
      // Start with default selected fields in order, then add remaining fields
      const defaultOrdered = DEFAULT_SELECTED_FIELDS
        .map((id) => ALL_EXPORT_FIELDS.find((f) => f.id === id)!)
        .filter(Boolean);
      const remaining = ALL_EXPORT_FIELDS.filter(
        (f) => !DEFAULT_SELECTED_FIELDS.includes(f.id)
      );
      return [...defaultOrdered, ...remaining];
    }
  );

  // Track which fields are selected for export
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    () => new Set(DEFAULT_SELECTED_FIELDS)
  );

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setOrderedFields((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  }, []);

  const handleToggle = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleSelectAll = () => {
    setSelectedIds(new Set(ALL_EXPORT_FIELDS.map((f) => f.id)));
  };

  const handleSelectNone = () => {
    setSelectedIds(new Set());
  };

  const handleExport = () => {
    // Get selected fields in the current order
    const fieldsToExport = orderedFields.filter((f) => selectedIds.has(f.id));
    onExport(fieldsToExport, exportType);
    onClose();
  };

  const getExportButtonLabel = () => {
    switch (exportType) {
      case 'csv': return 'Save as CSV';
      case 'pdf': return 'Save as PDF';
      case 'print': return 'Print';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold">Custom Export</h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Instructions */}
        <div className="px-4 py-2 bg-gray-50 dark:bg-gray-900/50 text-sm text-gray-600 dark:text-gray-400">
          Select fields to export and drag to reorder columns.
        </div>

        {/* Quick actions */}
        <div className="px-4 py-2 flex gap-2 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={handleSelectAll}
            className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
          >
            Select All
          </button>
          <button
            onClick={handleSelectNone}
            className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
          >
            Select None
          </button>
          <span className="ml-auto text-xs text-gray-500">
            {selectedIds.size} of {ALL_EXPORT_FIELDS.length} selected
          </span>
        </div>

        {/* Field list */}
        <div className="flex-1 overflow-y-auto p-4">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={orderedFields.map((f) => f.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-1">
                {orderedFields.map((field) => (
                  <SortableFieldItem
                    key={field.id}
                    field={field}
                    isSelected={selectedIds.has(field.id)}
                    onToggle={handleToggle}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>

        {/* Export Type Selection */}
        <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Export Format:</p>
          <div className="flex gap-2">
            <button
              onClick={() => setExportType('csv')}
              className={`flex-1 px-3 py-2 text-sm rounded flex items-center justify-center gap-2 ${
                exportType === 'csv'
                  ? 'bg-primary-600 text-white'
                  : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600'
              }`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              CSV
            </button>
            <button
              onClick={() => setExportType('pdf')}
              className={`flex-1 px-3 py-2 text-sm rounded flex items-center justify-center gap-2 ${
                exportType === 'pdf'
                  ? 'bg-primary-600 text-white'
                  : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600'
              }`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              PDF
            </button>
            <button
              onClick={() => setExportType('print')}
              className={`flex-1 px-3 py-2 text-sm rounded flex items-center justify-center gap-2 ${
                exportType === 'print'
                  ? 'bg-primary-600 text-white'
                  : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600'
              }`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Print
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            disabled={selectedIds.size === 0}
            className="px-4 py-2 text-sm bg-primary-600 text-white rounded hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {getExportButtonLabel()}
          </button>
        </div>
      </div>
    </div>
  );
}
