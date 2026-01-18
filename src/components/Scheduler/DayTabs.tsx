import { useSchedulerStore } from '../../store/useSchedulerStore';
import { generateId } from '../../utils/csvParser';

export function DayTabs() {
  const { eventConfig, selectedDay, setSelectedDay, addDay, removeDay } = useSchedulerStore();

  const handleAddDay = () => {
    const nextNumber = eventConfig.days.length + 1;
    const newDay = {
      id: generateId(),
      name: `Day ${nextNumber}`,
      order: eventConfig.days.length,
    };
    addDay(newDay);
    setSelectedDay(newDay.name);
  };

  const handleRemoveDay = () => {
    if (eventConfig.days.length <= 1) return;

    const currentIndex = eventConfig.days.findIndex((d) => d.name === selectedDay);
    const dayToRemove = eventConfig.days.find((d) => d.name === selectedDay);

    if (dayToRemove) {
      removeDay(dayToRemove.id);
      // Select adjacent day
      const newIndex = Math.max(0, currentIndex - 1);
      const remainingDays = eventConfig.days.filter((d) => d.id !== dayToRemove.id);
      if (remainingDays.length > 0) {
        setSelectedDay(remainingDays[newIndex]?.name || remainingDays[0].name);
      }
    }
  };

  return (
    <div className="flex items-center gap-1 px-4 pt-4 pb-2 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-x-auto">
      {/* Day tabs */}
      <div className="flex gap-1">
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

      {/* Add/Remove day buttons */}
      <div className="flex gap-1 ml-2 border-l border-gray-300 dark:border-gray-600 pl-2">
        <button
          onClick={handleAddDay}
          className="p-2 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-lg transition-colors"
          title="Add day"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
        <button
          onClick={handleRemoveDay}
          disabled={eventConfig.days.length <= 1}
          className="p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          title="Remove current day"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
          </svg>
        </button>
      </div>
    </div>
  );
}
