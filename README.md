# Conference Scheduler 2026

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

## Key Features

- **Import Wizard** - CSV/Excel upload with column mapping
- **Drag-and-Drop Scheduling** - Visual grid by Day, Time, and Room
- **Session Duplication** - Create multiple teachings of the same session
- **Auto-Scheduling** - Algorithm respects availability, room preferences, and conflicts
- **Conflict Detection** - Presenter conflicts, room conflicts, capacity warnings
- **Availability System** - Parses presenter availability from CSV weekday columns
- **Radial Context Menu** - Right-click on cards for quick actions
- **Rich Text Editing** - Session descriptions support bold, italic, lists, links
- **Export Options** - PDF, Print, CSV with custom field selection
- **Dark Mode** - Full theme support

## Getting Started

```bash
cd scheduler-2026
npm install
npm run dev      # Start dev server at localhost:5173
```

## Build

```bash
npm run build    # Build for production (outputs to dist/)
npm run preview  # Preview production build
```

## Author

Made by Sterling Grant, 2026
