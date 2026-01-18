import { useEffect } from 'react';
import { useSchedulerStore } from '../../store/useSchedulerStore';
import { ImportStep } from './ImportStep';
import { ColumnMapper } from './ColumnMapper';
import { AvailabilitySetup } from './AvailabilitySetup';
import { EventSetup } from './EventSetup';
import { RoomSetup } from './RoomSetup';
import { TimeSlotSetup } from './TimeSlotSetup';

export function WelcomeModal() {
  const { setupStep, setSetupStep, setSetupComplete, sessions } = useSchedulerStore();

  // Allow closing with Escape if user has existing data
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && sessions.length > 0 && setupStep !== 'welcome') {
        setSetupComplete(true);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [sessions.length, setupStep, setSetupComplete]);

  const steps = [
    { key: 'welcome', label: 'Welcome' },
    { key: 'import', label: 'Import' },
    { key: 'columns', label: 'Mapping' },
    { key: 'availability', label: 'Availability' },
    { key: 'event', label: 'Event' },
    { key: 'rooms', label: 'Rooms' },
    { key: 'timeslots', label: 'Times' },
  ];

  const currentIndex = steps.findIndex((s) => s.key === setupStep);
  const canSafeClose = sessions.length > 0 && setupStep !== 'welcome';

  const handleSkipImport = () => {
    setSetupStep('event');
  };

  const handleComplete = () => {
    setSetupComplete(true);
  };

  const handleSafeClose = () => {
    if (canSafeClose) {
      setSetupComplete(true);
    }
  };

  const renderContent = () => {
    switch (setupStep) {
      case 'welcome':
        return (
          <div className="text-center py-8">
            <div className="mb-6">
              <svg
                className="w-20 h-20 mx-auto text-primary-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold mb-4">Welcome to Conference Scheduler</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
              Create your conference schedule in minutes. Import your sessions from a CSV file,
              set up rooms and time slots, then drag and drop to build your perfect schedule.
            </p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => setSetupStep('import')}
                className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium"
              >
                Get Started
              </button>
              {sessions.length > 0 && (
                <button
                  onClick={handleComplete}
                  className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 font-medium"
                >
                  Continue with Existing Data
                </button>
              )}
            </div>
          </div>
        );

      case 'import':
        return <ImportStep onNext={() => setSetupStep('columns')} onSkip={handleSkipImport} />;

      case 'columns':
        return (
          <ColumnMapper
            onNext={() => setSetupStep('availability')}
            onBack={() => setSetupStep('import')}
          />
        );

      case 'availability':
        return (
          <AvailabilitySetup
            onNext={() => setSetupStep('event')}
            onBack={() => setSetupStep('columns')}
          />
        );

      case 'event':
        return (
          <EventSetup
            onNext={() => setSetupStep('rooms')}
            onBack={() => setSetupStep('availability')}
          />
        );

      case 'rooms':
        return (
          <RoomSetup
            onNext={() => setSetupStep('timeslots')}
            onBack={() => setSetupStep('event')}
          />
        );

      case 'timeslots':
        return (
          <TimeSlotSetup
            onComplete={handleComplete}
            onBack={() => setSetupStep('rooms')}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center modal-backdrop">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col relative">
        {/* Import Wizard Title Header */}
        {setupStep !== 'welcome' && (
          <div className="bg-primary-600 py-3 px-6">
            <h1 className="text-xl font-bold text-white text-center">Import Wizard</h1>
          </div>
        )}

        {/* Safe close button - red X (only shows when not on welcome step) */}
        {canSafeClose && (
          <button
            onClick={handleSafeClose}
            className="absolute right-3 top-3 z-10 p-2 rounded-lg transition-colors text-white/80 hover:text-white hover:bg-white/20"
            title="Close and keep current data (Esc)"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}

        {/* Progress indicator */}
        {setupStep !== 'welcome' && (
          <div className="px-6 pt-4 pr-14">
            <div className="flex items-center justify-between mb-2">
              {steps.slice(1).map((step, index) => (
                <div key={step.key} className="flex items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      index < currentIndex
                        ? 'bg-primary-600 text-white'
                        : index === currentIndex - 1
                        ? 'bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-400 ring-2 ring-primary-600'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                    }`}
                  >
                    {index < currentIndex ? (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      index + 1
                    )}
                  </div>
                  {index < steps.length - 2 && (
                    <div
                      className={`w-12 h-1 mx-1 ${
                        index < currentIndex - 1
                          ? 'bg-primary-600'
                          : 'bg-gray-200 dark:bg-gray-700'
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
              {steps.slice(1).map((step) => (
                <span key={step.key} className="w-12 text-center">
                  {step.label}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">{renderContent()}</div>

        {/* Safe close hint */}
        {canSafeClose && (
          <div className="px-6 pb-4 text-center">
            <p className="text-xs text-gray-400 dark:text-gray-500">
              Press <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs">Esc</kbd> to close and keep your current data
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
