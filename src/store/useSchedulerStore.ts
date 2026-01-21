import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Session, Room, TimeSlot, EventConfig, ColumnMapping, AppSettings, SetupStep, DayConfig } from './types';

interface SchedulerState {
  // Sessions
  sessions: Session[];
  setSessions: (sessions: Session[]) => void;
  addSession: (session: Session) => void;
  updateSession: (id: string, updates: Partial<Session>) => void;
  removeSession: (id: string) => void;

  // Event config
  eventConfig: EventConfig;
  setEventConfig: (config: EventConfig) => void;
  setEventName: (name: string) => void;
  setDays: (days: DayConfig[]) => void;
  addDay: (day: DayConfig) => void;
  updateDay: (id: string, updates: Partial<DayConfig>) => void;
  removeDay: (id: string) => void;
  reorderDays: (days: DayConfig[]) => void;

  // Rooms
  addRoom: (room: Room) => void;
  updateRoom: (id: string, updates: Partial<Room>) => void;
  removeRoom: (id: string) => void;
  reorderRooms: (rooms: Room[]) => void;

  // Time slots
  setTimeSlots: (slots: TimeSlot[]) => void;
  addTimeSlot: (slot: TimeSlot) => void;
  removeTimeSlot: (id: string) => void;
  setDayTimeSlots: (dayId: string, slots: TimeSlot[]) => void;

  // Column mapping (for CSV import)
  columnMapping: ColumnMapping;
  setColumnMapping: (mapping: ColumnMapping) => void;

  // Raw CSV data
  rawCsvData: Record<string, string>[];
  setRawCsvData: (data: Record<string, string>[]) => void;
  csvHeaders: string[];
  setCsvHeaders: (headers: string[]) => void;

  // Settings
  settings: AppSettings;
  updateSettings: (updates: Partial<AppSettings>) => void;

  // Setup wizard
  setupStep: SetupStep;
  setSetupStep: (step: SetupStep) => void;
  setupComplete: boolean;
  setSetupComplete: (complete: boolean) => void;

