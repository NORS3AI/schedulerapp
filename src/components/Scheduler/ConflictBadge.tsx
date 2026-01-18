import type { Conflict } from '../../store/types';

interface ConflictBadgeProps {
  conflicts: Conflict[];
}

export function ConflictBadge({ conflicts }: ConflictBadgeProps) {
  if (conflicts.length === 0) return null;

  const getConflictIcon = (type: Conflict['type']) => {
    switch (type) {
      case 'presenter':
        return (
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        );
      case 'room':
        return (
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        );
      case 'capacity':
        return (
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        );
    }
  };

  const getConflictColor = (type: Conflict['type']) => {
    switch (type) {
      case 'presenter':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      case 'room':
        return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
      case 'capacity':
        return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
    }
  };

  return (
    <div className="flex flex-wrap gap-1">
      {conflicts.map((conflict, index) => (
        <span
          key={index}
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${getConflictColor(
            conflict.type
          )}`}
          title={conflict.message}
        >
          {getConflictIcon(conflict.type)}
          {conflict.type === 'presenter' && 'Presenter'}
          {conflict.type === 'room' && 'Room'}
          {conflict.type === 'capacity' && 'Capacity'}
        </span>
      ))}
    </div>
  );
}
