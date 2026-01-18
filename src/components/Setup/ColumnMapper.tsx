import { useState, useEffect, useMemo } from 'react';
import { useSchedulerStore } from '../../store/useSchedulerStore';
import { mapDataToSessions } from '../../utils/csvParser';
import type { ColumnMapping, ColumnMappingValue } from '../../store/types';

interface ColumnMapperProps {
  onNext: () => void;
  onBack: () => void;
}

interface FieldConfig {
  key: keyof ColumnMapping;
  label: string;
  group: string;
}

const fieldConfigs: FieldConfig[] = [
  // Presenter Info
  { key: 'presenterFirstName', label: 'First Name', group: 'Presenter' },
  { key: 'presenterLastName', label: 'Last Name', group: 'Presenter' },
  { key: 'presenterTitle', label: 'Job Title', group: 'Presenter' },
  { key: 'presenterCompany', label: 'Company / Organization', group: 'Presenter' },
  { key: 'presenterEmail', label: 'Email', group: 'Presenter' },
  { key: 'presenterPhone', label: 'Phone', group: 'Presenter' },
  { key: 'presenterCustom1', label: 'Custom Field 1', group: 'Presenter' },
  { key: 'presenterCustom2', label: 'Custom Field 2', group: 'Presenter' },
  { key: 'presenterCustom3', label: 'Custom Field 3', group: 'Presenter' },
  // Co-Presenter
  { key: 'coPresenterFirstName', label: 'First Name', group: 'Co-Presenter' },
  { key: 'coPresenterLastName', label: 'Last Name', group: 'Co-Presenter' },
  { key: 'coPresenterTitle', label: 'Job Title', group: 'Co-Presenter' },
  { key: 'coPresenterCompany', label: 'Company / Organization', group: 'Co-Presenter' },
  { key: 'coPresenterEmail', label: 'Email', group: 'Co-Presenter' },
  { key: 'coPresenterPhone', label: 'Phone', group: 'Co-Presenter' },
  // Breakout 1
  { key: 'breakout1Title', label: '(1) Breakout Topic / Title', group: 'Breakout 1' },
  { key: 'breakout1Description', label: '(1) Breakout Description', group: 'Breakout 1' },
  { key: 'breakout1MasteryLevel', label: '(1) Mastery Level', group: 'Breakout 1' },
  // Breakout 2
  { key: 'breakout2Title', label: '(2) Breakout Topic / Title', group: 'Breakout 2' },
  { key: 'breakout2Description', label: '(2) Breakout Description', group: 'Breakout 2' },
  { key: 'breakout2MasteryLevel', label: '(2) Mastery Level', group: 'Breakout 2' },
  // Breakout 3
  { key: 'breakout3Title', label: '(3) Breakout Topic / Title', group: 'Breakout 3' },
  { key: 'breakout3Description', label: '(3) Breakout Description', group: 'Breakout 3' },
  { key: 'breakout3MasteryLevel', label: '(3) Mastery Level', group: 'Breakout 3' },
  // Other
  { key: 'duration', label: 'Duration (minutes)', group: 'Other' },
  { key: 'expectedAttendees', label: 'Expected Attendees', group: 'Other' },
  { key: 'unavailableTimes', label: 'Unavailable Times', group: 'Other' },
];

// Auto-detect matching columns for breakout fields
function detectMatchingColumn(headers: string[], patterns: string[]): string | undefined {
  const lowerHeaders = headers.map(h => h.toLowerCase());
  for (const pattern of patterns) {
    const idx = lowerHeaders.findIndex(h => h.includes(pattern.toLowerCase()));
    if (idx !== -1) {
      return headers[idx];
    }
  }
  return undefined;
}

// Columns to auto-ignore (common spreadsheet columns that don't need mapping)
const autoIgnorePatterns = [
  'submission date',
  'submission time',
  'i would like to be accompanied by a co-presenter',
  'would like to be accompanied',
  'timestamp',
  'response id',
  'respondent id',
  'start time',
  'completion time',
  'edit link',
  'ip address',
];

