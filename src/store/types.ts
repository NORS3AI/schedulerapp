// Breakout session (topic) within a presenter's row
export interface BreakoutSession {
  id: string;
  topicTitle: string;
  description?: string;
  breakoutNumber: 1 | 2 | 3;
  // Scheduling
  day?: string;
  timeSlot?: string;
  roomId?: string;
  // Reference to parent presenter
  presenterId: string;
}

// Presenter information (one row from CSV can have multiple breakouts)
export interface Presenter {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  company?: string;
  title?: string; // Job title
  // Co-presenter info
  coPresenterFirstName?: string;
  coPresenterLastName?: string;
  coPresenterEmail?: string;
  coPresenterPhone?: string;
  // Availability - time slots when presenter is NOT available
  unavailability: UnavailabilitySlot[];
  // Original CSV data for preservation
  originalData?: Record<string, string>;
}

// Unavailability slot
export interface UnavailabilitySlot {
  day: string;
  timeSlot: string;
}

// Legacy Session type - now represents a breakout that can be scheduled
export interface Session {
  id: string;
  presenterName: string; // Combined first + last name
  presenterFirstName?: string;
  presenterLastName?: string;
  presenterEmail?: string;
  presenterPhone?: string;
  presenterCompany?: string;
  presenterTitle?: string;
  // Co-presenter
  coPresenterName?: string;
  coPresenterFirstName?: string;
  coPresenterLastName?: string;
  coPresenterEmail?: string;
  coPresenterPhone?: string;
  // Session/Breakout info
  sessionTitle: string;
  description?: string;
  duration: number; // in minutes
  breakoutNumber?: 1 | 2 | 3;
  // Scheduling (can be from CSV or assigned via drag-drop)
  day?: string;
  timeSlot?: string;
  roomId?: string;
  expectedAttendees?: number;
  // Availability - time slots when presenter is NOT available
  unavailability?: UnavailabilitySlot[];
  // Original CSV data for preservation
  originalData?: Record<string, string>;
  // Reference to source presenter row
  sourceRowIndex?: number;
}

// Rooms are manually entered
export interface Room {
  id: string;
  name: string;
  capacity: number;
  features?: string[];
  order: number; // For drag-drop reordering
}

// Day configuration with order
export interface DayConfig {
  id: string;
  name: string;
  order: number;
}

// Time slot configuration
export interface TimeSlot {
  id: string;
  startTime: string; // "09:00"
  endTime: string; // "10:00"
  label?: string; // Optional display label
}

// Event configuration
export interface EventConfig {
  name: string;
  days: DayConfig[];
  timeSlots: TimeSlot[];
  rooms: Room[];
}

// Column mapping value - can be a column name, custom value, or none
export interface ColumnMappingValue {
  type: 'column' | 'custom' | 'none';
  column?: string; // CSV column name
  customValue?: string; // Custom value for all rows
}

// Column mapping for CSV import
export interface ColumnMapping {
  // Presenter info
  presenterFirstName?: ColumnMappingValue;
  presenterLastName?: ColumnMappingValue;
  presenterEmail?: ColumnMappingValue;
  presenterPhone?: ColumnMappingValue;
  presenterCompany?: ColumnMappingValue;
  presenterTitle?: ColumnMappingValue;
  // Co-presenter info
  coPresenterFirstName?: ColumnMappingValue;
  coPresenterLastName?: ColumnMappingValue;
  coPresenterEmail?: ColumnMappingValue;
  coPresenterPhone?: ColumnMappingValue;
  // Breakout 1
  breakout1Title?: ColumnMappingValue;
  breakout1Description?: ColumnMappingValue;
  // Breakout 2
  breakout2Title?: ColumnMappingValue;
  breakout2Description?: ColumnMappingValue;
  // Breakout 3
  breakout3Title?: ColumnMappingValue;
  breakout3Description?: ColumnMappingValue;
  // Other fields
  duration?: ColumnMappingValue;
  expectedAttendees?: ColumnMappingValue;
  // Availability columns (comma-separated or multiple columns)
  unavailableTimes?: ColumnMappingValue;
  // Columns to ignore/delete
  ignoredColumns?: string[];
}

// Conflict types
export interface Conflict {
  type: 'presenter' | 'room' | 'capacity' | 'availability';
  sessionIds: string[];
  message: string;
}

// Extended font size options
export type FontSize = 'smallest' | 'smaller' | 'small' | 'medium' | 'large' | 'larger' | 'huge';

// App settings
export interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  fontSize: FontSize;
  showConflicts: boolean;
  autoSave: boolean;
  scheduledSessionsCollapsed: boolean;
}

// Setup wizard state
export type SetupStep = 'welcome' | 'import' | 'columns' | 'event' | 'rooms' | 'timeslots' | 'complete';
