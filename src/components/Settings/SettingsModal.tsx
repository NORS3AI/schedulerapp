import { useEffect } from 'react';
import { useSchedulerStore } from '../../store/useSchedulerStore';
import { ThemeToggle } from './ThemeToggle';
import { FontSizeControl } from './FontSizeControl';
import { TimeFormatControl } from './TimeFormatControl';

interface SettingsModalProps {
  onClose: () => void;
}

export function SettingsModal({ onClose }: SettingsModalProps) {
  const { settings, updateSettings, resetAll } = useSchedulerStore();

  // Handle Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleReset = () => {
    if (window.confirm('Are you sure you want to reset all data? This cannot be undone.')) {
      resetAll();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center modal-backdrop" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold">Settings</h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-4 space-y-6 max-h-[70vh] overflow-y-auto">
          <ThemeToggle />
          <FontSizeControl />
          <TimeFormatControl />

          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <h3 className="font-medium mb-3">Display Options</h3>
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={settings.showConflicts}
                onChange={(e) => updateSettings({ showConflicts: e.target.checked })}
                className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
              />
              <span className="text-sm">Show conflict warnings</span>
            </label>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <h3 className="font-medium mb-3">Editing Options</h3>
            <div className="space-y-3">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={settings.allowEditPresenters}
                  onChange={(e) => updateSettings({ allowEditPresenters: e.target.checked })}
                  className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                />
                <span className="text-sm">Allow editing presenters and co-presenters</span>
              </label>
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={settings.allowEditSessions}
                  onChange={(e) => updateSettings({ allowEditSessions: e.target.checked })}
                  className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                />
                <span className="text-sm">Allow editing sessions</span>
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Enable these to edit or delete presenters and sessions in the Presenters modal.
              </p>
            </div>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <h3 className="font-medium mb-3 text-red-600 dark:text-red-400">Danger Zone</h3>
            <button
              onClick={handleReset}
              className="px-4 py-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 text-sm"
            >
              Reset All Data
            </button>
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              This will clear all sessions, rooms, and settings.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