export function ColumnMapper({ onNext, onBack }: ColumnMapperProps) {
  const { rawCsvData, csvHeaders, columnMapping, setColumnMapping, setSessions } =
    useSchedulerStore();

  const [localMapping, setLocalMapping] = useState<ColumnMapping>(columnMapping);
  const [ignoredColumns, setIgnoredColumns] = useState<string[]>(columnMapping.ignoredColumns || []);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    'Presenter': true,
    'Breakout 1': true,
  });

  const availableHeaders = csvHeaders.filter(h => !ignoredColumns.includes(h));

  // Auto-detect and set default mappings on initial load
  useEffect(() => {
    if (csvHeaders.length > 0 && Object.keys(columnMapping).length === 0) {
      const detectedMapping: ColumnMapping = {};

      // Auto-ignore columns matching patterns
      const autoIgnored: string[] = [];
      for (const header of csvHeaders) {
        const lowerHeader = header.toLowerCase();
        if (autoIgnorePatterns.some(pattern => lowerHeader.includes(pattern))) {
          autoIgnored.push(header);
        }
      }
      if (autoIgnored.length > 0) {
        setIgnoredColumns(autoIgnored);
      }

      // Detect breakout columns
      const breakout1Title = detectMatchingColumn(csvHeaders, ['breakout 1', 'session 1', 'topic 1', '(1) breakout', '(1) topic', '(1) title']);
      const breakout1Desc = detectMatchingColumn(csvHeaders, ['(1) description', 'description 1', 'breakout 1 desc']);
      const breakout1Mastery = detectMatchingColumn(csvHeaders, ['(1) mastery', '(1) level', 'mastery level 1', 'what mastery level would you consider breakout 1', 'mastery level would you consider breakout 1']);
      const breakout2Title = detectMatchingColumn(csvHeaders, ['breakout 2', 'session 2', 'topic 2', '(2) breakout', '(2) topic', '(2) title']);
      const breakout2Desc = detectMatchingColumn(csvHeaders, ['(2) description', 'description 2', 'breakout 2 desc']);
      const breakout2Mastery = detectMatchingColumn(csvHeaders, ['(2) mastery', '(2) level', 'mastery level 2', 'what mastery level would you consider breakout 2', 'mastery level would you consider breakout 2']);
      const breakout3Title = detectMatchingColumn(csvHeaders, ['breakout 3', 'session 3', 'topic 3', '(3) breakout', '(3) topic', '(3) title']);
      const breakout3Desc = detectMatchingColumn(csvHeaders, ['(3) description', 'description 3', 'breakout 3 desc']);
      const breakout3Mastery = detectMatchingColumn(csvHeaders, ['(3) mastery', '(3) level', 'mastery level 3', 'what mastery level would you consider breakout 3', 'mastery level would you consider breakout 3']);

      if (breakout1Title) detectedMapping.breakout1Title = { type: 'column', column: breakout1Title };
      if (breakout1Desc) detectedMapping.breakout1Description = { type: 'column', column: breakout1Desc };
      if (breakout1Mastery) detectedMapping.breakout1MasteryLevel = { type: 'column', column: breakout1Mastery };
      if (breakout2Title) detectedMapping.breakout2Title = { type: 'column', column: breakout2Title };
      if (breakout2Desc) detectedMapping.breakout2Description = { type: 'column', column: breakout2Desc };
      if (breakout2Mastery) detectedMapping.breakout2MasteryLevel = { type: 'column', column: breakout2Mastery };
      if (breakout3Title) detectedMapping.breakout3Title = { type: 'column', column: breakout3Title };
      if (breakout3Desc) detectedMapping.breakout3Description = { type: 'column', column: breakout3Desc };
      if (breakout3Mastery) detectedMapping.breakout3MasteryLevel = { type: 'column', column: breakout3Mastery };

      // Detect presenter columns
      const firstName = detectMatchingColumn(csvHeaders, ['first name', 'firstname', 'first']);
      const lastName = detectMatchingColumn(csvHeaders, ['last name', 'lastname', 'last']);
      const email = detectMatchingColumn(csvHeaders, ['email', 'e-mail']);
      const phone = detectMatchingColumn(csvHeaders, ['phone', 'telephone', 'cell']);
      const company = detectMatchingColumn(csvHeaders, ['company', 'organization', 'school', 'district']);
      const title = detectMatchingColumn(csvHeaders, ['title', 'job title', 'position']);

      if (firstName) detectedMapping.presenterFirstName = { type: 'column', column: firstName };
      if (lastName) detectedMapping.presenterLastName = { type: 'column', column: lastName };
      if (email) detectedMapping.presenterEmail = { type: 'column', column: email };
      if (phone) detectedMapping.presenterPhone = { type: 'column', column: phone };
      if (company) detectedMapping.presenterCompany = { type: 'column', column: company };
      if (title) detectedMapping.presenterTitle = { type: 'column', column: title };

      // Detect co-presenter columns with expanded patterns
      // Patterns: "First Name 2", "Last Name 2", "Co-Presenter Title", "Co-Presenter Company Name", "Co-Presenter Email"
      const coFirstName = detectMatchingColumn(csvHeaders, ['first name 2', 'firstname 2', 'co-presenter first', 'copresenter first', 'co presenter first']);
      const coLastName = detectMatchingColumn(csvHeaders, ['last name 2', 'lastname 2', 'co-presenter last', 'copresenter last', 'co presenter last']);
      const coTitle = detectMatchingColumn(csvHeaders, ['co-presenter title', 'copresenter title', 'title 2', 'co presenter title']);
      const coCompany = detectMatchingColumn(csvHeaders, ['co-presenter company name', 'co-presenter company', 'copresenter company', 'company 2', 'co presenter company']);
      const coEmail = detectMatchingColumn(csvHeaders, ['co-presenter email', 'copresenter email', 'email 2', 'co presenter email']);
      const coPhone = detectMatchingColumn(csvHeaders, ['co-presenter phone', 'copresenter phone', 'phone 2', 'co presenter phone']);

      if (coFirstName) detectedMapping.coPresenterFirstName = { type: 'column', column: coFirstName };
      if (coLastName) detectedMapping.coPresenterLastName = { type: 'column', column: coLastName };
      if (coTitle) detectedMapping.coPresenterTitle = { type: 'column', column: coTitle };
      if (coCompany) detectedMapping.coPresenterCompany = { type: 'column', column: coCompany };
      if (coEmail) detectedMapping.coPresenterEmail = { type: 'column', column: coEmail };
      if (coPhone) detectedMapping.coPresenterPhone = { type: 'column', column: coPhone };

      // Detect unavailability columns
      const unavailable = detectMatchingColumn(csvHeaders, ['unavailable', 'not available', 'will not be able', 'cannot attend', 'i will not be able']);
      if (unavailable) detectedMapping.unavailableTimes = { type: 'column', column: unavailable };

      if (Object.keys(detectedMapping).length > 0) {
        setLocalMapping(detectedMapping);
      }
    }
  }, [csvHeaders, columnMapping]);

  const handleMappingChange = (field: keyof ColumnMapping, value: ColumnMappingValue | undefined) => {
    setLocalMapping((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleIgnoreColumn = (column: string) => {
    setIgnoredColumns((prev) => [...prev, column]);
    // Remove this column from any mappings
    setLocalMapping((prev) => {
      const updated = { ...prev };
      for (const key of Object.keys(updated) as (keyof ColumnMapping)[]) {
        const val = updated[key] as ColumnMappingValue | undefined;
        if (val?.type === 'column' && val.column === column) {
          delete updated[key];
        }
      }
      return updated;
    });
  };

  const handleRestoreColumn = (column: string) => {
    setIgnoredColumns((prev) => prev.filter(c => c !== column));
  };

  const handleNext = () => {
    const finalMapping = { ...localMapping, ignoredColumns };
    setColumnMapping(finalMapping);
    const sessions = mapDataToSessions(rawCsvData, finalMapping);
    setSessions(sessions);
    onNext();
  };

  const toggleGroup = (group: string) => {
    setExpandedGroups(prev => ({ ...prev, [group]: !prev[group] }));
  };

  const groups = useMemo(() => {
    return [...new Set(fieldConfigs.map(f => f.group))];
  }, []);

  const renderMappingSelect = (field: FieldConfig) => {
    const currentValue = localMapping[field.key] as ColumnMappingValue | undefined;

    return (
      <div key={field.key} className="flex items-center gap-2 py-2">
        <label className="w-48 text-sm font-medium truncate" title={field.label}>
          {field.label}
        </label>
        <select
          value={currentValue?.type === 'column' ? `col:${currentValue.column}` : currentValue?.type || 'none'}
          onChange={(e) => {
            const val = e.target.value;
            if (val === 'none') {
              handleMappingChange(field.key, { type: 'none' });
            } else if (val === 'custom') {
              handleMappingChange(field.key, { type: 'custom', customValue: '' });
            } else if (val.startsWith('col:')) {
              handleMappingChange(field.key, { type: 'column', column: val.substring(4) });
            }
          }}
          className="flex-1 px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-sm"
        >
          <option value="none">&lt;none&gt;</option>
          <option value="custom">Custom Value...</option>
          <optgroup label="CSV Columns">
            {availableHeaders.map((header) => (
              <option key={header} value={`col:${header}`}>
                {header}
              </option>
            ))}
          </optgroup>
        </select>
        {currentValue?.type === 'custom' && (
          <input
            type="text"
            value={currentValue.customValue || ''}
            onChange={(e) =>
              handleMappingChange(field.key, { type: 'custom', customValue: e.target.value })
            }
            placeholder="Enter value"
            className="w-32 px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-sm"
          />
        )}
      </div>
    );
  };

  return (
    <div className="max-h-[70vh] flex flex-col">
      <h2 className="text-xl font-bold mb-2">Map Columns</h2>
      <p className="text-gray-600 dark:text-gray-400 mb-4">
        Match your CSV columns to session fields. Select &lt;none&gt; for irrelevant fields or enter custom values.
        Columns matching common patterns are auto-detected.
      </p>

      <div className="flex-1 overflow-y-auto mb-4 space-y-4">
        {groups.map((group) => (
          <div key={group} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            <button
              onClick={() => toggleGroup(group)}
              className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700/50 flex items-center justify-between text-left font-medium"
            >
              {group}
              <svg
                className={`w-4 h-4 transition-transform ${expandedGroups[group] ? 'rotate-180' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {expandedGroups[group] && (
              <div className="px-4 py-2">
                {fieldConfigs.filter(f => f.group === group).map(renderMappingSelect)}
              </div>
            )}
          </div>
        ))}

        {/* Ignored Columns */}
        {ignoredColumns.length > 0 && (
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <h3 className="font-medium mb-2 text-sm">Ignored Columns</h3>
            <div className="flex flex-wrap gap-2">
              {ignoredColumns.map((col) => (
                <span
                  key={col}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-sm"
                >
                  {col}
                  <button
                    onClick={() => handleRestoreColumn(col)}
                    className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                    title="Restore column"
                  >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Unused columns - can be deleted */}
        {availableHeaders.length > 0 && (
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <h3 className="font-medium mb-2 text-sm">Available Columns (click to ignore)</h3>
            <div className="flex flex-wrap gap-2">
              {availableHeaders.map((col) => {
                const isUsed = Object.values(localMapping).some(
                  (v) => (v as ColumnMappingValue)?.type === 'column' && (v as ColumnMappingValue)?.column === col
                );
                return (
                  <span
                    key={col}
                    className={`inline-flex items-center gap-1 px-2 py-1 rounded text-sm cursor-pointer ${
                      isUsed
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                        : 'bg-gray-100 dark:bg-gray-700 hover:bg-red-100 dark:hover:bg-red-900/30'
                    }`}
                    onClick={() => !isUsed && handleIgnoreColumn(col)}
                    title={isUsed ? 'Column is mapped' : 'Click to ignore'}
                  >
                    {col}
                    {!isUsed && (
                      <svg className="w-3 h-3 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    )}
                  </span>
                );
              })}
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
          Next
        </button>
      </div>
    </div>
  );
}
