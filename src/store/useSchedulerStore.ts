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

  // Drag state
  draggedSessionId: string | null;
  setDraggedSessionId: (id: string | null) => void;

  // Selected session for details popup
  selectedSessionId: string | null;
  setSelectedSessionId: (id: string | null) => void;

  // Reset
  resetAll: () => void;
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
  showConflicts: true,
  autoSave: true,
  scheduledSessionsCollapsed: false,
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

      // Drag state
      draggedSessionId: null,
      setDraggedSessionId: (id) => set({ draggedSessionId: id }),

      // Selected session
      selectedSessionId: null,
      setSelectedSessionId: (id) => set({ selectedSessionId: id }),

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
      }),
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
      }),
    }
  )
);
