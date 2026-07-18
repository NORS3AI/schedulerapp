export interface ExportField {
  id: string;
  label: string;
  key: string;
}

// All available export fields
export const ALL_EXPORT_FIELDS: ExportField[] = [
  { id: 'day', label: 'Day', key: 'day' },
  { id: 'timeSlot', label: 'Time Slot', key: 'timeSlot' },
  { id: 'room', label: 'Room', key: 'room' },
  { id: 'sessionTitle', label: 'Session Title', key: 'sessionTitle' },
  { id: 'description', label: 'Description', key: 'description' },
  { id: 'presenterName', label: 'Presenter Name', key: 'presenterName' },
  { id: 'presenterFirstName', label: 'Presenter First Name', key: 'presenterFirstName' },
  { id: 'presenterLastName', label: 'Presenter Last Name', key: 'presenterLastName' },
  { id: 'presenterEmail', label: 'Presenter Email', key: 'presenterEmail' },
  { id: 'presenterPhone', label: 'Presenter Phone', key: 'presenterPhone' },
  { id: 'presenterCompany', label: 'Presenter Company', key: 'presenterCompany' },
  { id: 'presenterTitle', label: 'Presenter Title', key: 'presenterTitle' },
  { id: 'coPresenterName', label: 'Co-Presenter Name', key: 'coPresenterName' },
  { id: 'coPresenterEmail', label: 'Co-Presenter Email', key: 'coPresenterEmail' },
  { id: 'coPresenterPhone', label: 'Co-Presenter Phone', key: 'coPresenterPhone' },
  { id: 'duration', label: 'Duration (min)', key: 'duration' },
  { id: 'expectedAttendees', label: 'Expected Attendees', key: 'expectedAttendees' },
  { id: 'masteryLevel', label: 'Mastery Level', key: 'masteryLevel' },
  { id: 'breakoutNumber', label: 'Breakout Number', key: 'breakoutNumber' },
  { id: 'capacityLevel', label: 'Capacity Level', key: 'capacityLevel' },
];
