import type { Session, Room } from '../store/types';
import type { ExportField } from '../components/Export/CustomExportModal';

// Get field value from session
function getFieldValue(session: Session, key: string, rooms: Room[]): string {
  switch (key) {
    case 'day':
      return session.day || '';
    case 'timeSlot':
      return session.timeSlot || '';
    case 'room':
      const room = rooms.find((r) => r.id === session.roomId);
      return room?.name || '';
    case 'sessionTitle':
      return session.sessionTitle;
    case 'description':
      return session.description || '';
    case 'presenterName':
      return session.presenterName;
    case 'presenterFirstName':
      return session.presenterFirstName || '';
    case 'presenterLastName':
      return session.presenterLastName || '';
    case 'presenterEmail':
      return session.presenterEmail || '';
    case 'presenterPhone':
      return session.presenterPhone || '';
    case 'presenterCompany':
      return session.presenterCompany || '';
    case 'presenterTitle':
      return session.presenterTitle || '';
    case 'coPresenterName':
      return session.coPresenterName || '';
    case 'coPresenterEmail':
      return session.coPresenterEmail || '';
    case 'coPresenterPhone':
      return session.coPresenterPhone || '';
    case 'duration':
      return session.duration.toString();
    case 'expectedAttendees':
      return session.expectedAttendees?.toString() || '';
    case 'masteryLevel':
      return session.masteryLevel || '';
    case 'breakoutNumber':
      return session.breakoutNumber?.toString() || '';
    case 'capacityLevel':
      return session.capacityLevel || '';
    default:
      return '';
  }
}

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

// Export with custom field selection and order
export function exportCustomCsv(
  sessions: Session[],
  rooms: Room[],
  fields: ExportField[]
): string {
  const headers = fields.map((f) => f.label);

  const rows = sessions.map((session) => {
    return fields.map((field) => escapeCSV(getFieldValue(session, field.key, rooms)));
  });

  const csvContent = [
    headers.join(','),
    ...rows.map((row) => row.join(',')),
  ].join('\n');

  return csvContent;
}

function escapeCSV(value: string): string {
  // Protect against CSV formula injection - prefix dangerous characters with single quote
  // These characters can trigger formula execution in Excel/Google Sheets
  const dangerousChars = ['=', '+', '-', '@', '\t', '\r'];
  let escapedValue = value;

  if (dangerousChars.some(char => value.startsWith(char))) {
    escapedValue = "'" + value;
  }

  if (escapedValue.includes(',') || escapedValue.includes('"') || escapedValue.includes('\n')) {
    return `"${escapedValue.replace(/"/g, '""')}"`;
  }
  return escapedValue;
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
