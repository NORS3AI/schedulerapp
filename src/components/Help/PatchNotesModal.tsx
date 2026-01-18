import { useEffect, useState } from 'react';

interface PatchNotesModalProps {
  onClose: () => void;
}

interface VersionNotes {
  version: string;
  date: string;
  notes: string[];
}

const patchNotes: VersionNotes[] = [
  {
    version: 'v1.0.4',
    date: 'January 2026',
    notes: [
      'Changed session remove button to trash icon',
      'Added drag-drop to unschedule sessions',
      'Fixed 24h/12h time format not updating on scheduled cards',
      'Added Reset Schedule button (unschedule all without deleting)',
      'Auto-Schedule now supports undo (click again to revert)',
      'Added Mastery Level display on session cards and Presenters modal',
      'Fixed unavailability parsing for "I will not be able to teach" pattern',
      'Added am/pm detection from "a" or "p" suffix (e.g., 2:45p)',
      'Added "Import Wizard" title header with white bold text',
      'Renamed "Columns" step to "Mapping" in wizard',
      'Updated Co-Presenter default column mappings',
      'Added auto-ignore for common spreadsheet columns',
      'Added 15-minute interval option for Quick Generate time slots',
      'Added edit/delete Co-Presenter in Presenters modal',
      'Added edit/delete Presenters with Settings toggle',
      'Made Rooms/Capacity editable directly in scheduler grid header',
      'Added +/- buttons for easier day management',
      'Added Patch Notes modal',
    ],
  },
  {
    version: 'v1.0.3',
    date: 'January 2026',
    notes: [
      'Added Availability setup step in Import Wizard',
      'Added 3 additional Presenter custom fields in column mapping',
      'Added Co-Presenter section in Presenters modal',
      'Added Conflicts button and modal in header',
      'Enabled dragging scheduled sessions between slots',
      'Fixed column mapping for Co-Presenter Title and Company',
    ],
  },
  {
    version: 'v1.0.2',
    date: 'January 2026',
    notes: [
      'Added keyboard shortcut support (S for search, Escape to close)',
      'Improved column mapping with expandable groups',
      'Added Co-Presenter Title and Company fields',
      'Added Presenter Title, Company, and Phone fields',
      'Fixed breakout field naming in column mapper',
      'Added mastery level support for breakouts',
    ],
  },
  {
    version: 'v1.0.1',
    date: 'January 2026',
    notes: [
      'Enhanced CSV import with Excel file support',
      'Added dark mode support',
      'Improved drag-and-drop reliability',
      'Added Quick Generate for time slots',
      'Fixed time format display issues',
    ],
  },
  {
    version: 'v1.0.0',
    date: 'January 2026',
    notes: [
      'Initial release',
      'CSV import with column mapping',
      'Multi-day schedule support',
      'Room and time slot management',
      'Drag-and-drop session scheduling',
      'Auto-schedule feature',
      'Conflict detection',
      'PDF and CSV export',
      'Print support',
      'Light and dark themes',
    ],
  },
];

export function PatchNotesModal({ onClose }: PatchNotesModalProps) {
  const [expandedVersions, setExpandedVersions] = useState<Record<string, boolean>>({
    'v1.0.4': true, // Latest version expanded by default
  });

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

  const toggleVersion = (version: string) => {
    setExpandedVersions((prev) => ({
      ...prev,
      [version]: !prev[version],
    }));
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center modal-backdrop"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold">Patch Notes</h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {patchNotes.map((release) => (
            <div
              key={release.version}
              className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
            >
              <button
                onClick={() => toggleVersion(release.version)}
                className="w-full px-4 py-3 flex items-center justify-between bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 text-left"
              >
                <div>
                  <span className="font-semibold text-primary-600 dark:text-primary-400">
                    {release.version}
                  </span>
                  <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                    {release.date}
                  </span>
                </div>
                <svg
                  className={`w-5 h-5 transition-transform ${
                    expandedVersions[release.version] ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {expandedVersions[release.version] && (
                <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700">
                  <ul className="space-y-2">
                    {release.notes.map((note, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <svg
                          className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-gray-700 dark:text-gray-300">{note}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-gray-200 dark:border-gray-700 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Conference Scheduler - Made by Sterling Grant, 2026
          </p>
        </div>
      </div>
    </div>
  );
}
