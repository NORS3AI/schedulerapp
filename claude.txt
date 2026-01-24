# Conference Scheduler 2026 - Project Synopsis

## Overview
A React/TypeScript web application for scheduling conference sessions. Users import a CSV of presenters/sessions, then visually drag-and-drop to arrange them across days, time slots, and rooms.

## Tech Stack
- React 18 + TypeScript
- Vite (build tool)
- Zustand (state management with localStorage persistence)
- Tailwind CSS (styling)
- dnd-kit (drag-and-drop)
- PapaParse (CSV parsing)
- SheetJS/xlsx (Excel parsing)
- jsPDF + html2canvas (PDF export)

## Current Version: v1.1.4d (January 2026)

## Project Structure
```
src/
├── components/
│   ├── Layout/          # Header, SplitPane
│   ├── Setup/           # WelcomeModal, ImportStep, ColumnMapper, RoomSetup, TimeSlotSetup
│   ├── SessionList/     # SessionList, SessionCard, FilterBar, SessionDetailPopup
│   ├── Scheduler/       # SchedulerGrid, DayTabs, RoomColumn, DropZone, ConflictBadge
│   ├── Presenters/      # PresenterListModal
│   ├── Export/          # ExportMenu, CustomExportModal
│   ├── Settings/        # SettingsModal, ThemeToggle
│   └── Help/            # HelpMenu, AboutModal, PatchNotesModal, ShortcutsModal
├── store/
│   ├── useSchedulerStore.ts  # Main Zustand store
│   └── types.ts              # TypeScript interfaces
├── utils/
│   ├── csvParser.ts          # CSV/Excel parsing, weekday column detection
│   ├── autoScheduler.ts      # Auto-scheduling algorithm
│   ├── conflictDetector.ts   # Scheduling conflict detection
│   ├── availabilityParser.ts # Parses presenter availability from CSV
│   ├── exportCsv.ts          # CSV export
│   └── exportPdf.ts          # PDF export
└── styles/
    └── index.css             # Tailwind imports
```

## Key Features
1. **Import Wizard** - CSV/Excel upload with column mapping
2. **Drag-and-Drop Scheduling** - Visual grid by Day → Time → Room
3. **Session Duplication** - Plus/minus buttons to create multiple teachings of same session
4. **Auto-Scheduling** - Algorithm respects availability, room preferences, conflicts
5. **Conflict Detection** - Presenter conflicts, room conflicts, capacity warnings
6. **Availability System** - Parses presenter availability from CSV weekday columns
7. **Radial Context Menu** - Right-click on cards for quick actions
8. **Rich Text Editing** - Session descriptions support bold, italic, lists, links
9. **Export Options** - PDF, Print, CSV with custom field selection
10. **Dark Mode** - Full theme support

## Recent Changes (v1.1.4a-d)

### v1.1.4d (Latest)
- Session Details: Clean availability display matches Presenters list format
- Availability: Duplicate days consolidated (no repeated day headers)
- Availability: Days sorted in calendar order (Thursday, Friday, Saturday...)
- Availability: Time ranges sorted chronologically within each day

### v1.1.4c
- Availability: Bold day headers (e.g., "Thursday, August 31")
- Availability: Times listed underneath in green with checkmarks
- Availability: Unavailable days shown in orange with "Not available"
- Removed confusing "on 3" or "on 10" text

### v1.1.4b
- Reads ALL weekday columns from spreadsheet (Thursday, Friday, Saturday, etc.)
- Each presenter's times parsed from their individual cells
- Auto-detects columns like "THURSDAY, August 31" pattern

### v1.1.4a
- "I will not be able to teach..." text displays in orange
- Time ranges display in green on separate lines
- Local database stores presenter availability
- Auto-scheduler uses availability database

## Availability System Architecture
The availability system parses CSV data where:
- Weekday columns like "THURSDAY, August 31" contain presenter availability
- Cell values can be time ranges (e.g., "2:45p - 3:35p") or unavailability text
- Data stored in `presenterAvailability` in Zustand store
- Used by auto-scheduler to place sessions only in valid time slots

Key files:
- `src/utils/availabilityParser.ts` - parseAvailabilityEnhanced(), day consolidation
- `src/utils/csvParser.ts` - detectWeekdayAvailabilityColumns()
- `src/store/types.ts` - PresenterAvailabilityEntry, AvailabilityDayDisplay

## Data Models (in src/store/types.ts)
- Session: Presenter info, session title, description, scheduling data
- Room: Name, capacity, features
- TimeSlot: Start/end times
- DayConfig: Day name, time slots, rooms
- PresenterAvailabilityEntry: Availability database entry per presenter
- ParsedAvailability: Structured availability with dayDisplays for UI

## Commands
```bash
npm run dev      # Start dev server at localhost:5173
npm run build    # Build for production (outputs to dist/)
npm run preview  # Preview production build
```

## Files to NOT commit to git
- node_modules/
- dist/
- .claude/
- nul (accidental Windows reserved filename - delete it)

## Notes for Next Session
- Project is ready for GitHub upload
- User was advised to drag-and-drop upload via GitHub web interface
- Exclude node_modules, dist, .claude, and the "nul" file when uploading
- All patch notes from v1.0.0 to v1.1.4d are now documented

## Author
Made by Sterling Grant, 2026
