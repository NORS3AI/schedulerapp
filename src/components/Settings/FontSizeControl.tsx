import { useSchedulerStore } from '../../store/useSchedulerStore';
import type { FontSize } from '../../store/types';

export function FontSizeControl() {
  const { settings, updateSettings } = useSchedulerStore();

  const sizes: { value: FontSize; label: string; sample: string }[] = [
    { value: 'smallest', label: 'Smallest', sample: 'Aa' },
    { value: 'smaller', label: 'Smaller', sample: 'Aa' },
    { value: 'small', label: 'Small', sample: 'Aa' },
    { value: 'medium', label: 'Medium', sample: 'Aa' },
    { value: 'large', label: 'Large', sample: 'Aa' },
    { value: 'larger', label: 'Larger', sample: 'Aa' },
    { value: 'huge', label: 'Huge', sample: 'Aa' },
  ];

  const currentIndex = sizes.findIndex((s) => s.value === settings.fontSize);

  const handleDecrease = () => {
    if (currentIndex > 0) {
      updateSettings({ fontSize: sizes[currentIndex - 1].value });
    }
  };

  const handleIncrease = () => {
    if (currentIndex < sizes.length - 1) {
      updateSettings({ fontSize: sizes[currentIndex + 1].value });
    }
  };

  const getSampleSize = (value: FontSize): string => {
    switch (value) {
      case 'smallest': return 'text-xs';
      case 'smaller': return 'text-sm';
      case 'small': return 'text-base';
      case 'medium': return 'text-lg';
      case 'large': return 'text-xl';
      case 'larger': return 'text-2xl';
      case 'huge': return 'text-3xl';
    }
  };

  return (
    <div>
      <h3 className="font-medium mb-3">Font Size</h3>
      <div className="flex items-center gap-2">
        <button
          onClick={handleDecrease}
          disabled={currentIndex === 0}
          className="w-10 h-10 flex items-center justify-center rounded-lg border-2 border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Decrease font size"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
          </svg>
        </button>

        <div className="flex-1 flex items-center justify-center gap-1">
          {sizes.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => updateSettings({ fontSize: value })}
              className={`px-2 py-1 rounded text-xs transition-colors ${
                settings.fontSize === value
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
              title={label}
            >
              <span className={getSampleSize(value)}>{value === settings.fontSize ? label.charAt(0) : ''}</span>
              {value !== settings.fontSize && <span className="opacity-50">&#8226;</span>}
            </button>
          ))}
        </div>

        <button
          onClick={handleIncrease}
          disabled={currentIndex === sizes.length - 1}
          className="w-10 h-10 flex items-center justify-center rounded-lg border-2 border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Increase font size"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>

      <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-2">
        Current: {sizes[currentIndex]?.label || 'Medium'}
      </p>
      <p className="text-center text-xs text-gray-400 dark:text-gray-500 mt-1">
        PDF and Print will use medium size
      </p>
    </div>
  );
}
