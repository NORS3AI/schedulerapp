import { useEffect } from 'react';

interface ShortcutsModalProps {
  onClose: () => void;
}

export function ShortcutsModal({ onClose }: ShortcutsModalProps) {
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

  const shortcuts = [
    { key: 'Ctrl + S', action: 'Export schedule as PDF' },
    { key: 'Ctrl + P', action: 'Print schedule' },
    { key: 'Ctrl + F', action: 'Focus search' },
    { key: 'Esc', action: 'Clear search / Close modal' },
    { key: '1-9', action: 'Switch to day 1-9' },
    { key: '?', action: 'Show this help' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center modal-backdrop" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold">Keyboard Shortcuts</h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-4">
          <div className="space-y-3">
            {shortcuts.map(({ key, action }) => (
              <div key={key} className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">{action}</span>
                <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-sm font-mono">
                  {key}
                </kbd>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
