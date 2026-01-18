import { useState, useRef, useEffect, useMemo } from 'react';
import { useSchedulerStore } from '../../store/useSchedulerStore';
import { autoSchedule } from '../../utils/autoScheduler';
import { exportAndDownload } from '../../utils/exportCsv';
import { exportScheduleToPdf } from '../../utils/exportPdf';
import { detectConflicts } from '../../utils/conflictDetector';
import { SettingsModal } from '../Settings/SettingsModal';
import { HelpMenu } from '../Help/HelpMenu';
import { ExportMenu } from '../Export/ExportMenu';
import { PresenterListModal } from '../Presenters/PresenterListModal';
import { ConflictsModal } from '../Conflicts/ConflictsModal';

export function Header() {
  const {
    eventConfig,
    sessions,
    setSessions,
    setSetupComplete,
    setSetupStep,
    setEventName,
    resetSchedule,
    lastAutoScheduleState,
    setLastAutoScheduleState,
  } = useSchedulerStore();

  const [showSettings, setShowSettings] = useState(false);
  const [showPresenterList, setShowPresenterList] = useState(false);
  const [showConflicts, setShowConflicts] = useState(false);
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
    // If we have a previous state, undo to it
    if (lastAutoScheduleState) {
      setSessions(lastAutoScheduleState);
      setLastAutoScheduleState(null);
      return;
    }

    setIsAutoScheduling(true);

    // Save current state for undo
    setLastAutoScheduleState([...sessions]);

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

  const handleResetSchedule = () => {
    if (confirm('Are you sure you want to unschedule all sessions? This will not delete any data.')) {
      resetSchedule();
    }
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

  const conflicts = useMemo(
    () => detectConflicts(sessions, eventConfig.rooms),
    [sessions, eventConfig.rooms]
  );
  const conflictCount = conflicts.length;

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
            disabled={isAutoScheduling || (unscheduledCount === 0 && !lastAutoScheduleState)}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${
              lastAutoScheduleState
                ? 'bg-amber-500 text-white hover:bg-amber-600'
                : 'bg-primary-600 text-white hover:bg-primary-700'
            }`}
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
            ) : lastAutoScheduleState ? (
              <>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                </svg>
                Undo Schedule
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
            onClick={handleResetSchedule}
            disabled={sessions.filter(s => s.day && s.timeSlot && s.roomId).length === 0}
            className="px-3 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Unschedule all sessions"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Reset
          </button>

          <button
            onClick={() => setShowPresenterList(true)}
            disabled={sessions.length === 0}
            className="px-3 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            title="View all presenters"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            Presenters
          </button>

          <button
            onClick={() => setShowConflicts(true)}
            className={`px-3 py-2 rounded-lg flex items-center gap-2 ${
              conflictCount > 0
                ? 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
            title={conflictCount > 0 ? `${conflictCount} conflicts detected` : 'No conflicts'}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            Conflicts
            {conflictCount > 0 && (
              <span className="px-1.5 py-0.5 bg-red-500 text-white text-xs rounded-full min-w-[20px] text-center">
                {conflictCount}
              </span>
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
      {showPresenterList && <PresenterListModal onClose={() => setShowPresenterList(false)} />}
      {showConflicts && <ConflictsModal onClose={() => setShowConflicts(false)} />}
    </>
  );
}
