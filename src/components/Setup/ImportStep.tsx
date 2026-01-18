import { useState, useCallback } from 'react';
import { useSchedulerStore } from '../../store/useSchedulerStore';
import { parseFile, suggestColumnMapping } from '../../utils/csvParser';

interface ImportStepProps {
  onNext: () => void;
  onSkip: () => void;
}

export function ImportStep({ onNext, onSkip }: ImportStepProps) {
  const { setRawCsvData, setCsvHeaders, setColumnMapping } = useSchedulerStore();
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleFile = useCallback(
    async (file: File) => {
      setIsLoading(true);
      setError(null);

      const result = await parseFile(file);

      if (result.errors.length > 0) {
        setError(result.errors[0]);
        setIsLoading(false);
        return;
      }

      if (result.data.length === 0) {
        setError('No data found in file');
        setIsLoading(false);
        return;
      }

      setRawCsvData(result.data);
      setCsvHeaders(result.headers);
      setColumnMapping(suggestColumnMapping(result.headers));
      setIsLoading(false);
      onNext();
    },
    [setRawCsvData, setCsvHeaders, setColumnMapping, onNext]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const file = e.dataTransfer.files[0];
      if (file) {
        handleFile(file);
      }
    },
    [handleFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleFile(file);
      }
    },
    [handleFile]
  );

  return (
    <div>
      <h2 className="text-xl font-bold mb-2">Import Sessions</h2>
      <p className="text-gray-600 dark:text-gray-400 mb-6">
        Upload a CSV or Excel file with your session data. Each row should represent one session.
      </p>

      <div
        className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors ${
          isDragging
            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
            : 'border-gray-300 dark:border-gray-600 hover:border-primary-400'
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        {isLoading ? (
          <div className="flex flex-col items-center">
            <svg className="animate-spin h-10 w-10 text-primary-500 mb-4" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <p className="text-gray-500 dark:text-gray-400">Processing file...</p>
          </div>
        ) : (
          <>
            <svg
              className="w-12 h-12 mx-auto text-gray-400 mb-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Drag and drop your file here, or{' '}
              <label className="text-primary-600 dark:text-primary-400 hover:underline cursor-pointer">
                browse
                <input
                  type="file"
                  className="hidden"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileInput}
                />
              </label>
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500">
              Supports CSV, XLS, and XLSX files
            </p>
          </>
        )}
      </div>

      {error && (
        <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg">
          {error}
        </div>
      )}

      <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
        <h3 className="font-medium mb-2">Expected CSV Format</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
          Your file should have headers. Common column names will be auto-detected:
        </p>
        <ul className="text-sm text-gray-500 dark:text-gray-400 list-disc list-inside">
          <li>Presenter/Speaker name</li>
          <li>Session/Presentation title</li>
          <li>Duration (in minutes)</li>
          <li>Description (optional)</li>
          <li>Expected attendees (optional)</li>
        </ul>
      </div>

      <div className="flex justify-between mt-6">
        <button
          onClick={onSkip}
          className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
        >
          Skip - Enter sessions manually
        </button>
      </div>
    </div>
  );
}
