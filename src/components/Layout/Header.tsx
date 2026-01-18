import { useState, useRef, useEffect } from 'react';
import { useSchedulerStore } from '../../store/useSchedulerStore';
import { autoSchedule } from '../../utils/autoScheduler';
import { exportAndDownload } from '../../utils/exportCsv';
import { exportScheduleToPdf } from '../../utils/exportPdf';
import { SettingsModal } from '../Settings/SettingsModal';
import { HelpMenu } from '../Help/HelpMenu';
import { ExportMenu } from '../Export/ExportMenu';

export function Header() {
  const {
    eventConfig,
    sessions,
    setSessions,
    setSetupComplete,
    setSetupStep,
    setEventName,
  } = useSchedulerStore();

  const [showSettings, setShowSettings] = useState(false);
  const [isAutoScheduling, setIsAutoScheduling] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState(eventConfig.name);
  const titleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [isEditingTitle]);

  const handleAutoSchedule = () => {
    setIsAutoScheduling(true);

    // Use setTimeout to allow UI to update
    setTimeout(() => {
      const result = autoSchedule(
        sessions,
        eventConfig.rooms,
        eventConfig.days,
        eventConfig.timeSlots
      );
      setSessions(result.scheduledSessions);
      setIsAutoScheduling(false);
      alert(result.message);
    }, 100);
  };

  const handleImport = () => {
    setSetupStep('import');
    setSetupComplete(false);
  };

  const handleExportCsv = () => {
    exportAndDownload(sessions, eventConfig.rooms, eventConfig.name);
  };

  const handleExportPdf = async () => {
    await exportScheduleToPdf({
      title: eventConfig.name,
      days: eventConfig.days.map(d => d.name),
      timeSlots: eventConfig.timeSlots,
      rooms: eventConfig.rooms,
      sessions,
    });
  };

  const handlePrint = () => {
    window.print();
  };

  const handleTitleClick = () => {
    setEditedTitle(eventConfig.name);
    setIsEditingTitle(true);
  };

  const handleTitleSave = () => {
    if (editedTitle.trim()) {
      setEventName(editedTitle.trim());
    }
    setIsEditingTitle(false);
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleTitleSave();
    } else if (e.key === 'Escape') {
      setIsEditingTitle(false);
    }
  };

  const unscheduledCount = sessions.filter(
    (s) => !s.day || !s.timeSlot || !s.roomId
  ).length;

  return (
    <>
      <header className="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-4 no-print">
        <div className="flex items-center gap-4">
          {isEditingTitle ? (
            <input
              ref={titleInputRef}
              type="text"
              value={editedTitle}
              onChange={(e) => setEditedTitle(e.target.value)}
              onBlur={handleTitleSave}
              onKeyDown={handleTitleKeyDown}
              className="text-xl font-bold text-primary-600 dark:text-primary-400 bg-transparent border-b-2 border-primary-500 focus:outline-none px-1"
            />
          ) : (
            <h1
              onClick={handleTitleClick}
              className="text-xl font-bold text-primary-600 dark:text-primary-400 cursor-pointer hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
              title="Click to edit"
            >
              {eventConfig.name || 'Conference Scheduler'}
            </h1>
          )}
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {sessions.length} sessions
            {unscheduledCount > 0 && (
              <span className="text-amber-600 dark:text-amber-400 ml-2">
                ({unscheduledCount} unscheduled)
              </span>
            )}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleAutoSchedule}
            disabled={isAutoScheduling || unscheduledCount === 0}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isAutoScheduling ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
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
                Scheduling...
              </>
            ) : (
              <>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Auto-Schedule
              </>
            )}
          </button>

          <button
            onClick={handleImport}
            className="px-3 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg flex items-center gap-2"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            Import
          </button>

          <ExportMenu
            onExportCsv={handleExportCsv}
            onExportPdf={handleExportPdf}
            onPrint={handlePrint}
          />

          <button
            onClick={() => setShowSettings(true)}
            className="p-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            title="Settings"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>

          <HelpMenu />
        </div>
      </header>

      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
    </>
  );
}
