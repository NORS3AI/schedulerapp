import { useState, useEffect, useMemo } from 'react';
import { useSchedulerStore } from '../../store/useSchedulerStore';

interface AvailabilitySetupProps {
  onNext: () => void;
  onBack: () => void;
}

interface DetectedAvailabilityColumn {
  header: string;
  type: 'available' | 'unavailable';
  detectedDay?: string;
  detectedDate?: string;
}

// Pattern: "THURSDAY, August 31 (Select ALL times which you would be available to teach this day.)"
const AVAILABILITY_PATTERN = /^([A-Z]+DAY),?\s+([A-Za-z]+)\s+(\d{1,2})\s*\(Select ALL times/i;

// Pattern: "I will not be able to teach Thursday, Aug. 31."
const UNAVAILABILITY_PATTERN = /I will not be able to teach\s+([A-Za-z]+day),?\s+([A-Za-z]+\.?)\s*(\d{1,2})/i;

function parseAvailabilityHeader(header: string): DetectedAvailabilityColumn | null {
  // Check for availability column
  const availMatch = header.match(AVAILABILITY_PATTERN);
  if (availMatch) {
    return {
      header,
      type: 'available',
      detectedDay: availMatch[1],
      detectedDate: `${availMatch[2]} ${availMatch[3]}`,
    };
  }

  // Check for unavailability column
  const unavailMatch = header.match(UNAVAILABILITY_PATTERN);
  if (unavailMatch) {
    return {
      header,
      type: 'unavailable',
      detectedDay: unavailMatch[1],
      detectedDate: `${unavailMatch[2]} ${unavailMatch[3]}`,
    };
  }

  return null;
}

export function AvailabilitySetup({ onNext, onBack }: AvailabilitySetupProps) {
  const { csvHeaders, rawCsvData, sessions, setSessions, columnMapping, setColumnMapping } = useSchedulerStore();

  // Detect availability columns from CSV headers
  const detectedColumns = useMemo(() => {
    const columns: DetectedAvailabilityColumn[] = [];
    for (const header of csvHeaders) {
      const parsed = parseAvailabilityHeader(header);
      if (parsed) {
        columns.push(parsed);
      }
    }
    return columns;
  }, [csvHeaders]);

  // State for mapping columns to event days
  const [columnMappings, setColumnMappings] = useState<Record<string, string>>({});
  const [selectedColumns, setSelectedColumns] = useState<Set<string>>(new Set());

  // Initialize mappings with detected days
  useEffect(() => {
    const initialMappings: Record<string, string> = {};
    const initialSelected = new Set<string>();

    for (const col of detectedColumns) {
      if (col.detectedDay) {
        initialMappings[col.header] = col.detectedDay;
        initialSelected.add(col.header);
      }
    }

    setColumnMappings(initialMappings);
    setSelectedColumns(initialSelected);
  }, [detectedColumns]);

  const handleColumnToggle = (header: string) => {
    setSelectedColumns(prev => {
      const next = new Set(prev);
      if (next.has(header)) {
        next.delete(header);
      } else {
        next.add(header);
      }
      return next;
    });
  };

  const handleDayMappingChange = (header: string, day: string) => {
    setColumnMappings(prev => ({ ...prev, [header]: day }));
  };

  const handleNext = () => {
    // Store selected availability columns in column mapping
    const availabilityColumns = Array.from(selectedColumns);
    setColumnMapping({
      ...columnMapping,
      availabilityColumns,
    });

    // Parse availability data and update sessions
    if (availabilityColumns.length > 0 && rawCsvData.length > 0) {
      const updatedSessions = sessions.map((session, index) => {
        const rowData = rawCsvData[session.sourceRowIndex ?? index];
        if (!rowData) return session;

        const unavailability = session.unavailability || [];
        const unavailabilityTexts: string[] = [];

        for (const header of availabilityColumns) {
          const col = detectedColumns.find(c => c.header === header);
          if (!col) continue;

          const cellValue = rowData[header]?.toString().trim();
          const mappedDay = columnMappings[header] || col.detectedDay || '';

          if (col.type === 'available') {
            // If this is an availability column, check if they selected times
            // If the cell is empty or indicates no selection, they're unavailable that day
            if (!cellValue || cellValue.toLowerCase() === 'n/a' || cellValue === '') {
              // Mark as unavailable for entire day
              if (mappedDay && !unavailability.some(u => u.day === mappedDay && u.timeSlot === '*')) {
                unavailability.push({ day: mappedDay, timeSlot: '*' });
              }
            } else {
              // Parse the available times - if not all slots, the remaining are unavailable
              // Store the raw text for reference
              unavailabilityTexts.push(`${mappedDay}: ${cellValue}`);
            }
          } else if (col.type === 'unavailable') {
            // If this indicates they cannot teach this day
            if (cellValue && cellValue.toLowerCase() !== 'no' && cellValue.toLowerCase() !== 'false') {
              if (mappedDay && !unavailability.some(u => u.day === mappedDay && u.timeSlot === '*')) {
                unavailability.push({ day: mappedDay, timeSlot: '*' });
                unavailabilityTexts.push(`Cannot teach ${mappedDay}`);
              }
            }
          }
        }

        return {
          ...session,
          unavailability,
          unavailabilityText: unavailabilityTexts.length > 0
            ? unavailabilityTexts.join('; ')
            : session.unavailabilityText,
        };
      });

      setSessions(updatedSessions);
    }

    onNext();
  };

  const hasAvailabilityColumns = detectedColumns.length > 0;

  return (
    <div className="max-h-[70vh] flex flex-col">
      <h2 className="text-xl font-bold mb-2">Presenter Availability</h2>
      <p className="text-gray-600 dark:text-gray-400 mb-4">
        Configure presenter availability based on your spreadsheet columns.
        Select which columns contain availability information and map them to event days.
      </p>

      <div className="flex-1 overflow-y-auto mb-4 space-y-4">
        {!hasAvailabilityColumns ? (
          <div className="p-6 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-center">
            <svg className="w-12 h-12 mx-auto mb-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <h3 className="font-medium mb-2">No Availability Columns Detected</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              We couldn't find columns matching availability patterns like:
            </p>
            <div className="text-xs text-left bg-white dark:bg-gray-800 p-3 rounded border border-gray-200 dark:border-gray-600 space-y-2">
              <p className="font-mono">"THURSDAY, August 31 (Select ALL times which you would be available to teach this day.)"</p>
              <p className="font-mono">"I will not be able to teach Thursday, Aug. 31."</p>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
              You can skip this step or manually configure unavailability later.
            </p>
          </div>
        ) : (
          <>
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <h4 className="font-medium text-blue-800 dark:text-blue-200">
                    {detectedColumns.length} availability column{detectedColumns.length !== 1 ? 's' : ''} detected
                  </h4>
                  <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                    Select which columns to use and verify the day mapping is correct.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {detectedColumns.map((col) => (
                <div
                  key={col.header}
                  className={`p-4 rounded-lg border transition-colors ${
                    selectedColumns.has(col.header)
                      ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700'
                      : 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedColumns.has(col.header)}
                        onChange={() => handleColumnToggle(col.header)}
                        className="w-4 h-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
                      />
                    </label>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-0.5 text-xs rounded ${
                          col.type === 'available'
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                            : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                        }`}>
                          {col.type === 'available' ? 'Availability' : 'Unavailability'}
                        </span>
                        {col.detectedDate && (
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            Detected: {col.detectedDate}
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-medium truncate" title={col.header}>
                        {col.header}
                      </p>
                      {selectedColumns.has(col.header) && (
                        <div className="mt-2 flex items-center gap-2">
                          <label className="text-xs text-gray-500 dark:text-gray-400">
                            Maps to day:
                          </label>
                          <input
                            type="text"
                            value={columnMappings[col.header] || ''}
                            onChange={(e) => handleDayMappingChange(col.header, e.target.value)}
                            placeholder="e.g., Day 1, Thursday"
                            className="flex-1 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Manual column selection for non-detected columns */}
        {csvHeaders.length > 0 && (
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            <button
              className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700/50 flex items-center justify-between text-left font-medium text-sm"
              onClick={(e) => {
                const content = e.currentTarget.nextElementSibling;
                if (content) {
                  content.classList.toggle('hidden');
                }
              }}
            >
              Other Columns (click to expand)
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <div className="hidden px-4 py-3 max-h-48 overflow-y-auto">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                If you have availability columns that weren't auto-detected, you can manually select them here:
              </p>
              <div className="flex flex-wrap gap-2">
                {csvHeaders
                  .filter(h => !detectedColumns.some(d => d.header === h))
                  .map((header) => (
                    <label
                      key={header}
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs cursor-pointer ${
                        selectedColumns.has(header)
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                          : 'bg-gray-100 dark:bg-gray-700'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedColumns.has(header)}
                        onChange={() => {
                          handleColumnToggle(header);
                          if (!columnMappings[header]) {
                            // Try to auto-detect from header
                            handleDayMappingChange(header, '');
                          }
                        }}
                        className="w-3 h-3"
                      />
                      <span className="truncate max-w-[200px]" title={header}>
                        {header}
                      </span>
                    </label>
                  ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={onBack}
          className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
        >
          Back
        </button>
        <button
          onClick={handleNext}
          className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          {hasAvailabilityColumns && selectedColumns.size > 0 ? 'Apply & Continue' : 'Skip & Continue'}
        </button>
      </div>
    </div>
  );
}
