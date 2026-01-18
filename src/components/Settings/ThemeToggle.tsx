import { useSchedulerStore } from '../../store/useSchedulerStore';

export function ThemeToggle() {
  const { settings, updateSettings } = useSchedulerStore();

  const themes = [
    { value: 'light', label: 'Light', icon: '☀️' },
    { value: 'dark', label: 'Dark', icon: '🌙' },
    { value: 'system', label: 'System', icon: '💻' },
  ] as const;

  return (
    <div>
      <h3 className="font-medium mb-3">Theme</h3>
      <div className="flex gap-2">
        {themes.map(({ value, label, icon }) => (
          <button
            key={value}
            onClick={() => updateSettings({ theme: value })}
            className={`flex-1 px-3 py-2 rounded-lg border-2 transition-colors ${
              settings.theme === value
                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30'
                : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
            }`}
          >
            <span className="block text-lg mb-1">{icon}</span>
            <span className="text-sm">{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