  // UI state
  selectedDay: string;
  setSelectedDay: (day: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  scheduledCollapsed: boolean;
  setScheduledCollapsed: (collapsed: boolean) => void;
  unscheduledCollapsed: boolean;
  setUnscheduledCollapsed: (collapsed: boolean) => void;

  // Drag state
  draggedSessionId: string | null;
  setDraggedSessionId: (id: string | null) => void;

  // Selected session for details popup
  selectedSessionId: string | null;
  setSelectedSessionId: (id: string | null) => void;

  // Session selection for auto-schedule
  selectionMode: boolean;
  setSelectionMode: (mode: boolean) => void;
  selectedSessionIds: Set<string>;
  toggleSessionSelection: (id: string) => void;
  selectAllUnscheduled: () => void;
  clearSelection: () => void;

  // Reset
  resetAll: () => void;
  resetSchedule: () => void;

  // Auto-schedule state for undo
  lastAutoScheduleState: Session[] | null;
  setLastAutoScheduleState: (sessions: Session[] | null) => void;
}

const defaultEventConfig: EventConfig = {
  name: 'My Conference',
  days: [{ id: '1', name: 'Day 1', order: 0 }],
  timeSlots: [],
  rooms: [],
};

const defaultSettings: AppSettings = {
  theme: 'system',
  fontSize: 'medium',
  timeFormat: '12h',
  showConflicts: true,
  autoSave: true,
  scheduledSessionsCollapsed: false,
  allowEditPresenters: false,
  allowEditSessions: false,
};

export const useSchedulerStore = create<SchedulerState>()(
  persist(
    (set) => ({
      // Sessions
      sessions: [],
      setSessions: (sessions) => set({ sessions }),
      addSession: (session) => set((state) => ({
        sessions: [...state.sessions, session]
      })),
      updateSession: (id, updates) => set((state) => ({
        sessions: state.sessions.map((s) =>
          s.id === id ? { ...s, ...updates } : s
        ),
      })),
      removeSession: (id) => set((state) => ({
        sessions: state.sessions.filter((s) => s.id !== id),
      })),

      // Event config
      eventConfig: defaultEventConfig,
      setEventConfig: (config) => set({ eventConfig: config }),
      setEventName: (name) => set((state) => ({
        eventConfig: { ...state.eventConfig, name },
      })),
      setDays: (days) => set((state) => ({
        eventConfig: { ...state.eventConfig, days },
        selectedDay: days[0]?.name || 'Day 1',
      })),
      addDay: (day) => set((state) => ({
        eventConfig: {
          ...state.eventConfig,
          days: [...state.eventConfig.days, day]
        },
      })),
      updateDay: (id, updates) => set((state) => ({
        eventConfig: {
          ...state.eventConfig,
          days: state.eventConfig.days.map((d) =>
            d.id === id ? { ...d, ...updates } : d
          ),
        },
      })),
      removeDay: (id) => set((state) => ({
        eventConfig: {
          ...state.eventConfig,
          days: state.eventConfig.days.filter((d) => d.id !== id),
        },
      })),
      reorderDays: (days) => set((state) => ({
        eventConfig: { ...state.eventConfig, days },
      })),

      // Rooms
      addRoom: (room) => set((state) => ({
        eventConfig: {
          ...state.eventConfig,
          rooms: [...state.eventConfig.rooms, room],
        },
      })),
      updateRoom: (id, updates) => set((state) => ({
        eventConfig: {
          ...state.eventConfig,
          rooms: state.eventConfig.rooms.map((r) =>
            r.id === id ? { ...r, ...updates } : r
          ),
        },
      })),
      removeRoom: (id) => set((state) => ({
        eventConfig: {
          ...state.eventConfig,
          rooms: state.eventConfig.rooms.filter((r) => r.id !== id),
        },
      })),
      reorderRooms: (rooms) => set((state) => ({
        eventConfig: { ...state.eventConfig, rooms },
      })),

      // Time slots
      setTimeSlots: (slots) => set((state) => ({
        eventConfig: { ...state.eventConfig, timeSlots: slots },
      })),
      addTimeSlot: (slot) => set((state) => ({
        eventConfig: {
          ...state.eventConfig,
          timeSlots: [...state.eventConfig.timeSlots, slot],
        },
      })),
      removeTimeSlot: (id) => set((state) => ({
        eventConfig: {
          ...state.eventConfig,
          timeSlots: state.eventConfig.timeSlots.filter((t) => t.id !== id),
        },
      })),
      setDayTimeSlots: (dayId, slots) => set((state) => ({
        eventConfig: {
          ...state.eventConfig,
          days: state.eventConfig.days.map((d) =>
            d.id === dayId ? { ...d, timeSlots: slots } : d
          ),
        },
      })),

      // Column mapping
      columnMapping: {},
      setColumnMapping: (mapping) => set({ columnMapping: mapping }),

      // Raw CSV data
      rawCsvData: [],
      setRawCsvData: (data) => set({ rawCsvData: data }),
      csvHeaders: [],
      setCsvHeaders: (headers) => set({ csvHeaders: headers }),

      // Settings
      settings: defaultSettings,
      updateSettings: (updates) => set((state) => ({
        settings: { ...state.settings, ...updates },
      })),

      // Setup wizard
      setupStep: 'welcome',
      setSetupStep: (step) => set({ setupStep: step }),
      setupComplete: false,
      setSetupComplete: (complete) => set({ setupComplete: complete }),

      // UI state
      selectedDay: 'Day 1',
      setSelectedDay: (day) => set({ selectedDay: day }),
      searchQuery: '',
      setSearchQuery: (query) => set({ searchQuery: query }),
      scheduledCollapsed: false,
      setScheduledCollapsed: (collapsed) => set({ scheduledCollapsed: collapsed }),
      unscheduledCollapsed: false,
      setUnscheduledCollapsed: (collapsed) => set({ unscheduledCollapsed: collapsed }),

      // Drag state
      draggedSessionId: null,
      setDraggedSessionId: (id) => set({ draggedSessionId: id }),

      // Selected session
      selectedSessionId: null,
      setSelectedSessionId: (id) => set({ selectedSessionId: id }),

      // Session selection for auto-schedule
      selectionMode: false,
      setSelectionMode: (mode) => set({ selectionMode: mode, selectedSessionIds: mode ? new Set() : new Set() }),
      selectedSessionIds: new Set(),
      toggleSessionSelection: (id) => set((state) => {
        const newSet = new Set(state.selectedSessionIds);
        if (newSet.has(id)) {
          newSet.delete(id);
        } else {
          newSet.add(id);
        }
        return { selectedSessionIds: newSet };
      }),
      selectAllUnscheduled: () => set((state) => {
        const unscheduledIds = state.sessions
          .filter((s) => !s.day || !s.timeSlot || !s.roomId)
          .map((s) => s.id);
        return { selectedSessionIds: new Set(unscheduledIds) };
      }),
      clearSelection: () => set({ selectedSessionIds: new Set() }),

      // Reset
      resetAll: () => set({
        sessions: [],
        eventConfig: defaultEventConfig,
        columnMapping: {},
        rawCsvData: [],
        csvHeaders: [],
        setupStep: 'welcome',
        setupComplete: false,
        selectedDay: 'Day 1',
        searchQuery: '',
        draggedSessionId: null,
        selectedSessionId: null,
        scheduledCollapsed: false,
        unscheduledCollapsed: false,
        selectionMode: false,
        selectedSessionIds: new Set(),
        lastAutoScheduleState: null,
      }),

      resetSchedule: () => set((state) => ({
        sessions: state.sessions.map((s) => ({
          ...s,
          day: undefined,
          timeSlot: undefined,
          roomId: undefined,
        })),
        lastAutoScheduleState: null,
      })),

      // Auto-schedule state
      lastAutoScheduleState: null,
      setLastAutoScheduleState: (sessions) => set({ lastAutoScheduleState: sessions }),
    }),
    {
      name: 'scheduler-2026-storage',
      partialize: (state) => ({
        sessions: state.sessions,
        eventConfig: state.eventConfig,
        settings: state.settings,
        setupComplete: state.setupComplete,
        selectedDay: state.selectedDay,
        scheduledCollapsed: state.scheduledCollapsed,
        unscheduledCollapsed: state.unscheduledCollapsed,
      }),
    }
  )
);

// Helper function to get time slots for a specific day
export function getTimeSlotsForDay(dayName: string): TimeSlot[] {
  const state = useSchedulerStore.getState();
  const day = state.eventConfig.days.find((d) => d.name === dayName);
  // Return per-day time slots if defined and non-empty, otherwise fall back to global
  return (day?.timeSlots && day.timeSlots.length > 0) ? day.timeSlots : state.eventConfig.timeSlots;
}
