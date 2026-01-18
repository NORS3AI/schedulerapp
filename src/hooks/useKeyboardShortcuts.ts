import { useEffect, useCallback } from 'react';
import { useSchedulerStore } from '../store/useSchedulerStore';
import { exportScheduleToPdf } from '../utils/exportPdf';

interface KeyboardShortcutsOptions {
  onShowHelp: () => void;
  onShowSearch: () => void;
}

export function useKeyboardShortcuts({ onShowHelp, onShowSearch }: KeyboardShortcutsOptions) {
  const {
    eventConfig,
    sessions,
    setSelectedDay,
    setupComplete,
    setSearchQuery,
    selectedSessionId,
    setSelectedSessionId,
  } = useSchedulerStore();

  const handleExportPdf = useCallback(async () => {
    await exportScheduleToPdf({
      title: eventConfig.name,
      days: eventConfig.days.map(d => d.name),
      timeSlots: eventConfig.timeSlots,
      rooms: eventConfig.rooms,
      sessions,
    });
  }, [eventConfig, sessions]);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in input/textarea
      const target = e.target as HTMLElement;
      const isTyping = target.tagName === 'INPUT' ||
                       target.tagName === 'TEXTAREA' ||
                       target.isContentEditable;

      // Ctrl+S - Export to PDF (prevent browser save)
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        if (setupComplete) {
          handleExportPdf();
        }
        return;
      }

      // Ctrl+P - Print
      if (e.ctrlKey && e.key === 'p') {
        e.preventDefault();
        if (setupComplete) {
          handlePrint();
        }
        return;
      }

      // Ctrl+F - Focus search
      if (e.ctrlKey && e.key === 'f') {
        e.preventDefault();
        if (setupComplete) {
          onShowSearch();
        }
        return;
      }

      // Don't process other shortcuts if typing
      if (isTyping) return;

      // Escape - Clear search / Close modal
      if (e.key === 'Escape') {
        if (selectedSessionId) {
          setSelectedSessionId(null);
        } else {
          setSearchQuery('');
        }
        return;
      }

      // ? - Show help (Shift+/)
      if (e.key === '?' || (e.shiftKey && e.key === '/')) {
        e.preventDefault();
        onShowHelp();
        return;
      }

      // 1-9 - Switch days
      if (!e.ctrlKey && !e.altKey && !e.metaKey) {
        const num = parseInt(e.key);
        if (num >= 1 && num <= 9 && setupComplete) {
          const dayIndex = num - 1;
          if (dayIndex < eventConfig.days.length) {
            setSelectedDay(eventConfig.days[dayIndex].name);
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [
    setupComplete,
    eventConfig.days,
    selectedSessionId,
    setSelectedSessionId,
    setSelectedDay,
    setSearchQuery,
    handleExportPdf,
    handlePrint,
    onShowHelp,
    onShowSearch,
  ]);
}
