# Conference Scheduler 2026

**[🚀 Live Demo](https://NORS3AI.github.io/schedulerapp/)**

A powerful React/TypeScript web application for scheduling conference sessions. Import your presenters and sessions, then use drag-and-drop to visually arrange them across days, time slots, and rooms.

## Features

Built for conference organizers who need an intuitive way to:
- Import presenter availability and session data from CSV/Excel
- Drag-and-drop sessions into time slots across multiple days and rooms
- Auto-schedule sessions based on presenter availability and preferences
- Detect and resolve scheduling conflicts
- Export schedules to PDF, CSV, or print-friendly formats

See [features.md](features.md) for a complete feature list.

## Quick Start

### Development
```bash
npm install
npm run dev
```
Visit `http://localhost:5173` to view the application.

### Build for Production
```bash
npm run build
npm run preview
```

## Tech Stack

- **React 18** + **TypeScript** - Modern UI framework with type safety
- **Vite** - Lightning-fast build tool and dev server
- **Zustand** - Lightweight state management with localStorage persistence
- **Tailwind CSS** - Utility-first styling
- **dnd-kit** - Accessible drag-and-drop functionality
- **PapaParse** - CSV parsing
- **SheetJS/xlsx** - Excel file support
- **jsPDF + html2canvas** - PDF export capabilities

## Project Structure

```
src/
├── components/
│   ├── Layout/          # Header, SplitPane
│   ├── Setup/           # Import wizard components
│   ├── SessionList/     # Session management and filtering
│   ├── Scheduler/       # Drag-and-drop scheduling grid
│   ├── Presenters/      # Presenter management
│   ├── Export/          # Export and sharing features
│   ├── Settings/        # App settings and themes
│   └── Help/            # Help system and documentation
├── store/
│   ├── useSchedulerStore.ts  # Main state management
│   └── types.ts              # TypeScript interfaces
├── utils/
│   ├── csvParser.ts          # Data import utilities
│   ├── autoScheduler.ts      # Auto-scheduling algorithm
│   ├── conflictDetector.ts   # Conflict detection
│   ├── availabilityParser.ts # Availability parsing
│   └── export*.ts            # Export utilities
└── styles/
    └── index.css             # Global styles
```

## How It Works

1. **Import** - Upload a CSV or Excel file containing your sessions and presenter information
2. **Map Columns** - Match your spreadsheet columns to the required fields
3. **Configure** - Set up days, time slots, and rooms for your conference
4. **Schedule** - Drag-and-drop sessions into the grid or use auto-scheduling
5. **Export** - Generate PDFs, CSVs, or print your final schedule

## Availability System

The scheduler intelligently parses presenter availability from your spreadsheet:
- Detects weekday columns (e.g., "THURSDAY, August 31")
- Parses time ranges and unavailability notes
- Auto-scheduler respects availability constraints
- Visual conflict detection when scheduling outside availability

## Version

Current Version: **v1.1.4d** (January 2026)

See [Claude.md](Claude.md) for detailed project documentation and changelog.

## Author

Made by Sterling Grant, 2026

## License

This project is private and proprietary.
