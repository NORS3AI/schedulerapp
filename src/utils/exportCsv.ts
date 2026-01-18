import type { Session, Room } from '../store/types';

export function exportScheduleToCsv(
  sessions: Session[],
  rooms: Room[]
): string {
  const headers = [
    'Presenter Name',
    'Presenter Email',
    'Presenter Phone',
    'Session Title',
    'Description',
    'Duration (min)',
    'Day',
    'Time Slot',
    'Room',
    'Expected Attendees',
  ];

  const rows = sessions.map((session) => {
    const room = rooms.find((r) => r.id === session.roomId);
    return [
      escapeCSV(session.presenterName),
      escapeCSV(session.presenterEmail || ''),
      escapeCSV(session.presenterPhone || ''),
      escapeCSV(session.sessionTitle),
      escapeCSV(session.description || ''),
      session.duration.toString(),
      escapeCSV(session.day || ''),
      escapeCSV(session.timeSlot || ''),
      escapeCSV(room?.name || ''),
      session.expectedAttendees?.toString() || '',
    ];
  });

  const csvContent = [
    headers.join(','),
    ...rows.map((row) => row.join(',')),
  ].join('\n');

  return csvContent;
}

function escapeCSV(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function downloadCSV(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

export function exportAndDownload(
  sessions: Session[],
  rooms: Room[],
  eventName: string
): void {
  const csv = exportScheduleToCsv(sessions, rooms);
  const date = new Date().toISOString().split('T')[0];
  const filename = `${eventName.replace(/[^a-z0-9]/gi, '_')}_schedule_${date}.csv`;
  downloadCSV(csv, filename);
}
