import { useSchedulerStore } from '../../store/useSchedulerStore';
import type { TimeFormat } from '../../store/types';

export function TimeFormatControl() {
  const { settings, updateSettings } = useSchedulerStore();

  const formats: { value: TimeFormat; label: string; example: string }[] = [
    { value: '12h', label: '12 Hour', example: '2:30 PM' },
    { value: '24h', label: '24 Hour', example: '14:30' },
  ];

  return (
    <div>
      <h3 className="font-medium mb-3">Time Format</h3>
      <div className="flex gap-2">
        {formats.map(({ value, label, example }) => (
          <button
            key={value}
            onClick={() => updateSettings({ timeFormat: value })}
            className={`flex-1 px-4 py-3 rounded-lg border-2 transition-colors ${
              settings.timeFormat === value
                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
            }`}
          >
            <div className="font-medium">{label}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">{example}</div>
          </button>
        ))}
      </div>
      <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
        Applied to all time displays in the app
      </p>
    </div>
  );
}
