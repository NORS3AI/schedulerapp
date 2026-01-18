import { useSchedulerStore } from '../../store/useSchedulerStore';

export function DayTabs() {
  const { eventConfig, selectedDay, setSelectedDay } = useSchedulerStore();

  if (eventConfig.days.length <= 1) {
    return (
      <div className="px-4 pt-4 pb-2 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <h2 className="text-lg font-semibold">{eventConfig.days[0]?.name || 'Schedule'}</h2>
      </div>
    );
  }

  return (
    <div className="flex gap-1 px-4 pt-4 pb-2 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-x-auto">
      {eventConfig.days.map((day) => (
        <button
          key={day.id}
          onClick={() => setSelectedDay(day.name)}
          className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
            selectedDay === day.name
              ? 'bg-primary-600 text-white'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
        >
          {day.name}
        </button>
      ))}
    </div>
  );
}
