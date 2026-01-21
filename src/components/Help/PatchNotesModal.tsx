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
    version: 'v1.0.8',
    date: 'January 2026',
    notes: [
      'Import Wizard: Generate breaks/lunch with drag-and-drop reorder',
      'Default class length changed to 50 minutes',
      'Unscheduled sessions section is now collapsible',
      'Auto-schedule: Select specific sessions to schedule',
      'Session Details: Description field now shows full paragraph with multiline editing',
      'Mastery level: Multi-select toggle buttons (Beginner, Intermediate, Advanced)',
      'Removed Expert mastery level option',
      'Co-Presenter: Full editing with title and company fields',
      'Presenters List: Co-presenter title/company editing',
      'PDF Export: Skips empty timeslot rows, shows breaks',
      'Print: Includes all days with landscape orientation',
    ],
  },
  {
    version: 'v1.0.7',
    date: 'January 2026',
    notes: [
      'Fixed: Add Day button now copies time slots from current day',
      'Day tabs now show empty slots count instead of filled slots',
      'Double-click on day tabs to rename days',
      'Session cards: Title/Company now on separate lines',
      'Session cards: Multiple mastery levels support (comma-separated)',
      'Removed clock icon from availability indicator on cards',
      'Added sort options for unscheduled sessions (A-Z, Class Count, Availability)',
      'Removed "Has Availability Info" tag from Presenters list',
      'Custom Export now clearly shows that field selection is for CSV only',
      'Fixed auto-schedule time matching for 60 min slots (handles 12h/24h formats)',
      'Import Wizard: Added default session duration setting (30/45/60/90 min)',
    ],
  },
  {
    version: 'v1.0.6',
    date: 'January 2026',
    notes: [
      'Fixed Co-Presenter auto-detect (now correctly detects First Name 2, Last Name 2, etc.)',
      'Session Details now fully editable (click any field to edit)',
      'Added Quick Assign for Day/Room/Time in Session Details',
      'Added Mastery Level selector dropdown',
      'Drag-and-drop day reordering on scheduler',
      'Copy breaks/lunch from one day to another',
      'Warning when deleting day with scheduled sessions',
      'Fixed duplicate days bug when adding/deleting',
    ],
  },
  {
    version: 'v1.0.5a',
    date: 'January 2026',
    notes: [
      'Attempted Co-Presenter auto-detect (First Name 2, Last Name 2, etc.) - did not work',
      'Auto-detect Breakout columns with long-form names',
      'Renamed breakout labels to cleaner format (Breakout 1 Title, etc.)',
      'Changed Unavailability to Availability with neutral styling',
      'Auto Schedule now respects availability times',
      'Custom Export now supports Print, PDF, and CSV options',
      'Disabled text selection for better UX',
    ],
  },
  {
    version: 'v1.0.5',
    date: 'January 2026',
    notes: [
      'Fixed trash icon to remove cards from schedule',
      'Added custom minute Quick Generate (9AM-5PM)',
      'Changed PDF export to use 12-hour time format',
      'Added flexible daily times per day in Import Wizard',
      'Fixed editing Rooms capacity in scheduler header',
      'Added multiple co-presenters support in Presenters list',
      'Added Low/Medium/High capacity buttons in Session Details',
      'Session Details breakout text now matches Mastery Level',
      'Added break/lunch times per day in schedule',
      'Added import merge mode (add to existing presenters)',
      'Capacity conflict quick approve with yellow dotted line',
      'Custom export with selectable/reorderable fields',
      'Fixed Print to print schedule only',
    ],
  },
  {
    version: 'v1.0.4',
    date: 'January 2026',
    notes: [
      'Initial release with core scheduling functionality',
      'CSV/Excel import with column mapping',
      'Drag-and-drop scheduling',
      'Conflict detection',
      'Auto-scheduling',
      'PDF and CSV export',
    ],
  },
];

export function PatchNotesModal({ onClose }: PatchNotesModalProps) {
  const [expandedVersions, setExpandedVersions] = useState<Record<string, boolean>>({
    'v1.0.8': true, // Latest version expanded by default
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
